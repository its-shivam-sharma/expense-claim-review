import type { ReviewAction } from "../lib/types";

const ACTION_BUTTONS: { action: ReviewAction; label: string; className: string }[] = [
  { action: "APPROVE", label: "Approve", className: "bg-green-600 text-white" },
  { action: "REJECT", label: "Reject", className: "bg-red-600 text-white" },
  {
    action: "REQUEST_CLARIFICATION",
    label: "Request Clarification",
    className: "bg-yellow-500 text-white",
  },
  {
    action: "OVERRIDE",
    label: "Override AI",
    className: "border border-slate-300 text-slate-700",
  },
];

type ReviewerActionsProps = {
  reason: string;
  disabled: boolean;
  onReasonChange: (reason: string) => void;
  onAction: (action: ReviewAction) => void;
};

export function ReviewerActions({
  reason,
  disabled,
  onReasonChange,
  onAction,
}: ReviewerActionsProps) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Reviewer Decision</h3>
      <p className="mt-1 text-sm text-slate-500">
        Human reviewer makes the final decision.
      </p>

      <textarea
        value={reason}
        onChange={(e) => onReasonChange(e.target.value)}
        placeholder="Reason required for reject, clarification, or override..."
        className="mt-4 min-h-24 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500"
      />

      <div className="mt-4 flex flex-wrap gap-3">
        {ACTION_BUTTONS.map(({ action, label, className }) => (
          <button
            key={action}
            onClick={() => onAction(action)}
            disabled={disabled}
            className={`rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 ${className}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}