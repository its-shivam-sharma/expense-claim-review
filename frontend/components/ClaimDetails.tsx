
import { useClaimReview } from "@/hooks/useClaimReview";
import { useReviewHistory } from "@/hooks/useReviewHistory";
import type { Claim } from "@/lib/types";
import { AIReviewPanel } from "./AIReviewPanel";
import { Info } from "./Info";
import { ReviewHistory } from "./ReviewHistory";
import { StatusBadge } from "./StatusBadge";
import { ValidationPanel } from "./ValidationPanel";
import { ReviewerActions } from "./ReviewerActions";

type ClaimDetailsProps = {
  claim: Claim;
  onMessage: (message: string) => void;
  onClaimsChanged: () => Promise<void>;
};

// Rendered with key={claim.id}, so validation and reason reset per claim.
export function ClaimDetails({
  claim,
  onMessage,
  onClaimsChanged,
}: ClaimDetailsProps) {
  const { history, reloadHistory } = useReviewHistory(claim.id, onMessage);

  const review = useClaimReview({
    claimId: claim.id,
    onMessage,
    onChanged: async () => {
      await Promise.all([onClaimsChanged(), reloadHistory()]);
    },
  });

  const busy = review.activeTask !== null;

  return (
    <>
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {claim.claimant}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{claim.description}</p>
          </div>
          <StatusBadge status={claim.status} />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Info label="Category" value={claim.category} />
          <Info label="Amount" value={`${claim.currency} ${claim.amount}`} />
          <Info label="Date" value={new Date(claim.date).toLocaleDateString()} />
          <Info
            label="Receipt"
            value={claim.receiptAvailable ? "Available" : "Missing"}
          />
        </div>
      </div>

      <ValidationPanel
        validation={review.validation}
        running={review.activeTask === "validate"}
        disabled={busy}
        onRun={review.validate}
      />

      <AIReviewPanel
        claim={claim}
        running={review.activeTask === "ai-review"}
        disabled={busy}
        onRun={review.runAIReview}
      />

      <ReviewerActions
        reason={review.reason}
        disabled={busy}
        onReasonChange={review.setReason}
        onAction={review.decide}
      />

      <ReviewHistory history={history} />
    </>
  );
}