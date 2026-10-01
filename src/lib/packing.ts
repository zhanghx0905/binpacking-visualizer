import { colorForIndex } from "@/lib/colors";
import {
  boxesOverlap, hasFullSupport, hasValidDimensions, supportingGoods, tolerance,
} from "@/lib/geometry";
import { validateSolution } from "@/lib/validation";
import type { Container, Good, Solution } from "@/types/solution";

type RandomExampleOptions = { seed: number; count: number };

const defaultContainer: Container = {
  id: "generated-container", width: 2100, height: 1700, length: 3500,
  xCoord: 0, yCoord: 0, zCoord: 0, unit: "mm", goods: [],
};

export function createRandomOptimizedSolution(options: RandomExampleOptions): Solution {
  return optimizeGoods(defaultContainer, generateRandomGoods(options),
    `random optimized example (${options.count})`);
}

export function optimizeExistingSolution(solution: Solution): Solution {
  // Keep every item, including ones that did not fit on a previous attempt.
  const goods = [...solution.container.goods, ...(solution.unpackedGoods ?? [])];
  const baseline = validateSolution(solution).length === 0
    ? solution.container.goods
    : [];
  return optimizeGoods(solution.container, goods,
    `${solution.description ?? "solution"} optimized`, baseline);
}

function generateRandomGoods({ seed, count }: RandomExampleOptions): Good[] {
  const random = createSeededRandom(seed);
  const widths = [300, 400, 500, 600, 700, 800, 1050];
  const heights = [250, 300, 350, 400, 500, 650, 800, 1000];
  const lengths = [300, 400, 500, 700, 900, 1000, 1200];
  return Array.from({ length: count }, (_, index) => {
    const width = pick(widths, random);
    const height = pick(heights, random);
    const length = pick(lengths, random);
    return {
      id: `random-good-${seed}-${index + 1}`, desc: `Generated ${index + 1}`,
      width, height, length, xCoord: 0, yCoord: 0, zCoord: 0,
      rCoord: width, tCoord: height, fCoord: length,
      color: colorForIndex(index % 4), index, rotated: false,
      turningAllowed: true, stackingAllowed: true, turned: false,
      stackedOnGood: null, sequenceNr: index + 1,
    };
  });
}

function optimizeGoods(
  container: Container, goods: Good[], description: string, baseline: Good[] = [],
): Solution {
  // Different deterministic orders reduce the sensitivity of a greedy heuristic
  // to the first item. Keep a valid existing layout if no trial improves it.
  const orders = [
    (a: Good, b: Good) => volume(b) - volume(a),
    (a: Good, b: Good) => b.width * b.length - a.width * a.length || volume(b) - volume(a),
    (a: Good, b: Good) => b.height - a.height || volume(b) - volume(a),
  ];
  let packed = [...baseline];
  if (hasValidDimensions(container)) {
    for (const compare of orders) {
      const sorted = goods.filter(hasValidDimensions).sort(compare);
      for (const alongWidth of [false, true]) {
        const trial = packSupported(container, sorted, alongWidth);
        if (isBetter(trial, packed)) packed = trial;
      }
    }
  }

  // IDs remain stable so selection, order references and support references
  // continue to identify the same goods across repeated optimizations.
  packed = [...packed].sort((a, b) => a.yCoord - b.yCoord).map((good, index) => {
    const bases = supportingGoods(good, packed);
    return {
      ...good, rCoord: good.xCoord + good.width,
      tCoord: good.yCoord + good.height, fCoord: good.zCoord + good.length,
      stackedOnGood: bases.length === 1 ? bases[0].id : null,
      sequenceNr: index + 1,
    };
  });
  const packedIds = new Set(packed.map((good) => good.id));
  const unpackedGoods = goods.filter((good) => !packedIds.has(good.id)).map((good) => ({
    ...good, xCoord: 0, yCoord: 0, zCoord: 0,
    rCoord: good.width, tCoord: good.height, fCoord: good.length,
    stackedOnGood: null, sequenceNr: undefined,
  }));
  const suffix = unpackedGoods.length > 0 ? `, ${unpackedGoods.length} unpacked` : "";
  return {
    id: `solution-${Date.now()}`, description: `${description}${suffix}`,
    calculated: new Date().toISOString(),
    calculationSource: { title: "Supported 3D optimizer", staticAlgorithm: "supported-3d" },
    container: {
      ...container, id: `${container.id}-optimized-${Date.now()}`,
      xCoord: 0, yCoord: 0, zCoord: 0, goods: packed,
    },
    unpackedGoods,
  };
}

