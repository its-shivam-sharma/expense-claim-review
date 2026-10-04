import type { ValidationResult } from "../lib/types";

type ValidationPanelProps = {
  validation: ValidationResult | null;
  running: boolean;
  disabled: boolean;
  onRun: () => void;
};

export function ValidationPanel({
  validation,
  running,
  disabled,
  onRun,
}: ValidationPanelProps) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">
        Deterministic Validation
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        Checks required fields, duplicates, receipts, dates and policy limits.
      </p>

      <button
        onClick={onRun}
        disabled={disabled}
        className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {running ? "Checking..." : "Run Validation"}
      </button>

      {validation && (
        <div className="mt-4 space-y-3">
          <div
            className={`rounded-lg p-3 text-sm ${
              validation.valid
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {validation.valid
              ? "Claim passed deterministic validation."
              : "Claim has validation issues."}
          </div>

          {validation.errors.map((error) => (
            <p key={error} className="rounded bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          ))}

          {validation.warnings.map((warning) => (
            <p
              key={warning}
              className="rounded bg-yellow-50 p-3 text-sm text-yellow-700"
            >
              {warning}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}