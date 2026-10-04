import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";

export async function validateClaim(claimId: string) {
  const claim = await prisma.claim.findUnique({ where: { id: claimId } });

  if (!claim) {
    throw new AppError("Claim not found", 404);
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  if (!claim.claimant.trim()) errors.push("Claimant is required");
  if (!claim.category.trim()) errors.push("Category is required");
  if (!claim.description.trim()) errors.push("Description is required");
  if (!claim.currency.trim()) errors.push("Currency is required");
  if (claim.amount <= 0) errors.push("Amount must be greater than 0");

  if (!claim.receiptAvailable) {
    warnings.push("Receipt is missing");
  }

  if (claim.date > new Date()) {
    errors.push("Claim date cannot be in the future");
  }

  const policy = await prisma.policy.findFirst({
    where: { category: claim.category },
  });

  if (
    policy?.categoryLimit !== null &&
    policy?.categoryLimit !== undefined &&
    claim.amount > policy.categoryLimit
  ) {
    errors.push(
      `Claim amount exceeds ${claim.category} limit of ${policy.categoryLimit} ${claim.currency}`
    );
  }

  // Same claimant, date, category, amount and currency counts as a duplicate.
  const duplicate = await prisma.claim.findFirst({
    where: {
      claimant: claim.claimant,
      date: claim.date,
      category: claim.category,
      amount: claim.amount,
      currency: claim.currency,
      id: { not: claim.id },
    },
  });

  if (duplicate) {
    errors.push("Possible duplicate claim detected");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}