function packSupported(container: Container, goods: Good[], alongWidth: boolean): Good[] {
  const packed: Good[] = [];
  for (const good of goods) {
    const placement = findPlacement(container, packed, good, alongWidth);
    if (placement) packed.push(placement);
  }
  return packed;
}

function findPlacement(
  container: Container, packed: Good[], source: Good, alongWidth: boolean,
): Good | null {
  const orientations = [source];
  if (source.turningAllowed !== false && source.width !== source.length) {
    const turned = !(source.turned ?? source.rotated ?? false);
    orientations.push({ ...source, width: source.length, length: source.width,
      turned, rotated: turned });
  }
  const levels = Array.from(new Set([0, ...packed
    .filter((base) => base.stackingAllowed !== false)
    .map((base) => base.yCoord + base.height)])).sort((a, b) => a - b);

  for (const yCoord of levels) {
    if (yCoord > 0 && source.stackingAllowed === false) continue;
    let best: Good | null = null;
    for (const oriented of orientations) {
      if (oriented.width > container.width || oriented.length > container.length ||
          yCoord + oriented.height > container.height + tolerance(container.height)) continue;
      const bases = yCoord === 0 ? [] : packed.filter((base) =>
        Math.abs(base.yCoord + base.height - yCoord) <= tolerance(yCoord));
      // Edges of obstacles in this vertical slab and of supporting top faces
      // are the only coordinates that can improve a compact placement.
      const obstacles = packed.filter((box) =>
        box.yCoord < yCoord + oriented.height && box.yCoord + box.height > yCoord);
      const edges = [...obstacles, ...bases];
      const xs = candidateCoordinates(container.width, oriented.width,
        edges.map((box) => [box.xCoord, box.xCoord + box.width]));
      const zs = candidateCoordinates(container.length, oriented.length,
        edges.map((box) => [box.zCoord, box.zCoord + box.length]));
      const first = alongWidth ? zs : xs;
      const second = alongWidth ? xs : zs;
      let found = false;
      for (const outer of first) {
        for (const inner of second) {
          const xCoord = alongWidth ? inner : outer;
          const zCoord = alongWidth ? outer : inner;
          const good = { ...oriented, xCoord, yCoord, zCoord };
          if (obstacles.some((box) => boxesOverlap(good, box))) continue;
          const supports = yCoord === 0 ? [] : supportingGoods(good, bases);
          if (supports.some((base) => base.stackingAllowed === false) ||
              !hasFullSupport(good, supports)) continue;
          if (!best || comparePosition(good, best, alongWidth) < 0) best = good;
          found = true;
          break;
        }
        if (found) break;
      }
    }
    // Always prefer the lowest fully supported position; no artificial layers.
    if (best) return best;
  }
  return null;
}

function candidateCoordinates(limit: number, size: number, edges: number[][]): number[] {
  return Array.from(new Set([0, limit - size, ...edges.flatMap(([start, end]) =>
    [start, end, start - size, end - size])]))
    .filter((value) => value >= 0 && value + size <= limit + tolerance(limit))
    .sort((a, b) => a - b);
}

function comparePosition(a: Good, b: Good, alongWidth: boolean): number {
  return alongWidth
    ? a.zCoord - b.zCoord || a.xCoord - b.xCoord
    : a.xCoord - b.xCoord || a.zCoord - b.zCoord;
}

function isBetter(candidate: Good[], current: Good[]): boolean {
  const candidateVolume = candidate.reduce((sum, good) => sum + volume(good), 0);
  const currentVolume = current.reduce((sum, good) => sum + volume(good), 0);
  if (Math.abs(candidateVolume - currentVolume) > tolerance(candidateVolume, currentVolume)) {
    return candidateVolume > currentVolume;
  }
  if (candidate.length !== current.length) return candidate.length > current.length;
  return Math.max(0, ...candidate.map((good) => good.yCoord + good.height)) <
    Math.max(0, ...current.map((good) => good.yCoord + good.height));
}

function createSeededRandom(seed: number) {
  let state = Math.max(Math.floor(seed), 1) % 2147483647;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function pick<T>(items: T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

function volume(good: Good): number {
  return good.width * good.height * good.length;
}
