import { colorForIndex } from "@/lib/colors";
import type { Container, Good, Solution, SolutionFile } from "@/types/solution";

type UnknownRecord = Record<string, unknown>;

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function normalizeGood(input: UnknownRecord, index: number): Good {
  return {
    ...input,
    id: asString(input.id, `good-${index}`),
    desc: typeof input.desc === "string" ? input.desc : null,
    width: asNumber(input.width),
    height: asNumber(input.height),
    length:
      input.length === Infinity ? Infinity : asNumber(input.length),
    xCoord: asNumber(input.xCoord),
    yCoord: asNumber(input.yCoord),
    zCoord: asNumber(input.zCoord),
    rCoord: asNumber(input.rCoord, asNumber(input.xCoord) + asNumber(input.width)),
    tCoord: asNumber(input.tCoord, asNumber(input.yCoord) + asNumber(input.height)),
    fCoord:
      input.fCoord === null
        ? Infinity
        : asNumber(input.fCoord, asNumber(input.zCoord) + asNumber(input.length)),
    color: asString(input.color, colorForIndex(index)),
  };
}

function normalizeContainer(input: UnknownRecord): Container {
  const goodsInput = Array.isArray(input.goods) ? input.goods : [];
  const goods = goodsInput.map((good, index) =>
    normalizeGood((good ?? {}) as UnknownRecord, index),
  );

  return {
    ...input,
    id: asString(input.id, "container"),
    width: asNumber(input.width),
    height: asNumber(input.height),
    length: asNumber(input.length),
    xCoord: asNumber(input.xCoord),
    yCoord: asNumber(input.yCoord),
    zCoord: asNumber(input.zCoord),
    unit: input.unit === "cm" || input.unit === "dm" || input.unit === "m" || input.unit === "km" ? input.unit : "mm",
    goods,
  };
}

export function normalizeSolutionFile(input: unknown): Solution {
  const root = (input ?? {}) as UnknownRecord;
  const rawSolution = ((root.solution ?? root) ?? {}) as UnknownRecord;
  const rawContainer = (rawSolution.container ?? {}) as UnknownRecord;

  return {
    ...rawSolution,
    id: asString(rawSolution.id, "solution"),
    description:
      typeof rawSolution.description === "string"
        ? rawSolution.description
        : "unknown solution",
    calculated:
      typeof rawSolution.calculated === "string"
        ? rawSolution.calculated
        : new Date().toISOString(),
    calculationSource:
      typeof rawSolution.calculationSource === "object" &&
      rawSolution.calculationSource !== null
        ? {
            title: asString(
              (rawSolution.calculationSource as UnknownRecord).title,
              "unknown source",
            ),
            staticAlgorithm:
              typeof (rawSolution.calculationSource as UnknownRecord)
                .staticAlgorithm === "string"
                ? ((rawSolution.calculationSource as UnknownRecord)
                    .staticAlgorithm as string)
                : undefined,
          }
        : {
            title: asString(rawSolution.algorithm, "unknown source"),
          },
    container: normalizeContainer(rawContainer),
    unpackedGoods: Array.isArray(rawSolution.unpackedGoods)
      ? rawSolution.unpackedGoods.map((good, index) =>
          normalizeGood((good ?? {}) as UnknownRecord, index),
        )
      : [],
  };
}

export function serializeSolution(solution: Solution): SolutionFile {
  return { solution };
}
