import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";

const DEFAULT_MODEL = "gemini-3.8-flash";

const aiResponseSchema = z.object({
  policyId: z.string().nullable().catch(null),
  category: z.string(),
  confidence: z.coerce.number().min(0).max(1).catch(0),
  uncertain: z.boolean().catch(false),
  explanation: z.string(),
  needsClarification: z.boolean().catch(false),
  clarificationQuestions: z.array(z.string()).catch([]),
});

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

function buildPrompt(claim: Record<string, unknown>, policies: unknown[]) {
  return `
You are an Expense Claim Policy Review Assistant.

Review the following expense claim against the provided company policies.

CLAIM:
${JSON.stringify(claim)}

AVAILABLE POLICIES:
${JSON.stringify(policies)}

Rules:
1. Pick the single most relevant policy and return its id as policyId.
2. Use ONLY the provided policies. Do not invent policy rules.
3. Explain whether the claim appears compliant, needs clarification, or needs review.
4. If information is insufficient or the classification is uncertain, set uncertain to true.
5. Confidence must be between 0 and 1.
6. Return ONLY valid JSON.

Return exactly this structure:
{
  "policyId": "id of the matching policy, or null if none applies",
  "category": "string",
  "confidence": 0.0,
  "uncertain": false,
  "explanation": "string",
  "needsClarification": false,
  "clarificationQuestions": []
}
`;
}

const RETRYABLE_STATUSES = new Set([429, 500, 503, 504]);
const MAX_ATTEMPTS = 3;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;

  if (!apiKey) {
    throw new AppError("GEMINI_API_KEY is not configured", 500);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });

    if (response.ok) {
      const data = (await response.json()) as GeminiResponse;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new AppError("AI provider returned an empty response", 502);
      }

      return text;
    }

    const body = await response.text();
    console.error(`Gemini attempt ${attempt} failed:`, response.status, body);

    const canRetry = RETRYABLE_STATUSES.has(response.status) && attempt < MAX_ATTEMPTS;

    if (!canRetry) {
      if (RETRYABLE_STATUSES.has(response.status)) {
        throw new AppError("AI service is busy, please try again shortly", 503);
      }
      throw new AppError("AI provider request failed", 502);
    }

    await sleep(1000 * 2 ** (attempt - 1)); // 1s, then 2s
  }

  throw new AppError("AI provider request failed", 502);
}

// async function callGemini(prompt: string): Promise<string> {
//   const apiKey = process.env.GEMINI_API_KEY;
//   const model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;

//   if (!apiKey) {
//     throw new AppError("GEMINI_API_KEY is not configured", 500);
//   }

//   const response = await fetch(
//     `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
//     {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "x-goog-api-key": apiKey,
//       },
//       body: JSON.stringify({
//         contents: [{ role: "user", parts: [{ text: prompt }] }],
//         generationConfig: { responseMimeType: "application/json" },
//       }),
//     }
//   );

//   if (!response.ok) {
//     console.error("Gemini request failed:", response.status, await response.text());
//     throw new AppError("AI provider request failed", 502);
//   }

//   const data = (await response.json()) as GeminiResponse;
//   const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

//   if (!text) {
//     throw new AppError("AI provider returned an empty response", 502);
//   }

//   return text;
// }

export async function reviewClaimWithAI(claimId: string) {
  const claim = await prisma.claim.findUnique({ where: { id: claimId } });

  if (!claim) {
    throw new AppError("Claim not found", 404);
  }

  const policies = await prisma.policy.findMany({
    select: {
      id: true,
      category: true,
      content: true,
      categoryLimit: true,
      currency: true,
    },
  });

  const prompt = buildPrompt(
    {
      claimant: claim.claimant,
      date: claim.date,
      category: claim.category,
      amount: claim.amount,
      currency: claim.currency,
      description: claim.description,
      receiptAvailable: claim.receiptAvailable,
    },
    policies
  );

  const raw = await callGemini(prompt);

  let result: z.infer<typeof aiResponseSchema>;
  try {
    result = aiResponseSchema.parse(JSON.parse(raw));
  } catch (error) {
    console.error("Invalid AI response:", raw, error);
    throw new AppError("AI returned an invalid response", 502);
  }

  // Evidence comes from our own policy table, never from model output.
  const selectedPolicy = policies.find((p) => p.id === result.policyId);
  const policyEvidence = selectedPolicy?.content ?? "No matching policy found";
  const uncertain = result.uncertain || !selectedPolicy;

  await prisma.claim.update({
    where: { id: claimId },
    data: {
      aiCategory: result.category,
      aiConfidence: result.confidence,
      aiExplanation: result.explanation,
      policyEvidence,
      aiUncertain: uncertain,
      policyId: selectedPolicy?.id ?? null,
    },
  });

  return {
    category: result.category,
    confidence: result.confidence,
    uncertain,
    explanation: result.explanation,
    policyEvidence,
    needsClarification: result.needsClarification,
    clarificationQuestions: result.clarificationQuestions,
  };
}