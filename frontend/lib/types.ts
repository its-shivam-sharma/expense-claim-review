export type Claim = {
  id: string;
  claimant: string;
  date: string;
  category: string;
  amount: number;
  currency: string;
  description: string;
  receiptAvailable: boolean;
  status: string;
  aiCategory?: string | null;
  aiConfidence?: number | null;
  aiExplanation?: string | null;
  policyEvidence?: string | null;
  aiUncertain?: boolean;
};

export type NewClaimInput = {
  claimant: string;
  date: string;
  category: string;
  amount: number;
  currency: string;
  description: string;
  receiptAvailable: boolean;
};

export type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export type HistoryItem = {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
};

export type ReviewAction =
  | "APPROVE"
  | "REJECT"
  | "REQUEST_CLARIFICATION"
  | "OVERRIDE";

export const ACTIONS_REQUIRING_REASON: ReviewAction[] = [
  "REJECT",
  "REQUEST_CLARIFICATION",
  "OVERRIDE",
];