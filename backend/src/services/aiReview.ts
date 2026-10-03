import { prisma } from "../lib/prisma.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";

export async function reviewClaimWithAI(claimId: string) {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
  });

  if (!claim) {
    throw new Error("Claim not found");
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

  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const prompt = `
You are an Expense Claim Policy Review Assistant.

Review the following expense claim against the provided company policies.

CLAIM:
${JSON.stringify({
  claimant: claim.claimant,
  date: claim.date,
  category: claim.category,
  amount: claim.amount,
  currency: claim.currency,
  description: claim.description,
  receiptAvailable: claim.receiptAvailable,
})}

AVAILABLE POLICIES:
${JSON.stringify(policies)}

Rules:
1. Classify the expense into the most relevant policy category.
2. Use ONLY the provided policies.
3. Do not invent policy rules.
4. Explain whether the claim appears compliant, needs clarification, or needs review.
5. Cite the relevant policy evidence by quoting the relevant policy content briefly.
6. If information is insufficient or classification is uncertain, mark uncertain=true.
7. Confidence must be between 0 and 1.
8. Return ONLY valid JSON.

Return exactly this structure:
{
  "category": "string",
  "confidence": 0.0,
  "uncertain": false,
  "explanation": "string",
  "policyEvidence": "string",
  "needsClarification": false,
  "clarificationQuestions": []
}
`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  const content =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    throw new Error("Gemini returned an empty response");
  }

  const result = JSON.parse(content);

  const confidence = Math.max(
    0,
    Math.min(1, Number(result.confidence) || 0)
  );

  const selectedPolicy = policies.find(
    (policy) =>
      policy.category.toLowerCase() ===
      String(result.category).toLowerCase()
  );

  await prisma.claim.update({
    where: { id: claimId },
    data: {
      aiCategory: result.category,
      aiConfidence: confidence,
      aiExplanation: result.explanation,
      policyEvidence: result.policyEvidence,
      aiUncertain: Boolean(result.uncertain),
      policyId: selectedPolicy?.id ?? null,
    },
  });

  return {
    category: result.category,
    confidence,
    uncertain: Boolean(result.uncertain),
    explanation: result.explanation,
    policyEvidence: result.policyEvidence,
    needsClarification: Boolean(result.needsClarification),
    clarificationQuestions: Array.isArray(
      result.clarificationQuestions
    )
      ? result.clarificationQuestions
      : [],
  };
}