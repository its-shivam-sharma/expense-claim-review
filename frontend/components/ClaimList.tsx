import type { Claim } from "../lib/types";
import { StatusBadge } from "./StatusBadge";

type ClaimListProps = {
  claims: Claim[];
  selectedId?: string;
  loading: boolean;
  onSelect: (claimId: string) => void;
  onCreate: () => void;
};

export function ClaimList({
  claims,
  selectedId,
  loading,
  onSelect,
  onCreate,
}: ClaimListProps) {
  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Claims</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
          {claims.length}
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading claims...</p>
      ) : claims.length === 0 ? (
        <div className="rounded-lg bg-slate-50 p-5 text-center">
          <p className="text-sm text-slate-500">No claims found.</p>
          <button
            onClick={onCreate}
            className="mt-3 text-sm font-medium text-blue-600"
          >
            Create your first claim
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map((claim) => (
            <button
              key={claim.id}
              onClick={() => onSelect(claim.id)}
              className={`w-full rounded-lg border p-4 text-left transition ${
                selectedId === claim.id
                  ? "border-blue-500 bg-blue-50"
                  : "hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-900">
                  {claim.claimant}
                </span>
                <StatusBadge status={claim.status} />
              </div>

              <p className="mt-2 text-sm text-slate-600">
                {claim.category} · {claim.currency} {claim.amount}
              </p>
              <p className="mt-1 truncate text-xs text-slate-400">
                {claim.description}
              </p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}