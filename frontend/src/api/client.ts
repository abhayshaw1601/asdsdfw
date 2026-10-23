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

export interface LiveStatusResponse {
  service: string;
  last_sync_status: string;
  last_sync_time: string | null;
  last_error: string | null;
  min_date: string | null;
  max_date: string | null;
  latest_outturn_time: string | null;
  actuals_in_store: number;
  forecasts_in_store: number;
  is_live_enabled: boolean;
}

export interface LiveBoundsResponse {
  minDate: string;
  maxDate: string;
  totalActuals: number;
  totalForecasts: number;
  latestActual: string | null;
}

export async function fetchLiveStatus(): Promise<LiveStatusResponse> {
  return fetchJson<LiveStatusResponse>(`${BASE_URL}/live/status`);
}

export async function fetchDatasetBounds(): Promise<LiveBoundsResponse> {
  return fetchJson<LiveBoundsResponse>(`${BASE_URL}/live/bounds`);
}

export async function triggerLiveSync(days: number = 3): Promise<any> {
  const res = await fetch(`${BASE_URL}/live/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ days }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Live sync failed");
  }
  return res.json();
}

export async function fetchCustomDateRange(startDate: string, endDate: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/live/fetch-range`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ startDate, endDate }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Date range fetch failed");
  }
  return res.json();
}

