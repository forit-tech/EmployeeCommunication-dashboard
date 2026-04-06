import type {
  ApiGraphData,
  DashboardFilters,
  HealthData,
  InteractionRow,
  SummaryData,
} from "./types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? "http://localhost:8000/api" : "/api");

class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

function parseErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === "string") {
    return detail;
  }

  if (detail && typeof detail === "object") {
    const message = (detail as { message?: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }

  return null;
}

async function requestJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;

    try {
      const payload = (await response.json()) as unknown;
      const parsedMessage = parseErrorMessage(payload);
      if (parsedMessage) {
        errorMessage = parsedMessage;
      }
    } catch {
      // Keep the default message when the error payload is not JSON.
    }

    throw new ApiError(errorMessage);
  }

  return (await response.json()) as T;
}

export function fetchHealth(signal?: AbortSignal): Promise<HealthData> {
  return requestJson<HealthData>("/health", signal);
}

export function fetchSummary(signal?: AbortSignal): Promise<SummaryData> {
  return requestJson<SummaryData>("/summary", signal);
}

export function fetchGraph(signal?: AbortSignal): Promise<ApiGraphData> {
  return requestJson<ApiGraphData>("/graph", signal);
}

export function fetchInteractions(
  filters: DashboardFilters,
  signal?: AbortSignal,
): Promise<InteractionRow[]> {
  const searchParams = new URLSearchParams();

  if (filters.interactionType) {
    searchParams.set("interaction_type", filters.interactionType);
  }

  if (filters.minStrength > 0) {
    searchParams.set("min_strength", String(filters.minStrength));
  }

  if (filters.employeeId.trim()) {
    searchParams.set("employee_id", filters.employeeId.trim());
  }

  const query = searchParams.toString();
  return requestJson<InteractionRow[]>(
    query ? `/interactions?${query}` : "/interactions",
    signal,
  );
}
