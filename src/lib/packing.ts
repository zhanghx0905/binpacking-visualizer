import { colorForIndex } from "@/lib/colors";
import type { Container, Good, Solution } from "@/types/solution";

type RandomExampleOptions = {
  seed: number;
  count: number;
};

type PackedGood = Good & {
  turned: boolean;
  sequenceNr: number;
};

const defaultContainer: Container = {
  id: "generated-container",
  width: 2100,
  height: 1700,
  length: 3500,
  xCoord: 0,
  yCoord: 0,
  zCoord: 0,
  unit: "mm",
  goods: [],
};

export function createRandomOptimizedSolution(
  options: RandomExampleOptions,
): Solution {
  const goods = generateRandomGoods(options);
  return optimizeGoods(defaultContainer, goods, {
    description: `random optimized example (${options.count})`,
    sourceTitle: "3D shelf optimizer",
  });
}

export function optimizeExistingSolution(solution: Solution): Solution {
  const goods = solution.container.goods.map((good, index) => ({
    ...good,
    id: `${good.id}-repacked-${index}`,
    xCoord: 0,
    yCoord: 0,
    zCoord: 0,
  }));

  return optimizeGoods(solution.container, goods, {
    description: `${solution.description ?? "solution"} optimized`,
    sourceTitle: "3D shelf optimizer",
  });
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
    const group = index % 4;

    return {
      id: `random-good-${seed}-${index + 1}`,
      desc: `Generated ${index + 1}`,
      width,
      height,
      length,
      xCoord: 0,
      yCoord: 0,
      zCoord: 0,
      rCoord: width,
      tCoord: height,
      fCoord: length,
      color: colorForIndex(group),
      index,
      rotated: false,
      turningAllowed: true,
      stackingAllowed: true,
      turned: false,
      stackedOnGood: null,
      sequenceNr: index + 1,
    };
  });
}

function optimizeGoods(
  container: Container,
  goods: Good[],
  metadata: { description: string; sourceTitle: string },
): Solution {
  const packedGoods = packShelf3d(container, goods);
  const unpackedCount = goods.length - packedGoods.length;
  const suffix = unpackedCount > 0 ? `, ${unpackedCount} unpacked` : "";

  return {
    id: `solution-${Date.now()}`,
    description: `${metadata.description}${suffix}`,
    calculated: new Date().toISOString(),
    calculationSource: {
      title: metadata.sourceTitle,
      staticAlgorithm: "shelf-3d",
    },
    container: {
      ...container,
      id: `${container.id}-optimized-${Date.now()}`,
      xCoord: 0,
      yCoord: 0,
      zCoord: 0,
      goods: packedGoods,
    },
  };
}

function packShelf3d(container: Container, goods: Good[]): PackedGood[] {
  const sorted = [...goods].sort((a, b) => volume(b) - volume(a));
  const packed: PackedGood[] = [];
  let xCoord = 0;
  let yCoord = 0;
  let zCoord = 0;
  let rowLength = 0;
  let layerHeight = 0;

  for (const good of sorted) {
    let oriented = chooseOrientation(good, container.width - xCoord);

    if (xCoord + oriented.width > container.width) {
      xCoord = 0;
      zCoord += rowLength;
      rowLength = 0;
    }

    oriented = chooseOrientation(good, container.width - xCoord);

    if (zCoord + oriented.length > container.length) {
      xCoord = 0;
      zCoord = 0;
      yCoord += layerHeight;
      rowLength = 0;
      layerHeight = 0;
    }

    oriented = chooseOrientation(good, container.width - xCoord);

    if (
      xCoord + oriented.width > container.width ||
      zCoord + oriented.length > container.length ||
      yCoord + oriented.height > container.height
    ) {
      continue;
    }

    packed.push({
      ...good,
      id: `${good.id}-packed`,
      width: oriented.width,
      height: oriented.height,
      length: oriented.length,
      xCoord,
      yCoord,
      zCoord,
      rCoord: xCoord + oriented.width,
      tCoord: yCoord + oriented.height,
      fCoord: zCoord + oriented.length,
      turned: oriented.turned,
      rotated: oriented.turned,
      sequenceNr: packed.length + 1,
    });

    xCoord += oriented.width;
    rowLength = Math.max(rowLength, oriented.length);
    layerHeight = Math.max(layerHeight, oriented.height);
  }

  return packed;
}

function chooseOrientation(
  good: Good,
  remainingWidth: number,
): { width: number; height: number; length: number; turned: boolean } {
  const normal = {
    width: good.width,
    height: good.height,
    length: good.length,
    turned: false,
  };
  const rotated = {
    width: good.length,
    height: good.height,
    length: good.width,
    turned: true,
  };

  const normalFits = normal.width <= remainingWidth;
  const rotatedFits = rotated.width <= remainingWidth;

  if (normalFits && rotatedFits) {
    return normal.length <= rotated.length ? normal : rotated;
  }

  if (normalFits) {
    return normal;
  }

  if (rotatedFits) {
    return rotated;
  }

  return normal.width <= rotated.width ? normal : rotated;
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
