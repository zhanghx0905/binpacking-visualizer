import type { Unit } from "@/types/solution";

const unitScale = [
  { unit: "mm", next: 10, threshold: 100 },
  { unit: "cm", next: 100, threshold: 100 },
  { unit: "m", next: 1000, threshold: 1000 },
  { unit: "km", next: null, threshold: null },
] as const;

export function formatLength(
  value: number | null | undefined,
  unit: Unit = "mm",
  decimalDigits = 2,
  trimZeroDecimals = false,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "no entries";
  }

  let converted = value;
  let currentUnit: string = unit;
  let index = unitScale.findIndex((entry) => entry.unit === currentUnit);
  if (index < 0) {
    index = 0;
    currentUnit = "mm";
  }

  while (converted >= (unitScale[index]?.threshold ?? Infinity)) {
    converted = converted / (unitScale[index]?.next ?? 1);
    index += 1;
    currentUnit = unitScale[index]?.unit ?? currentUnit;
  }

  const formatted = trimZeroDecimals
    ? parseFloat(converted.toFixed(decimalDigits)).toString()
    : converted.toFixed(decimalDigits);
  return `${formatted} ${currentUnit}`;
}

export function formatVolume(
  value: number,
  unit: Unit = "mm",
  decimalDigits = 2,
  trimZeroDecimals = false,
): string {
  let converted = value;
  let currentUnit: string = unit;
  let index = unitScale.findIndex((entry) => entry.unit === currentUnit);
  if (index < 0) {
    index = 0;
    currentUnit = "mm";
  }

  while (converted >= (unitScale[index]?.threshold ?? Infinity)) {
    converted = converted / Math.pow(unitScale[index]?.next ?? 1, 3);
    index += 1;
    currentUnit = unitScale[index]?.unit ?? currentUnit;
  }

  const formatted = trimZeroDecimals
    ? parseFloat(converted.toFixed(decimalDigits)).toString()
    : converted.toFixed(decimalDigits);
  return `${formatted} ${currentUnit}³`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 10) / 10}%`;
}
