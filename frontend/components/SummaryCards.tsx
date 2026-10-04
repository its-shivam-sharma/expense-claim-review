type Stats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};

function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export function SummaryCards({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <SummaryCard title="Total Claims" value={stats.total} />
      <SummaryCard title="Pending Review" value={stats.pending} />
      <SummaryCard title="Approved" value={stats.approved} />
      <SummaryCard title="Rejected" value={stats.rejected} />
    </div>
  );
}