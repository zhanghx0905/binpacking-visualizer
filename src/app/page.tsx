"use client";

import { useEffect, useMemo, useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { GoodDetails } from "@/components/GoodDetails";
import { SidePanel } from "@/components/SidePanel";
import { Visualizer3D } from "@/components/Visualizer3D";
import { findGoodById } from "@/lib/scene";
import {
  normalizeSolutionFile,
  serializeSolution,
} from "@/lib/normalize-solution";
import { validateSolution } from "@/lib/validation";
import type { Solution } from "@/types/solution";

export default function Home() {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoveredGoodId, setHoveredGoodId] = useState<string | null>(null);
  const [selectedGoodId, setSelectedGoodId] = useState<string | null>(null);
  const [panelVisible, setPanelVisible] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/data/exemplary-solution.json")
      .then((response) => response.json())
      .then((payload) => {
        if (!cancelled) {
          setSolutions([normalizeSolutionFile(payload)]);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load exemplary solution.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const currentSolution = solutions[currentIndex] ?? null;
  const issues = useMemo(
    () => validateSolution(currentSolution),
    [currentSolution],
  );
  const activeGoodId = hoveredGoodId ?? selectedGoodId;
  const hoveredGood = currentSolution
    ? findGoodById(currentSolution.container.goods, hoveredGoodId)
    : null;
  const selectedGood = currentSolution
    ? findGoodById(currentSolution.container.goods, selectedGoodId)
    : null;

  async function uploadSolution(file: File) {
    try {
      const payload = JSON.parse(await file.text());
      const nextSolution = normalizeSolutionFile(payload);
      setSolutions((existing) => [...existing, nextSolution]);
      setCurrentIndex(solutions.length);
      setHoveredGoodId(null);
      setSelectedGoodId(null);
      setError(null);
    } catch {
      setError("The selected file is not a valid solution JSON.");
    }
  }

  function downloadSolution() {
    if (!currentSolution) {
      return;
    }
    const blob = new Blob(
      [JSON.stringify(serializeSolution(currentSolution), null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const element = document.createElement("a");
    element.href = url;
    element.download = `${currentSolution.description ?? "solution"}.json`;
    document.body.appendChild(element);
    element.click();
    element.remove();
    URL.revokeObjectURL(url);
  }

  if (error && !currentSolution) {
    return <main className="loading-state">{error}</main>;
  }

  if (!currentSolution) {
    return <main className="loading-state">Loading solution...</main>;
  }

  return (
    <main className="app-shell">
      {panelVisible ? (
        <SidePanel
          solutions={solutions}
          currentSolution={currentSolution}
          currentIndex={currentIndex}
          issues={issues}
          activeGoodId={activeGoodId}
          selectedGoodId={selectedGoodId}
          onSelectSolution={(index) => {
            setCurrentIndex(index);
            setHoveredGoodId(null);
            setSelectedGoodId(null);
          }}
          onUpload={uploadSolution}
          onDownload={downloadSolution}
          onHoverGood={setHoveredGoodId}
          onSelectGood={setSelectedGoodId}
        />
      ) : null}

      <button
        className="panel-toggle"
        type="button"
        title={panelVisible ? "hide panel" : "show panel"}
        onClick={() => setPanelVisible((visible) => !visible)}
      >
        {panelVisible ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
      </button>

      <Visualizer3D
        solution={currentSolution}
        activeGoodId={activeGoodId}
        onHoverGood={setHoveredGoodId}
        onSelectGood={setSelectedGoodId}
      />

      {error ? <div className="toast">{error}</div> : null}

      <div className="details-stack">
        <GoodDetails
          title="hovered element"
          good={hoveredGood}
          unit={currentSolution.container.unit}
          onFocus={setSelectedGoodId}
        />
        <GoodDetails
          title="selected element"
          good={selectedGood}
          unit={currentSolution.container.unit}
          accent
          onFocus={setSelectedGoodId}
        />
      </div>
    </main>
  );
}
