import { useState, type ReactNode } from "react";
import { getErrorMessage } from "../lib/api";
import type { NewClaimInput } from "../lib/types";

const CATEGORIES = ["Meals", "Travel", "Accommodation", "Other"];
const CURRENCIES = ["INR", "USD", "EUR"];

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500";

const emptyForm = {
  claimant: "",
  date: "",
  category: "Meals",
  amount: "",
  currency: "INR",
  description: "",
  receiptAvailable: true,
};

type ClaimFormProps = {
  onClose: () => void;
  onSubmit: (input: NewClaimInput) => Promise<void>;
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}

export function ClaimForm({ onClose, onSubmit }: ClaimFormProps) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof typeof emptyForm>(
    key: K,
    value: (typeof emptyForm)[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.claimant || !form.date || !form.amount || !form.description) {
      setError("Please fill all required fields.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await onSubmit({ ...form, amount: Number(form.amount) });
    } catch (err) {
      console.error("Failed to create claim:", err);
      setError(getErrorMessage(err, "Failed to create claim."));
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">
            Create New Claim
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-xl text-slate-400 hover:text-slate-700"
          >
            ×
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <Field label="Claimant *">
            <input
              placeholder="e.g. Shivam Sharma"
              value={form.claimant}
              onChange={(e) => update("claimant", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Date *">
            <input
              type="date"
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Category *">
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              className={inputClass}
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount *">
              <input
                type="number"
                min="0"
                placeholder="2500"
                value={form.amount}
                onChange={(e) => update("amount", e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Currency">
              <select
                value={form.currency}
                onChange={(e) => update("currency", e.target.value)}
                className={inputClass}
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Description *">
            <textarea
              placeholder="e.g. Dinner with client"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              className={`${inputClass} min-h-24`}
            />
          </Field>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.receiptAvailable}
              onChange={(e) => update("receiptAvailable", e.target.checked)}
            />
            Receipt available
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Claim"}
          </button>
        </div>
      </div>
    </div>
  );
}