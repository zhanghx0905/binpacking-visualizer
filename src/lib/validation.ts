import {
  SolutionError,
  type Good,
  type Positioned,
  type Solution,
  type Space,
  type ValidationIssue,
} from "@/types/solution";

type Box = Space & Positioned;

export function validationErrorText(error: SolutionError): string {
  switch (error) {
    case SolutionError.NoSolution:
      return "no solution";
    case SolutionError.NoContainer:
      return "solution without container";
    case SolutionError.GoodBeforeContainerXCoord:
      return "solution contains goods positioned before the container on x";
    case SolutionError.GoodOutOfContainerXCoord:
      return "solution contains goods jutting over the x edge";
    case SolutionError.GoodBeforeContainerYCoord:
      return "solution contains goods positioned beneath the container";
    case SolutionError.GoodOutOfContainerYCoord:
      return "solution contains goods jutting over the y edge";
    case SolutionError.GoodBeforeContainerZCoord:
      return "solution contains goods positioned behind the container";
    case SolutionError.GoodOutOfContainerZCoord:
      return "solution contains goods jutting over the z edge";
    case SolutionError.GoodOverlap:
      return "solution contains overlapping goods";
  }
}

export function validateSolution(solution: Solution | null): ValidationIssue[] {
  if (!solution) {
    return [{ error: SolutionError.NoSolution, affectedGoods: [] }];
  }

  if (!solution.container) {
    return [{ error: SolutionError.NoContainer, affectedGoods: [] }];
  }

  const { container } = solution;
  const goods = container.goods ?? [];
  const issues: ValidationIssue[] = [];

  addBoundaryIssue(
    issues,
    SolutionError.GoodBeforeContainerXCoord,
    goods.filter((good) => good.xCoord < 0),
  );
  addBoundaryIssue(
    issues,
    SolutionError.GoodOutOfContainerXCoord,
    goods.filter((good) => good.xCoord + good.width > container.width),
  );
  addBoundaryIssue(
    issues,
    SolutionError.GoodBeforeContainerYCoord,
    goods.filter((good) => good.yCoord < 0),
  );
  addBoundaryIssue(
    issues,
    SolutionError.GoodOutOfContainerYCoord,
    goods.filter((good) => good.yCoord + good.height > container.height),
  );
  addBoundaryIssue(
    issues,
    SolutionError.GoodBeforeContainerZCoord,
    goods.filter((good) => good.zCoord < 0),
  );
  addBoundaryIssue(
    issues,
    SolutionError.GoodOutOfContainerZCoord,
    goods.filter((good) => good.zCoord + good.length > container.length),
  );

  for (let index = 0; index < goods.length; index += 1) {
    const good = goods[index];
    const overlaps = goods
      .slice(index + 1)
      .filter((candidate) => boxesOverlap(good, candidate));
    if (overlaps.length > 0) {
      issues.push({
        error: SolutionError.GoodOverlap,
        affectedGoods: [good, ...overlaps],
      });
    }
  }

  return issues;
}

function addBoundaryIssue(
  issues: ValidationIssue[],
  error: SolutionError,
  affectedGoods: Good[],
) {
  if (affectedGoods.length > 0) {
    issues.push({ error, affectedGoods });
  }
}

function boxesOverlap(boxA: Box, boxB: Box): boolean {
  const separateX =
    boxA.xCoord + boxA.width <= boxB.xCoord ||
    boxB.xCoord + boxB.width <= boxA.xCoord;
  const separateY =
    boxA.yCoord + boxA.height <= boxB.yCoord ||
    boxB.yCoord + boxB.height <= boxA.yCoord;
  const separateZ =
    boxA.zCoord + boxA.length <= boxB.zCoord ||
    boxB.zCoord + boxB.length <= boxA.zCoord;

  return !(separateX || separateY || separateZ);
}
