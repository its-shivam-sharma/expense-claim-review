"use client";

import { useState } from "react";
import { ClaimDetails } from "@/components/ClaimDetails";
import { ClaimForm } from "@/components/ClaimForm";
import { ClaimList } from "@/components/ClaimList";
import { SummaryCards } from "@/components/SummaryCards";
import { NewClaimInput } from "@/lib/types";
import { useClaims } from "@/hooks/useClaims";

export default function Home() {
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { claims, selectedClaim, stats, loading, selectClaim, createClaim, refresh } =
    useClaims(setMessage);

  async function handleCreate(input: NewClaimInput) {
    await createClaim(input);
    setShowForm(false);
    setMessage("Claim created successfully.");
  }

  function openForm() {
    setMessage("");
    setShowForm(true);
  }

  return (
    <main className="min-h-screen bg-slate-100">
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
            onClick={openForm}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + New Claim
          </button>
        </div>
      </header>

      {showForm && (
        <ClaimForm onClose={() => setShowForm(false)} onSubmit={handleCreate} />
      )}

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <SummaryCards stats={stats} />

        {message && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ClaimList
            claims={claims}
            selectedId={selectedClaim?.id}
            loading={loading}
            onSelect={(claimId) => {
              setMessage("");
              selectClaim(claimId);
            }}
            onCreate={openForm}
          />

          <section className="space-y-6 lg:col-span-2">
            {selectedClaim ? (
              <ClaimDetails
                key={selectedClaim.id}
                claim={selectedClaim}
                onMessage={setMessage}
                onClaimsChanged={refresh}
              />
            ) : (
              <div className="rounded-xl border bg-white p-8 text-center">
                <p className="text-slate-500">
                  Select a claim to start the review.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}