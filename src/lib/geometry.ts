import type { Good, Positioned, Space } from "@/types/solution";

export type Box = Space & Positioned;

// Scale the tolerance to the coordinates, including solutions using metres/km.
export function tolerance(...values: number[]): number {
  return Number.EPSILON * 64 * Math.max(1, ...values.map(Math.abs));
}

export function hasValidDimensions(box: Space): boolean {
  return [box.width, box.height, box.length].every(
    (value) => Number.isFinite(value) && value > 0,
  );
}

export function hasValidCoordinates(box: Positioned): boolean {
  return [box.xCoord, box.yCoord, box.zCoord].every(Number.isFinite);
}

export function boxesOverlap(a: Box, b: Box): boolean {
  return (
    intervalsOverlap(a.xCoord, a.width, b.xCoord, b.width) &&
    intervalsOverlap(a.yCoord, a.height, b.yCoord, b.height) &&
    intervalsOverlap(a.zCoord, a.length, b.zCoord, b.length)
  );
}

function intervalsOverlap(a: number, sizeA: number, b: number, sizeB: number) {
  return Math.min(a + sizeA, b + sizeB) - Math.max(a, b) >
    tolerance(a, sizeA, b, sizeB);
}

export function supportingGoods(box: Box, goods: Good[]): Good[] {
  return goods.filter(
    (base) =>
      base !== box &&
      Math.abs(base.yCoord + base.height - box.yCoord) <=
        tolerance(base.yCoord, base.height, box.yCoord) &&
      intervalsOverlap(base.xCoord, base.width, box.xCoord, box.width) &&
      intervalsOverlap(base.zCoord, base.length, box.zCoord, box.length),
  );
}

// Cover the entire footprint with the union of coplanar top faces. Adding face
// areas alone would count overlapping supports twice and hide unsupported gaps.
export function hasFullSupport(box: Box, bases: Good[]): boolean {
  if (Math.abs(box.yCoord) <= tolerance(box.yCoord)) return true;
  const right = box.xCoord + box.width;
  const front = box.zCoord + box.length;
  const eps = tolerance(right, front, box.width, box.length);
  const cuts = Array.from(new Set([
    box.xCoord,
    right,
    ...bases.flatMap((base) => [
      Math.max(box.xCoord, base.xCoord),
      Math.min(right, base.xCoord + base.width),
    ]),
  ])).sort((a, b) => a - b);

  for (let i = 1; i < cuts.length; i += 1) {
    if (cuts[i] - cuts[i - 1] <= eps) continue;
    const intervals = bases
      .filter((base) => base.xCoord <= cuts[i - 1] + eps &&
        base.xCoord + base.width >= cuts[i] - eps)
      .map((base) => [Math.max(box.zCoord, base.zCoord),
        Math.min(front, base.zCoord + base.length)])
      .sort((a, b) => a[0] - b[0]);
    let covered = box.zCoord;
    for (const [start, end] of intervals) {
      if (start > covered + eps) break;
      covered = Math.max(covered, end);
    }
    if (covered < front - eps) return false;
  }
  return true;
}
