import {
  SolutionError,
  type Good,
  type Solution,
  type ValidationIssue,
} from "@/types/solution";

import {
  boxesOverlap, hasFullSupport, hasValidCoordinates, hasValidDimensions,
  supportingGoods, tolerance,
} from "@/lib/geometry";

export function validationErrorText(error: SolutionError): string {
  switch (error) {
    case SolutionError.NoSolution:
      return "no solution";
    case SolutionError.NoContainer:
      return "solution without container";
    case SolutionError.InvalidContainerDimensions:
      return "container dimensions must be finite and positive";
    case SolutionError.InvalidGoodGeometry:
      return "goods must have finite coordinates and positive finite dimensions";
    case SolutionError.GoodUnsupported:
      return "solution contains goods without full support beneath their base";
    case SolutionError.StackingNotAllowed:
      return "solution stacks goods marked as non-stackable";
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
  const issues: ValidationIssue[] = [];
  if (!hasValidDimensions(container)) {
    issues.push({ error: SolutionError.InvalidContainerDimensions, affectedGoods: [] });
  }
  const allGoods = container.goods ?? [];
  const isValid = (good: Good) => hasValidDimensions(good) && hasValidCoordinates(good);
  addBoundaryIssue(issues, SolutionError.InvalidGoodGeometry, allGoods.filter((good) => !isValid(good)));
  const goods = allGoods.filter(isValid);

  addBoundaryIssue(
    issues,
    SolutionError.GoodBeforeContainerXCoord,
    goods.filter((good) => good.xCoord < -tolerance(good.xCoord)),
  );
  addBoundaryIssue(
    issues,
    SolutionError.GoodOutOfContainerXCoord,
    goods.filter((good) => good.xCoord + good.width > container.width + tolerance(container.width)),
  );
  addBoundaryIssue(
    issues,
    SolutionError.GoodBeforeContainerYCoord,
    goods.filter((good) => good.yCoord < -tolerance(good.yCoord)),
  );
  addBoundaryIssue(
    issues,
    SolutionError.GoodOutOfContainerYCoord,
    goods.filter((good) => good.yCoord + good.height > container.height + tolerance(container.height)),
  );
  addBoundaryIssue(
    issues,
    SolutionError.GoodBeforeContainerZCoord,
    goods.filter((good) => good.zCoord < -tolerance(good.zCoord)),
  );
  addBoundaryIssue(
    issues,
    SolutionError.GoodOutOfContainerZCoord,
    goods.filter((good) => good.zCoord + good.length > container.length + tolerance(container.length)),
  );

  for (let index = 0; index < goods.length; index += 1) {
    const good = goods[index];
    if (good.yCoord > tolerance(good.yCoord)) {
      const bases = supportingGoods(good, goods);
      if (!hasFullSupport(good, bases)) {
        issues.push({ error: SolutionError.GoodUnsupported, affectedGoods: [good] });
      }
      if (good.stackingAllowed === false || bases.some((base) => base.stackingAllowed === false)) {
        issues.push({ error: SolutionError.StackingNotAllowed, affectedGoods: [good, ...bases] });
      }
    }
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
