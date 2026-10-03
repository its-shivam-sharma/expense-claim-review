"use client";

import { useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

type Claim = {
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

type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

type HistoryItem = {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
};

export default function Home() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const totalClaims = claims.length;

const pendingClaims = claims.filter(
  (claim) =>
    claim.status !== "APPROVED" &&
    claim.status !== "REJECTED"
).length;

const approvedClaims = claims.filter(
  (claim) => claim.status === "APPROVED"
).length;

const rejectedClaims = claims.filter(
  (claim) => claim.status === "REJECTED"
).length;
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  const [validation, setValidation] =
    useState<ValidationResult | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [reason, setReason] = useState("");

  // Create Claim
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [form, setForm] = useState({
    claimant: "",
    date: "",
    category: "Meals",
    amount: "",
    currency: "INR",
    description: "",
    receiptAvailable: true,
  });

  // -----------------------------
  // Load Claims
  // -----------------------------
  async function loadClaims() {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/claims`);
      const result = await response.json();

      if (!result.success) {
        throw new Error();
      }

      setClaims(result.data);

      if (result.data.length > 0 && !selectedClaim) {
        setSelectedClaim(result.data[0]);
      }
    } catch {
      setMessage("Failed to connect to backend.");
    } finally {
      setLoading(false);
    }
  }

  // -----------------------------
  // Load Review History
  // -----------------------------
  useEffect(() => {
    if (!selectedClaim) return;

    const claimId = selectedClaim.id;

    async function loadHistory() {
      try {
        const response = await fetch(
          `${API_URL}/claims/${claimId}/history`
        );

        const result = await response.json();

        if (result.success) {
          setHistory(result.data);
        }
      } catch {
        setMessage("Failed to load review history.");
      }
    }

    loadHistory();
  }, [selectedClaim?.id]);

  // -----------------------------
  // Initial Load
  // -----------------------------
  useEffect(() => {
    loadClaims();
  }, []);

  // -----------------------------
  // Select Claim
  // -----------------------------
  function selectClaim(claim: Claim) {
    setSelectedClaim(claim);
    setValidation(null);
    setHistory([]);
    setReason("");
    setMessage("");
  }

  // -----------------------------
  // Deterministic Validation
  // -----------------------------
  async function validateClaim() {
    if (!selectedClaim) return;

    try {
      setActionLoading(true);
      setMessage("");

      const response = await fetch(
        `${API_URL}/claims/${selectedClaim.id}/validate`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error();
      }

      setValidation(result.data);
    } catch {
      setMessage("Validation failed.");
    } finally {
      setActionLoading(false);
    }
  }

  // -----------------------------
  // AI Review
  // -----------------------------
  async function runAIReview() {
    if (!selectedClaim) return;

    try {
      setActionLoading(true);
      setMessage("");

      const response = await fetch(
        `${API_URL}/claims/${selectedClaim.id}/ai-review`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error();
      }

      setSelectedClaim({
        ...selectedClaim,
        aiCategory: result.data.category,
        aiConfidence: result.data.confidence,
        aiExplanation: result.data.explanation,
        policyEvidence: result.data.policyEvidence,
        aiUncertain: result.data.uncertain,
      });

      setMessage("AI review completed successfully.");

      await loadClaims();
    } catch {
      setMessage("AI review failed.");
    } finally {
      setActionLoading(false);
    }
  }

  // -----------------------------
  // Reviewer Decision
  // -----------------------------
  async function reviewClaim(action: string) {
    if (!selectedClaim) return;

    if (
      ["REJECT", "REQUEST_CLARIFICATION", "OVERRIDE"].includes(action) &&
      !reason.trim()
    ) {
      setMessage("Please enter a reason.");
      return;
    }

    try {
      setActionLoading(true);
      setMessage("");

      const response = await fetch(
        `${API_URL}/claims/${selectedClaim.id}/review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            reason: reason.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error();
      }

      setSelectedClaim(result.data.claim);
      setReason("");

      setMessage(result.message);

      await loadClaims();
    } catch {
      setMessage("Review action failed.");
    } finally {
      setActionLoading(false);
    }
  }

  // -----------------------------
  // Create Claim
  // -----------------------------
  async function createClaim() {
    if (
      !form.claimant ||
      !form.date ||
      !form.category ||
      !form.amount ||
      !form.description
    ) {
      setMessage("Please fill all required fields.");
      return;
    }

    try {
      setActionLoading(true);
      setMessage("");

      const response = await fetch(`${API_URL}/claims`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          claimant: form.claimant,
          date: form.date,
          category: form.category,
          amount: Number(form.amount),
          currency: form.currency,
          description: form.description,
          receiptAvailable: form.receiptAvailable,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error();
      }

      setShowCreateForm(false);

      setForm({
        claimant: "",
        date: "",
        category: "Meals",
        amount: "",
        currency: "INR",
        description: "",
        receiptAvailable: true,
      });

      setMessage("Claim created successfully.");

      await loadClaims();

      setSelectedClaim(result.data);
    } catch {
      setMessage("Failed to create claim.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Expense Claim Review
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Review claims using deterministic checks and AI assistance.
            </p>
          </div>

          <button
            onClick={() => {
              setMessage("");
              setShowCreateForm(true);
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + New Claim
          </button>
        </div>
      </header>

      {/* Create Claim Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">
                Create New Claim
              </h2>

              <button
                onClick={() => setShowCreateForm(false)}
                className="text-xl text-slate-400 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {/* Claimant */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Claimant *
                </label>

                <input
                  placeholder="e.g. Shivam Sharma"
                  value={form.claimant}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      claimant: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 dark:placeholder:text-slate-400"
                />
              </div>

              {/* Date */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Date *
                </label>

                <input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      date: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-blue-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Category *
                </label>

                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      category: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-blue-500"
                >
                  <option value="Meals">Meals</option>
                  <option value="Travel">Travel</option>
                  <option value="Accommodation">
                    Accommodation
                  </option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Amount + Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Amount *
                  </label>

                  <input
                    type="number"
                    min="0"
                    placeholder="2500"
                    value={form.amount}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        amount: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Currency
                  </label>

                  <select
                    value={form.currency}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        currency: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-blue-500"
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Description *
                </label>

                <textarea
                  placeholder="e.g. Dinner with client"
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                  className="min-h-24 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500"
                />
              </div>

              {/* Receipt */}
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.receiptAvailable}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      receiptAvailable: e.target.checked,
                    })
                  }
                />

                Receipt available
              </label>

              {/* Create Button */}
              <button
                onClick={createClaim}
                disabled={actionLoading}
                className="w-full rounded-lg bg-blue-600 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? "Creating..." : "Create Claim"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Dashboard Summary */}
<div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-6 pt-6 md:grid-cols-4">
  <SummaryCard title="Total Claims" value={totalClaims} />
  <SummaryCard title="Pending Review" value={pendingClaims} />
  <SummaryCard title="Approved" value={approvedClaims} />
  <SummaryCard title="Rejected" value={rejectedClaims} />
</div>

      {/* Main Dashboard */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-6 lg:grid-cols-3">
        {/* Claims List */}
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Claims</h2>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
              {claims.length}
            </span>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">
              Loading claims...
            </p>
          ) : claims.length === 0 ? (
            <div className="rounded-lg bg-slate-50 p-5 text-center">
              <p className="text-sm text-slate-500">
                No claims found.
              </p>

              <button
                onClick={() => setShowCreateForm(true)}
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
                  onClick={() => selectClaim(claim)}
                  className={`w-full rounded-lg border p-4 text-left transition ${
                    selectedClaim?.id === claim.id
                      ? "border-blue-500 bg-blue-50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">
                      {claim.claimant}
                    </span>

                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                      {claim.status}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-600">
                    {claim.category} · {claim.currency}{" "}
                    {claim.amount}
                  </p>

                  <p className="mt-1 truncate text-xs text-slate-400">
                    {claim.description}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Claim Details */}
        <section className="space-y-6 lg:col-span-2">
          {!selectedClaim ? (
            <div className="rounded-xl border bg-white p-8 text-center">
              <p className="text-slate-500">
                Select a claim to start the review.
              </p>
            </div>
          ) : (
            <>
              {/* Claim Information */}
              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {selectedClaim.claimant}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {selectedClaim.description}
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">
                    {selectedClaim.status}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                  <Info
                    label="Category"
                    value={selectedClaim.category}
                  />

                  <Info
                    label="Amount"
                    value={`${selectedClaim.currency} ${selectedClaim.amount}`}
                  />

                  <Info
                    label="Date"
                    value={new Date(
                      selectedClaim.date
                    ).toLocaleDateString()}
                  />

                  <Info
                    label="Receipt"
                    value={
                      selectedClaim.receiptAvailable
                        ? "Available"
                        : "Missing"
                    }
                  />
                </div>
              </div>

              {/* Deterministic Validation */}
              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">
                  Deterministic Validation
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Checks required fields, duplicates, receipts,
                  dates and policy limits.
                </p>

                <button
                  onClick={validateClaim}
                  disabled={actionLoading}
                  className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {actionLoading
                    ? "Checking..."
                    : "Run Validation"}
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
                      <p
                        key={error}
                        className="rounded bg-red-50 p-3 text-sm text-red-700"
                      >
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

              {/* AI Review */}
              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      AI Review
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      AI classification and policy evidence.
                    </p>
                  </div>

                  <button
                    onClick={runAIReview}
                    disabled={actionLoading}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {actionLoading
                      ? "Reviewing..."
                      : "Run AI Review"}
                  </button>
                </div>

                {selectedClaim.aiCategory ? (
                  <div className="mt-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Info
                        label="AI Category"
                        value={selectedClaim.aiCategory}
                      />

                      <Info
                        label="Confidence"
                        value={`${Math.round(
                          (selectedClaim.aiConfidence || 0) * 100
                        )}%`}
                      />
                    </div>

                    {selectedClaim.aiUncertain && (
                      <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700">
                        AI marked this classification as uncertain.
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        Explanation
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        {selectedClaim.aiExplanation}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        Policy Evidence
                      </p>

                      <p className="mt-1 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                        {selectedClaim.policyEvidence}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    AI review has not been run yet.
                  </p>
                )}
              </div>

              {/* Reviewer Decision */}
              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">
                  Reviewer Decision
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Human reviewer makes the final decision.
                </p>

                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason required for reject, clarification, or override..."
                  className="mt-4 min-h-24 w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500"
                />

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => reviewClaim("APPROVE")}
                    disabled={actionLoading}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => reviewClaim("REJECT")}
                    disabled={actionLoading}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Reject
                  </button>

                  <button
                    onClick={() =>
                      reviewClaim("REQUEST_CLARIFICATION")
                    }
                    disabled={actionLoading}
                    className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Request Clarification
                  </button>

                  <button
                    onClick={() => reviewClaim("OVERRIDE")}
                    disabled={actionLoading}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
                  >
                    Override AI
                  </button>
                </div>
              </div>

              {/* Review History */}
              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">
                  Review History
                </h3>

                {history.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-500">
                    No review history yet.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg bg-slate-50 p-4"
                      >
                        <div className="flex justify-between">
                          <span className="font-medium text-slate-900">
                            {item.action}
                          </span>

                          <span className="text-xs text-slate-400">
                            {new Date(
                              item.createdAt
                            ).toLocaleString()}
                          </span>
                        </div>

                        {item.details && (
                          <p className="mt-1 text-sm text-slate-600">
                            {item.details}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Message */}
              {message && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
                  {message}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

// -----------------------------
// Reusable Info Component
// -----------------------------
function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>

      <p className="mt-1 text-sm font-medium text-slate-900">
        {value}
      </p>
    </div>
  );
}