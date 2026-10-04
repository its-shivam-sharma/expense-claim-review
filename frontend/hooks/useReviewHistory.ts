import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import type { HistoryItem } from "../lib/types";

export function useReviewHistory(
  claimId: string,
  onMessage: (message: string) => void
) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const reloadHistory = useCallback(async () => {
    try {
      setHistory(await api.getHistory(claimId));
    } catch (error) {
      console.error("Failed to load review history:", error);
      onMessage("Failed to load review history.");
    }
  }, [claimId, onMessage]);

  useEffect(() => {
    reloadHistory();
  }, [reloadHistory]);

  return { history, reloadHistory };
}