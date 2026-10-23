import type {
  BufferResponse,
  DecisionResponse,
  HealthResponse,
  HorizonResponse,
  MetadataResponse,
  MetricsResponse,
  SeriesResponse,
} from "./types";

const BASE_URL = "/api/v1";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    let errorDetail = res.statusText;
    try {
      const body = await res.json();
      if (body.detail) {
        errorDetail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(`API Error (${res.status}): ${errorDetail}`);
  }
  return res.json();
}

export async function fetchHealth(): Promise<HealthResponse> {
  return fetchJson<HealthResponse>(`${BASE_URL}/health`);
}

export async function fetchMetadata(): Promise<MetadataResponse> {
  return fetchJson<MetadataResponse>(`${BASE_URL}/metadata`);
}

export async function fetchDecision(
  day: string,
  deadlineHour: number = 9
): Promise<DecisionResponse> {
  const params = new URLSearchParams({
    day,
    deadline_hour: deadlineHour.toString(),
  });
  return fetchJson<DecisionResponse>(`${BASE_URL}/decision?${params.toString()}`);
}

export async function fetchSeries(
  startDate: string,
  endDate: string,
  deadlineHour: number = 9
): Promise<SeriesResponse> {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    deadline_hour: deadlineHour.toString(),
  });
  return fetchJson<SeriesResponse>(`${BASE_URL}/series?${params.toString()}`);
}

export async function fetchMetrics(
  startDate: string,
  endDate: string,
  deadlineHour: number = 9
): Promise<MetricsResponse> {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    deadline_hour: deadlineHour.toString(),
  });
  return fetchJson<MetricsResponse>(`${BASE_URL}/metrics?${params.toString()}`);
}

export async function fetchHorizon(): Promise<HorizonResponse> {
  return fetchJson<HorizonResponse>(`${BASE_URL}/horizon`);
}

export async function fetchBuffer(
  startDate: string,
  endDate: string,
  deadlineHour: number = 9,
  quantile: number = 0.90
): Promise<BufferResponse> {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    deadline_hour: deadlineHour.toString(),
    quantile: quantile.toString(),
  });
  return fetchJson<BufferResponse>(`${BASE_URL}/buffer?${params.toString()}`);
}
