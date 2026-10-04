import type { HistoryItem } from "../lib/types";

export function ReviewHistory({ history }: { history: HistoryItem[] }) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Review History</h3>

      {history.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No review history yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {history.map((item) => (
            <div key={item.id} className="rounded-lg bg-slate-50 p-4">
              <div className="flex justify-between">
                <span className="font-medium text-slate-900">{item.action}</span>
                <span className="text-xs text-slate-400">
                  {new Date(item.createdAt).toLocaleString()}
                </span>
              </div>

              {item.details && (
                <p className="mt-1 text-sm text-slate-600">{item.details}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}