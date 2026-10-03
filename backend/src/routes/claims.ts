import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { validateClaim } from "../services/claimValidation.js";
import { reviewClaimWithAI } from "../services/aiReview.js";

const router = Router();

// Create Claim
router.post("/", async (req, res) => {
  try {
    const {
      claimant,
      date,
      category,
      amount,
      currency,
      description,
      receiptAvailable,
    } = req.body;

    const claim = await prisma.claim.create({
      data: {
        claimant,
        date: new Date(date),
        category,
        amount: Number(amount),
        currency,
        description,
        receiptAvailable: Boolean(receiptAvailable),
      },
    });

    res.status(201).json({
      success: true,
      data: claim,
    });
  } catch (error) {
    console.error("Create claim error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create claim",
    });
  }
});

// Get All Claims
router.get("/", async (_req, res) => {
  try {
    const claims = await prisma.claim.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      data: claims,
    });
  } catch (error) {
    console.error("Get claims error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch claims",
    });
  }
});

// Deterministic Validation
router.post("/:id/validate", async (req, res) => {
  try {
    const result = await validateClaim(req.params.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Validation error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to validate claim",
    });
  }
});

// AI Review
router.post("/:id/ai-review", async (req, res) => {
  try {
    const result = await reviewClaimWithAI(req.params.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("AI review error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to review claim with AI",
    });
  }
});

// Reviewer Decision
router.post("/:id/review", async (req, res) => {
  try {
    const { action, reason } = req.body;

    const allowedActions = [
      "APPROVE",
      "REJECT",
      "REQUEST_CLARIFICATION",
      "OVERRIDE",
    ];

    // Validate action
    if (!allowedActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review action",
      });
    }

    // Reason required for these actions
    if (
      ["REJECT", "REQUEST_CLARIFICATION", "OVERRIDE"].includes(action) &&
      !reason?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Reason is required for this action",
      });
    }

    // Find claim
    const claim = await prisma.claim.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: "Claim not found",
      });
    }

    // Determine claim status
    let status:
      | "APPROVED"
      | "REJECTED"
      | "CLARIFICATION"
      | "NEEDS_REVIEW";

    // Determine review action
    let reviewAction:
      | "APPROVE"
      | "REJECT"
      | "REQUEST_CLARIFICATION"
      | "OVERRIDE";

    switch (action) {
      case "APPROVE":
        status = "APPROVED";
        reviewAction = "APPROVE";
        break;

      case "REJECT":
        status = "REJECTED";
        reviewAction = "REJECT";
        break;

      case "REQUEST_CLARIFICATION":
        status = "CLARIFICATION";
        reviewAction = "REQUEST_CLARIFICATION";
        break;

      case "OVERRIDE":
        status = "NEEDS_REVIEW";
        reviewAction = "OVERRIDE";
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid review action",
        });
    }

    // Create review record
    const review = await prisma.review.create({
      data: {
        claimId: claim.id,
        action: reviewAction,
        reason: reason?.trim() || null,
      },
    });

    // Create history record
    await prisma.reviewHistory.create({
      data: {
        claimId: claim.id,
        action: reviewAction,
        details: reason?.trim() || null,
      },
    });

    // Update claim status
    const updatedClaim = await prisma.claim.update({
      where: {
        id: claim.id,
      },
      data: {
        status,
      },
    });

    res.json({
      success: true,
      message: `Claim ${action.toLowerCase()} successfully`,
      data: {
        claim: updatedClaim,
        review,
      },
    });
  } catch (error) {
    console.error("Review error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to review claim",
    });
  }
});

// Get Review History
// router.get("/:id/history", async (req, res) => {
//   try {
//     const history = await prisma.reviewHistory.findMany({
//       where: {
//         claimId: req.params.id,
//       },
//       orderBy: {
//         createdAt: "desc",
//       },
//     });

//     res.json({
//       success: true,
//       data: history,
//     });
//   } catch (error) {
//     console.error("History error:", error);

//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch review history",
//     });
//   }
// });

router.get("/:id/history", async (req, res) => {
  try {
    const history = await prisma.reviewHistory.findMany({
      where: {
        claimId: req.params.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("History error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch review history",
    });
  }
});

export default router;