"use client";

import { useCallback, useEffect, useRef } from "react";
import * as Three from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  createSolutionScene,
  disposeScene,
  setHighlightedGood,
  type SceneHandles,
} from "@/lib/scene";
import type { Solution } from "@/types/solution";

type Props = {
  solution: Solution;
  activeGoodId: string | null;
  onHoverGood: (goodId: string | null) => void;
  onSelectGood: (goodId: string | null) => void;
};

type PointerLikeEvent = {
  clientX: number;
  clientY: number;
};

export function Visualizer3D({
  solution,
  activeGoodId,
  onHoverGood,
  onSelectGood,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<Three.WebGLRenderer | null>(null);
  const cameraRef = useRef<Three.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const handlesRef = useRef<SceneHandles | null>(null);
  const frameRef = useRef<number | null>(null);
  const raycasterRef = useRef(new Three.Raycaster());

  const resize = useCallback(() => {
    const wrapper = wrapperRef.current;
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    if (!wrapper || !renderer || !camera) {
      return;
    }

    const width = Math.max(wrapper.clientWidth, 1);
    const height = Math.max(wrapper.clientHeight, 1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) {
      return;
    }

    const renderer = new Three.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.className = "visualizer-canvas";
    wrapper.appendChild(renderer.domElement);

    const camera = new Three.PerspectiveCamera(20, 1, 1, 10000000);
    camera.position.set(12000, 5000, 10000);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.minDistance = 5000;
    controls.maxDistance = 50000;
    controls.rotateSpeed = 0.5;

    rendererRef.current = renderer;
    cameraRef.current = camera;
    controlsRef.current = controls;
    resize();

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      controls.update();
      const scene = handlesRef.current?.scene;
      if (scene) {
        renderer.render(scene, camera);
      }
    };
    animate();

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
      controls.dispose();
      handlesRef.current && disposeScene(handlesRef.current.scene);
      renderer.dispose();
      renderer.domElement.remove();
      controlsRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      handlesRef.current = null;
    };
  }, [resize]);

  useEffect(() => {
    handlesRef.current && disposeScene(handlesRef.current.scene);
    handlesRef.current = createSolutionScene(solution);
    resize();
  }, [resize, solution]);

  useEffect(() => {
    if (handlesRef.current) {
      setHighlightedGood(handlesRef.current.goodMeshes, activeGoodId);
    }
  }, [activeGoodId]);

  const pickGood = useCallback((event: PointerLikeEvent) => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const handles = handlesRef.current;
    if (!renderer || !camera || !handles) {
      return null;
    }

    const rect = renderer.domElement.getBoundingClientRect();
    const pointer = new Three.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -(((event.clientY - rect.top) / rect.height) * 2 - 1),
    );
    raycasterRef.current.setFromCamera(pointer, camera);
    const intersections = raycasterRef.current.intersectObjects(
      Array.from(handles.goodMeshes.values()),
      false,
    );
    return (intersections[0]?.object.userData.goodId as string | undefined) ?? null;
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="visualizer"
      onPointerMove={(event) => onHoverGood(pickGood(event))}
      onPointerLeave={() => onHoverGood(null)}
      onClick={(event) => onSelectGood(pickGood(event))}
    />
  );
}
