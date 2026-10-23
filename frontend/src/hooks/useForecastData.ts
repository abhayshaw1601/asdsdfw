import { useQuery } from "@tanstack/react-query";
import {
  fetchBuffer,
  fetchDecision,
  fetchHorizon,
  fetchMetadata,
  fetchMetrics,
  fetchSeries,
} from "../api/client";

export function useMetadata() {
  return useQuery({
    queryKey: ["metadata"],
    queryFn: fetchMetadata,
    staleTime: 10 * 60 * 1000,
  });
}

export function useDecisionQuery(day: string, deadlineHour: number) {
  return useQuery({
    queryKey: ["decision", day, deadlineHour],
    queryFn: () => fetchDecision(day, deadlineHour),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(day),
  });
}

export function useSeriesQuery(
  startDate: string,
  endDate: string,
  deadlineHour: number
) {
  return useQuery({
    queryKey: ["series", startDate, endDate, deadlineHour],
    queryFn: () => fetchSeries(startDate, endDate, deadlineHour),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(startDate && endDate),
  });
}

export function useMetricsQuery(
  startDate: string,
  endDate: string,
  deadlineHour: number
) {
  return useQuery({
    queryKey: ["metrics", startDate, endDate, deadlineHour],
    queryFn: () => fetchMetrics(startDate, endDate, deadlineHour),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(startDate && endDate),
  });
}

export function useHorizonQuery() {
  return useQuery({
    queryKey: ["horizon"],
    queryFn: fetchHorizon,
    staleTime: 10 * 60 * 1000,
  });
}

export function useBufferQuery(
  startDate: string,
  endDate: string,
  deadlineHour: number,
  quantile: number
) {
  return useQuery({
    queryKey: ["buffer", startDate, endDate, deadlineHour, quantile],
    queryFn: () => fetchBuffer(startDate, endDate, deadlineHour, quantile),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(startDate && endDate),
  });
}
