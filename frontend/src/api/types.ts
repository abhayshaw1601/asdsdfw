export interface HealthResponse {
  status: string;
  app: string;
}

export interface MetadataResponse {
  minDate: string;
  maxDate: string;
  actualsCount: number;
  forecastsCount: number;
  defaultDeadlineHour: number;
}

export interface SeriesPoint {
  startTime: string;
  forecast: number;
  actual: number | null;
  publishTime: string;
  deadlineUtc: string;
  horizonHours: number;
  error: number | null;
}

export interface DaySummary {
  minForecastMw: number;
  maxForecastMw: number;
  meanForecastMw: number;
  totalEnergyMwh: number;
}

export interface DecisionResponse {
  day: string;
  deadlineUtc: string;
  deadlineLocal: string;
  points: SeriesPoint[];
  summary: DaySummary;
}

export interface SeriesResponse {
  count: number;
  points: SeriesPoint[];
}

export interface Metrics {
  n: number;
  mae: number;
  rmse: number;
  bias: number;
  nmae: number;
  p50: number;
  p90: number;
  p95: number;
}

export interface HourMetrics {
  hour: number;
  n: number;
  mae: number;
  rmse: number;
  bias: number;
}

export interface MetricsResponse {
  summary: Metrics;
  hourly: HourMetrics[];
}

export interface HorizonMetrics {
  binLabel: string;
  n: number;
  mae: number;
  rmse: number;
  bias: number;
}

export interface HorizonResponse {
  bins: HorizonMetrics[];
}

export interface BufferRow {
  hour: number;
  n: number;
  bufferMw: number;
  bufferP90: number;
  bufferP95: number;
  meanOverForecast: number;
  maxShortfall: number;
}

export interface BufferResponse {
  quantile: number;
  rows: BufferRow[];
}

export type UnitType = "MW" | "GW";
