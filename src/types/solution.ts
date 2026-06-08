export type Unit = "mm" | "cm" | "dm" | "m" | "km";

export type Entity = {
  id: string;
};

export type Space = {
  width: number;
  height: number;
  length: number;
};

export type Positioned = {
  xCoord: number;
  yCoord: number;
  zCoord: number;
};

export type Good = Entity &
  Space &
  Positioned & {
    desc: string | null;
    color: string;
    index?: number;
    rCoord?: number;
    tCoord?: number;
    fCoord?: number | null;
    rotated?: boolean;
    group?: string;
    sequenceNr?: number;
    stackingAllowed?: boolean;
    turningAllowed?: boolean;
    turned?: boolean;
    stackedOnGood?: string | null;
    orderGuid?: string;
  };

export type Container = Entity &
  Space &
  Positioned & {
    unit: Unit;
    goods: Good[];
  };

export type Solution = Entity & {
  description: string | null;
  calculated: string;
  calculationSource: {
    staticAlgorithm?: string;
    title: string;
  };
  container: Container;
};

export type SolutionFile = {
  solution: Solution;
};

export enum SolutionError {
  NoSolution = "NoSolution",
  NoContainer = "NoContainer",
  GoodBeforeContainerXCoord = "GoodBeforeContainerXCoord",
  GoodOutOfContainerXCoord = "GoodOutOfContainerXCoord",
  GoodBeforeContainerYCoord = "GoodBeforeContainerYCoord",
  GoodOutOfContainerYCoord = "GoodOutOfContainerYCoord",
  GoodBeforeContainerZCoord = "GoodBeforeContainerZCoord",
  GoodOutOfContainerZCoord = "GoodOutOfContainerZCoord",
  GoodOverlap = "GoodOverlap",
}

export type ValidationIssue = {
  error: SolutionError;
  affectedGoods: Good[];
};
