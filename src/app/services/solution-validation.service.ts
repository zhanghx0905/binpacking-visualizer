import {Injectable} from '@angular/core';
import {SolutionError} from '../globals';
import {IGood} from '../interfaces/i-good.interface';
import {IPosition} from '../interfaces/i-position.interface';
import {ISolution} from '../interfaces/i-solution.interface';
import getContainerPositionSharedMethods from '../methods/get-container-position.shared-methods';

@Injectable()
export class SolutionValidationService {
  constructor() {}

  static validateSolution(
    solution: ISolution
  ): {error: SolutionError; effectedGoods: IGood[]}[] {
    if (solution === null) {
      return [{error: SolutionError.NoSolution, effectedGoods: []}];
    }
    if (!solution.container) {
      return [{error: SolutionError.NoContainer, effectedGoods: []}];
    }
    const output = [];
    const goodsXError1 = solution.container.goods.filter(x => x.xCoord < 0);
    if (goodsXError1.length > 0) {
      output.push({
        error: SolutionError.GoodBeforeContainerXCoord,
        effectedGoods: goodsXError1,
      });
    }
    const goodsXError2 = solution.container.goods.filter(
      x => x.xCoord + x.width > solution.container!.width
    );
    if (goodsXError2.length > 0) {
      output.push({
        error: SolutionError.GoodOutOfContainerXCoord,
        effectedGoods: goodsXError2,
      });
    }
    const goodsYError1 = solution.container.goods.filter(x => x.yCoord < 0);
    if (goodsYError1.length > 0) {
      output.push({
        error: SolutionError.GoodBeforeContainerYCoord,
        effectedGoods: goodsYError1,
      });
    }
    const goodsYError2 = solution.container.goods.filter(
      x => x.yCoord + x.height > solution.container!.height
    );
    if (goodsYError2.length > 0) {
      output.push({
        error: SolutionError.GoodOutOfContainerYCoord,
        effectedGoods: goodsYError2,
      });
    }
    const goodsZError1 = solution.container.goods.filter(x => x.zCoord < 0);
    if (goodsZError1.length > 0) {
      output.push({
        error: SolutionError.GoodBeforeContainerZCoord,
        effectedGoods: goodsZError1,
      });
    }
    const goodsZError2 = solution.container.goods.filter(
      x => x.zCoord + x.length > solution.container!.length
    );
    if (goodsZError2.length > 0) {
      output.push({
        error: SolutionError.GoodOutOfContainerZCoord,
        effectedGoods: goodsZError2,
      });
    }
    const dimensions = solution.container.goods.map(good => {
      return {good: good, dimension: getContainerPositionSharedMethods(good)};
    });
    for (const wrapper of dimensions) {
      const overlappingSet = this._cubeIsInAnotherCube(
        wrapper.dimension,
        Object.values(dimensions)
          .map(x => x.dimension)
          .filter(x => wrapper.dimension !== x)
      );
      if (overlappingSet.length > 0) {
        output.push({
          error: SolutionError.GoodOverlap,
          effectedGoods: [
            wrapper.good,
            ...overlappingSet.map(
              x => dimensions.find(y => y.dimension === x)?.good
            ),
          ].filter(good => !!good) as IGood[],
        });
      }
    }
    return output;
  }

  private static _cubeIsInAnotherCube(
    cube: IPosition,
    cubeSet: IPosition[]
  ): IPosition[] {
    return cubeSet.filter(x => this._cubeIsInCube(cube, x));
  }

  private static _cubeIsInCube(cube1: IPosition, cube2: IPosition) {
    const c1 = cube1.xCoord + cube1.width <= cube2.xCoord;
    const c2 = cube2.xCoord + cube2.width <= cube1.xCoord;
    const c3 = cube1.yCoord + cube1.height <= cube2.yCoord;
    const c4 = cube2.yCoord + cube2.height <= cube1.yCoord;
    const c5 = cube1.zCoord + cube1.length <= cube2.zCoord;
    const c6 = cube2.zCoord + cube2.length <= cube1.zCoord;
    return !c1 && !c2 && !c3 && !c4 && !c5 && !c6;
  }
}
