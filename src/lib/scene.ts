import * as Three from "three";
import type { Good, Positioned, Solution, Space } from "@/types/solution";

const defaultGoodEdgeColor = "#2a2a2a";
const selectedGoodColor = "#ffffff";
const infinityReplacement = 100;

export type SceneHandles = {
  scene: Three.Scene;
  goodMeshes: Map<string, Three.Mesh>;
};

type BoxPosition = Space & Positioned;

export function createSolutionScene(solution: Solution): SceneHandles {
  const scene = new Three.Scene();
  scene.background = new Three.Color("rgb(238,238,238)");
  const goodMeshes = new Map<string, Three.Mesh>();
  const container = solution.container;
  const containerBox = toBoxPosition(container);

  scene.add(generateOutlinedBox(containerBox, "container"));

  for (const good of container.goods) {
    const { mesh, edges } = generateGoodBox(
      toBoxPosition(good),
      good.color ?? "#ffffff",
      containerBox,
    );
    mesh.userData.goodId = good.id;
    mesh.userData.color = good.color;
    edges.userData.goodId = good.id;
    goodMeshes.set(good.id, mesh);
    scene.add(edges, mesh);
  }

  scene.add(getContainerBaseGrid(container.height, container.length));
  scene.add(getContainerUnloadingArrow(container.height, container.length));
  return { scene, goodMeshes };
}

export function setHighlightedGood(
  goodMeshes: Map<string, Three.Mesh>,
  goodId: string | null,
) {
  Array.from(goodMeshes.entries()).forEach(([currentGoodId, mesh]) => {
    const material = mesh.material as Three.MeshBasicMaterial;
    material.color.set(
      goodId && currentGoodId === goodId
        ? selectedGoodColor
        : mesh.userData.color ?? "#000000",
    );
  });
}

export function disposeScene(scene: Three.Scene) {
  scene.traverse((object) => {
    if (object instanceof Three.Mesh || object instanceof Three.LineSegments) {
      object.geometry?.dispose();
      const material = object.material;
      if (Array.isArray(material)) {
        material.forEach((entry) => entry.dispose());
      } else {
        material?.dispose();
      }
    }
  });
  scene.clear();
}

function toBoxPosition(input: BoxPosition): BoxPosition {
  return {
    width: input.width,
    height: input.height,
    length: input.length === Infinity ? infinityReplacement : input.length,
    xCoord: input.xCoord,
    yCoord: input.yCoord,
    zCoord: input.zCoord,
  };
}

function generateGoodBox(
  position: BoxPosition,
  color: string,
  relativeTo: BoxPosition,
) {
  const geometry = new Three.BoxGeometry(
    position.width,
    position.height,
    position.length,
    4,
    4,
    4,
  );
  const material = new Three.MeshBasicMaterial({ color });
  const relativePosition = calculateRelativePosition(position, relativeTo);

  const mesh = new Three.Mesh(geometry, material);
  mesh.position.set(
    relativePosition.xCoord,
    relativePosition.yCoord,
    relativePosition.zCoord,
  );
  mesh.userData.type = "good";

  const edges = new Three.LineSegments(
    new Three.EdgesGeometry(mesh.geometry),
    new Three.LineBasicMaterial({ color: defaultGoodEdgeColor }),
  );
  edges.position.copy(mesh.position);
  edges.userData.type = "good";

  return { mesh, edges };
}

function generateOutlinedBox(position: BoxPosition, type: string) {
  const geometry = new Three.BoxGeometry(
    position.width,
    position.height,
    position.length,
  );
  const edges = new Three.LineSegments(
    new Three.EdgesGeometry(geometry),
    new Three.LineBasicMaterial({ color: defaultGoodEdgeColor }),
  );
  edges.userData.type = type;
  return edges;
}

function calculateRelativePosition(
  position: BoxPosition,
  relativeTo?: BoxPosition,
): Positioned {
  if (!relativeTo) {
    return {
      xCoord: position.xCoord,
      yCoord: position.yCoord,
      zCoord: position.zCoord,
    };
  }

  return {
    xCoord: position.xCoord - relativeTo.width / 2 + position.width / 2,
    yCoord: position.yCoord - relativeTo.height / 2 + position.height / 2,
    zCoord: position.zCoord - relativeTo.length / 2 + position.length / 2,
  };
}

function getContainerBaseGrid(containerHeight: number, containerLength: number) {
  const gridHelper = new Three.GridHelper(1.5 * containerLength, 15);
  gridHelper.position.set(0, containerHeight / -2, 0);
  return gridHelper;
}

function getContainerUnloadingArrow(
  containerHeight: number,
  containerLength: number,
  arrowColor = "#e33268",
) {
  const from = new Three.Vector3(0, containerHeight / -2, containerLength / 2);
  const to = new Three.Vector3(0, containerHeight / -2, containerLength / 2 + 1000);
  const direction = to.clone().sub(from);
  const length = direction.length();
  return new Three.ArrowHelper(
    direction.normalize(),
    from,
    length,
    arrowColor,
    0.2 * length,
    0.1 * length,
  );
}

export function findGoodById(goods: Good[], goodId: string | null): Good | null {
  if (!goodId) {
    return null;
  }
  return goods.find((good) => good.id === goodId) ?? null;
}
