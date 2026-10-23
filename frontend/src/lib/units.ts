import type { UnitType } from "../api/types";

export function formatPower(
  valueMw: number | null | undefined,
  unit: UnitType = "MW",
  showUnit: boolean = true
): string {
  if (valueMw === null || valueMw === undefined || Number.isNaN(valueMw)) {
    return "—";
  }

  if (unit === "GW") {
    const gw = valueMw / 1000.0;
    return `${gw.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${showUnit ? " GW" : ""}`;
  }

  return `${Math.round(valueMw).toLocaleString()}${showUnit ? " MW" : ""}`;
}

export function convertValue(valueMw: number, unit: UnitType = "MW"): number {
  if (unit === "GW") {
    return Number((valueMw / 1000.0).toFixed(3));
  }
  return Math.round(valueMw);
}
