import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";
import { validateClaim } from "../services/claimValidation.js";
import { reviewClaimWithAI } from "../services/aiReview.js";

const router = Router();

const createClaimSchema = z.object({
  claimant: z.string().trim().min(1, "Claimant is required"),
  date: z.coerce.date({ message: "A valid date is required" }),
  category: z.string().trim().min(1, "Category is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  currency: z.string().trim().min(1, "Currency is required"),
  description: z.string().trim().min(1, "Description is required"),
  receiptAvailable: z.boolean().default(false),
});

const reviewSchema = z
  .object({
    action: z.enum(["APPROVE", "REJECT", "REQUEST_CLARIFICATION", "OVERRIDE"]),
    reason: z.string().trim().optional(),
  })
  .refine((data) => data.action === "APPROVE" || Boolean(data.reason), {
    message: "Reason is required for this action",
    path: ["reason"],
  });

const STATUS_BY_ACTION = {
  APPROVE: "APPROVED",
  REJECT: "REJECTED",
  REQUEST_CLARIFICATION: "CLARIFICATION",
  OVERRIDE: "NEEDS_REVIEW",
} as const;

// Express 5 forwards rejected promises to the error middleware,
// so these handlers don't need their own try/catch.

router.post("/", async (req, res) => {
  const data = createClaimSchema.parse(req.body);
  const claim = await prisma.claim.create({ data });

  res.status(201).json({ success: true, data: claim });
});

router.get("/", async (_req, res) => {
  const claims = await prisma.claim.findMany({
    orderBy: { createdAt: "desc" },
  });

  res.json({ success: true, data: claims });
});

router.post("/:id/validate", async (req, res) => {
  const result = await validateClaim(req.params.id);

  res.json({ success: true, data: result });
});

router.post("/:id/ai-review", async (req, res) => {
  const result = await reviewClaimWithAI(req.params.id);

  res.json({ success: true, data: result });
});

router.post("/:id/review", async (req, res) => {
  const { action, reason } = reviewSchema.parse(req.body);

  const claim = await prisma.claim.findUnique({
    where: { id: req.params.id },
  });

  if (!claim) {
    throw new AppError("Claim not found", 404);
  }

  // Review record, history entry and status change succeed or fail together.
  const [review, updatedClaim] = await prisma.$transaction([
    prisma.review.create({
      data: { claimId: claim.id, action, reason: reason || null },
    }),
    prisma.claim.update({
      where: { id: claim.id },
      data: { status: STATUS_BY_ACTION[action] },
    }),
    prisma.reviewHistory.create({
      data: { claimId: claim.id, action, details: reason || null },
    }),
  ]);

  res.json({
    success: true,
    message: "Review recorded successfully",
    data: { claim: updatedClaim, review },
  });
});

router.get("/:id/history", async (req, res) => {
  const history = await prisma.reviewHistory.findMany({
    where: { claimId: req.params.id },
    orderBy: { createdAt: "desc" },
  });

  res.json({ success: true, data: history });
});

export default router;