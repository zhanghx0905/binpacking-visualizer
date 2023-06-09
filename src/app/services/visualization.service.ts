import {Injectable} from '@angular/core';

import * as ThreeJS from 'three';

import {defaultGoodEdgeColor, infinityReplacement} from '../globals';

import {IPositionedElement} from '../interfaces/i-positioned.interface';
import {IPosition} from '../interfaces/i-position.interface';
import {Store} from '@ngrx/store';
import {ISolution} from '../interfaces/i-solution.interface';
import getContainerPosition from '../methods/get-container-position.shared-methods';

@Injectable()
export class VisualizationService {
  constructor(private _store: Store) {}

  public async configureSolutionScene(
    solution: ISolution,
    scene: ThreeJS.Scene = new ThreeJS.Scene(),
    fillColor: boolean | string = false,
    addBaseGrid = true,
    addUnloadingArrow = true
  ) {
    scene.clear();
    const goodMeshes: {goodId: string; mesh: ThreeJS.Mesh}[] = [];
    if (solution?.container) {
      if (fillColor) {
        scene.background = new ThreeJS.Color(
          typeof fillColor === 'string' ? fillColor : 'rgb(255,255,255)'
        );
      }
      const containerPosition = getContainerPosition(solution.container);
      const containerResult = VisualizationService.generateOutlinedBoxMesh(
        containerPosition,
        'container'
      );
      scene.add(containerResult.edges);
      for (const good of solution.container!.goods) {
        const goodResult = VisualizationService.generateFilledBoxMesh(
          getContainerPosition(good),
          good.color ?? '#ffffff',
          'good',
          containerPosition
        );
        goodResult.mesh.userData['goodId'] = good.id;
        goodResult.mesh.userData['color'] = good.color;
        goodMeshes.push({goodId: good.id, mesh: goodResult.mesh});
        scene.add(goodResult.edges, goodResult.mesh);
      }
      if (addBaseGrid) {
        scene.add(
          VisualizationService.getContainerBaseGrid(
            solution.container.height,
            solution.container.length
          )
        );
      }
      if (addUnloadingArrow) {
        scene.add(
          VisualizationService.getContainerUnloadingArrow(
            solution.container.height,
            solution.container.length
          )
        );
      }
    }
    // return {scene, goodMeshes};
  }

  public static getContainerUnloadingArrow(
    containerHeight: number,
    containerLength: number,
    arrowColor = '#e33268'
  ) {
    const from = new ThreeJS.Vector3(
      0,
      containerHeight / -2,
      containerLength / 2
    );
    const to = new ThreeJS.Vector3(
      0,
      containerHeight / -2,
      containerLength / 2 + 1000
    );
    const direction = to.clone().sub(from);
    const length = direction.length();
    const arrowHelper = new ThreeJS.ArrowHelper(
      direction.normalize(),
      from,
      length,
      arrowColor,
      0.2 * length,
      0.2 * length * 0.5
    );
    return arrowHelper;
  }

  public static calculateRelativePosition(
    position: IPosition,
    relativeToParent?: IPosition
  ): IPositionedElement {
    return {
      xCoord: relativeToParent
        ? position.xCoord! - relativeToParent.width! / 2 + position.width! / 2
        : position.xCoord,
      yCoord: relativeToParent
        ? position.yCoord! - relativeToParent.height! / 2 + position.height! / 2
        : position.yCoord,
      zCoord: relativeToParent
        ? position.zCoord! -
          relativeToParent.length! / 2 +
          (position.length === Infinity
            ? infinityReplacement
            : position.length!) /
            2
        : position.zCoord,
    };
  }

  public static getContainerBaseGrid(
    containerHeight: number,
    containerLength: number
  ): ThreeJS.GridHelper {
    const gridHelper = new ThreeJS.GridHelper(1.5 * containerLength, 15);
    gridHelper.position.set(0, containerHeight / -2, 0);
    return gridHelper;
  }

  public static generateFilledBoxMesh(
    position: IPosition,
    surfaceColor: string,
    type: string,
    relativeToParent?: IPosition,
    borderColor: string = defaultGoodEdgeColor,
    borderWidth = 1
  ) {
    const geometry = new ThreeJS.BoxGeometry(
      position.width,
      position.height,
      position.length === Infinity ? infinityReplacement : position.length,
      4,
      4,
      4
    );
    const material = new ThreeJS.MeshBasicMaterial({color: surfaceColor});

    const mesh = new ThreeJS.Mesh(geometry, material);
    const relativePosition = this.calculateRelativePosition(
      position,
      relativeToParent
    );
    mesh.position.set(
      relativePosition.xCoord,
      relativePosition.yCoord,
      relativePosition.zCoord
    );
    mesh.userData = {type: type};

    const edges = new ThreeJS.LineSegments(
      new ThreeJS.EdgesGeometry(mesh.geometry),
      new ThreeJS.LineBasicMaterial({
        color: borderColor,
        linewidth: borderWidth,
      })
    );
    edges.position.set(
      relativePosition.xCoord,
      relativePosition.yCoord,
      relativePosition.zCoord
    );
    edges.userData = {type: type, positionId: position.id};

    return {mesh, edges};
  }

  public static generateOutlinedBoxMesh(
    position: IPosition,
    type: string,
    relativeToParent?: IPosition,
    borderColor: string = defaultGoodEdgeColor,
    borderWidth = 1
  ) {
    const geometry = new ThreeJS.BoxGeometry(
      position.width,
      position.height,
      position.length === Infinity ? infinityReplacement : position.length
    );
    const edges = new ThreeJS.LineSegments(
      new ThreeJS.EdgesGeometry(geometry),
      new ThreeJS.LineBasicMaterial({
        color: borderColor,
        linewidth: borderWidth,
      })
    );
    const relativePosition = this.calculateRelativePosition(
      position,
      relativeToParent
    );
    edges.position.set(
      relativePosition.xCoord,
      relativePosition.yCoord,
      relativePosition.zCoord
    );
    edges.userData = {type: type, positionId: position.id};

    return {edges};
  }
}
