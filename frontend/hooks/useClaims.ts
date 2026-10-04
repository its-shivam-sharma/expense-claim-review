import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import type { Claim, NewClaimInput } from "../lib/types";

export function useClaims(onMessage: (message: string) => void) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setClaims(await api.listClaims());
    } catch (error) {
      console.error("Failed to load claims:", error);
      onMessage("Failed to connect to backend.");
    } finally {
      setLoading(false);
    }
  }, [onMessage]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Derived from the list, so it stays fresh after every reload.
  const selectedClaim =
    claims.find((claim) => claim.id === selectedId) ?? claims[0] ?? null;

  const stats = useMemo(
    () => ({
      total: claims.length,
      pending: claims.filter(
        (claim) => claim.status !== "APPROVED" && claim.status !== "REJECTED"
      ).length,
      approved: claims.filter((claim) => claim.status === "APPROVED").length,
      rejected: claims.filter((claim) => claim.status === "REJECTED").length,
    }),
    [claims]
  );

  async function createClaim(input: NewClaimInput) {
    const claim = await api.createClaim(input);
    await refresh();
    setSelectedId(claim.id);
  }

  return {
    claims,
    selectedClaim,
    stats,
    loading,
    selectClaim: setSelectedId,
    createClaim,
    refresh,
  };
}