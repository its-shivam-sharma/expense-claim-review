import { useState } from "react";
import { api, getErrorMessage } from "../lib/api";
import {
  ACTIONS_REQUIRING_REASON,
  type ReviewAction,
  type ValidationResult,
} from "../lib/types";

type Task = "validate" | "ai-review" | "decision";

type Options = {
  claimId: string;
  onMessage: (message: string) => void;
  onChanged: () => Promise<void>;
};

export function useClaimReview({ claimId, onMessage, onChanged }: Options) {
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [reason, setReason] = useState("");
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  async function runTask(
    task: Task,
    failureMessage: string,
    work: () => Promise<void>
  ) {
    setActiveTask(task);
    onMessage("");

    try {
      await work();
    } catch (error) {
      console.error(failureMessage, error);
      onMessage(getErrorMessage(error, failureMessage));
    } finally {
      setActiveTask(null);
    }
  }

  function validate() {
    return runTask("validate", "Validation failed.", async () => {
      setValidation(await api.validateClaim(claimId));
    });
  }

  function runAIReview() {
    return runTask("ai-review", "AI review failed.", async () => {
      await api.runAIReview(claimId);
      await onChanged();
      onMessage("AI review completed successfully.");
    });
  }

  function decide(action: ReviewAction) { 
    if (ACTIONS_REQUIRING_REASON.includes(action) && !reason.trim()) {
      onMessage("Please enter a reason.");
      return;
    }

    return runTask("decision", "Review action failed.", async () => {
      const message = await api.reviewClaim(claimId, action, reason.trim());
      setReason("");
      await onChanged();
      onMessage(message);
    });
  }

  return {
    validation,
    reason,
    setReason,
    activeTask,
    validate,
    runAIReview,
    decide,
  };
}