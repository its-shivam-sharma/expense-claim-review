import type {
  Claim,
  HistoryItem,
  NewClaimInput,
  ReviewAction,
  ValidationResult,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export class ApiError extends Error {}

type ApiResult<T> = {
  success: boolean;
  message?: string;
  data: T;
};

async function request<T>(
  path: string,
  init?: RequestInit
): Promise<ApiResult<T>> {
  const response = await fetch(`${API_URL}${path}`, init);
  const result = (await response.json().catch(() => null)) as ApiResult<T> | null;

  if (!response.ok || !result?.success) {
    throw new ApiError(result?.message ?? `Request failed (${response.status})`);
  }

  return result;
}

function post<T = unknown>(path: string, body?: unknown) {
  return request<T>(path, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

// Backend messages are shown as-is; network failures fall back to a generic text.
export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export const api = {
  async listClaims() {
    return (await request<Claim[]>("/claims")).data;
  },

  async createClaim(input: NewClaimInput) {
    return (await post<Claim>("/claims", input)).data;
  },

  async validateClaim(claimId: string) {
    return (await post<ValidationResult>(`/claims/${claimId}/validate`)).data;
  },

  async runAIReview(claimId: string) {
    await post(`/claims/${claimId}/ai-review`);
  },

  async reviewClaim(claimId: string, action: ReviewAction, reason: string) {
    const result = await post(`/claims/${claimId}/review`, { action, reason });
    return result.message ?? "Review recorded.";
  },

  async getHistory(claimId: string) {
    return (await request<HistoryItem[]>(`/claims/${claimId}/history`)).data;
  },
};