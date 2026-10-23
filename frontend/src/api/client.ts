export interface HealthResponse {
  status: string;
  app: string;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch("/api/v1/health");
  if (!res.ok) {
    throw new Error(`Failed to fetch health: ${res.statusText}`);
  }
  return res.json();
}
