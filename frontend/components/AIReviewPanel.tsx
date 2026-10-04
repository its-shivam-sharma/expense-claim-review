import type { Claim } from "../lib/types";
import { Info } from "./Info";


type AIReviewPanelProps = {
  claim: Claim;
  running: boolean;
  disabled: boolean;
  onRun: () => void;
};

export function AIReviewPanel({
  claim,
  running,
  disabled,
  onRun,
}: AIReviewPanelProps) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">AI Review</h3>
          <p className="mt-1 text-sm text-slate-500">
            AI classification and policy evidence.
          </p>
        </div>

        <button
          onClick={onRun}
          disabled={disabled}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {running ? "Reviewing..." : "Run AI Review"}
        </button>
      </div>

      {claim.aiCategory ? (
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Info label="AI Category" value={claim.aiCategory} />
            <Info
              label="Confidence"
              value={`${Math.round((claim.aiConfidence ?? 0) * 100)}%`}
            />
          </div>

          {claim.aiUncertain && (
            <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700">
              AI marked this classification as uncertain.
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-slate-700">Explanation</p>
            <p className="mt-1 text-sm text-slate-600">{claim.aiExplanation}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700">Policy Evidence</p>
            <p className="mt-1 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              {claim.policyEvidence}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          AI review has not been run yet.
        </p>
      )}
    </div>
  );
}