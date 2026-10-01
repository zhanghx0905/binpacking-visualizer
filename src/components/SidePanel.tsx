import { Cuboid, Download, RefreshCw, Upload } from "lucide-react";
import { ContainerSummary } from "@/components/ContainerSummary";
import { GoodsTable } from "@/components/GoodsTable";
import { OptimizerControls } from "@/components/OptimizerControls";
import { ValidationPanel } from "@/components/ValidationPanel";
import type { Solution, ValidationIssue } from "@/types/solution";

type Props = {
  solutions: Solution[];
  currentSolution: Solution;
  currentIndex: number;
  issues: ValidationIssue[];
  activeGoodId: string | null;
  selectedGoodId: string | null;
  onSelectSolution: (index: number) => void;
  onUpload: (file: File) => void;
  onDownload: () => void;
  randomCount: number;
  randomSeed: number;
  onRandomCountChange: (count: number) => void;
  onRandomSeedChange: (seed: number) => void;
  onGenerateRandomExample: () => void;
  onOptimizeCurrentSolution: () => void;
  onHoverGood: (goodId: string | null) => void;
  onSelectGood: (goodId: string) => void;
};

export function SidePanel({
  solutions,
  currentSolution,
  currentIndex,
  issues,
  activeGoodId,
  selectedGoodId,
  onSelectSolution,
  onUpload,
  onDownload,
  randomCount,
  randomSeed,
  onRandomCountChange,
  onRandomSeedChange,
  onGenerateRandomExample,
  onOptimizeCurrentSolution,
  onHoverGood,
  onSelectGood,
}: Props) {
  return (
    <aside className="side-panel">
      <div className="nav-strip">
        <div className="nav-item active">
          <Cuboid size={18} />
          <span>visualization</span>
        </div>
      </div>

      <div className="solution-title">
        <div className="eyebrow">solution</div>
        <h1>{currentSolution.description ?? "unknown"}</h1>
        <div className="solution-meta">
          {currentSolution.calculationSource.title}
          {currentSolution.calculated
            ? ` - ${new Date(currentSolution.calculated).toLocaleString()}`
            : ""}
        </div>
      </div>

      {solutions.length > 1 ? (
        <label className="select-label">
          <span>current solution</span>
          <select
            value={currentIndex}
            onChange={(event) => onSelectSolution(Number(event.target.value))}
          >
            {solutions.map((solution, index) => (
              <option key={solution.id} value={index}>
                {solution.description ?? solution.id}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <OptimizerControls
        count={randomCount}
        seed={randomSeed}
        onCountChange={onRandomCountChange}
        onSeedChange={onRandomSeedChange}
        onGenerate={onGenerateRandomExample}
        onOptimize={onOptimizeCurrentSolution}
      />

      <ContainerSummary
        container={currentSolution.container}
        unpackedCount={currentSolution.unpackedGoods?.length ?? 0}
      />

      <GoodsTable
        goods={currentSolution.container.goods}
        unit={currentSolution.container.unit}
        activeGoodId={activeGoodId}
        selectedGoodId={selectedGoodId}
        onHoverGood={onHoverGood}
        onSelectGood={onSelectGood}
      />

      <ValidationPanel issues={issues} onHoverGood={onHoverGood} />

      <div className="panel-actions">
        <label className="action-button">
          <Upload size={16} />
          <span>upload</span>
          <input
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                onUpload(file);
                event.target.value = "";
              }
            }}
          />
        </label>
        <button type="button" className="action-button" onClick={onDownload}>
          <Download size={16} />
          <span>download</span>
        </button>
        <button
          type="button"
          className="action-button"
          onClick={() => location.reload()}
        >
          <RefreshCw size={16} />
          <span>reload</span>
        </button>
      </div>
    </aside>
  );
}
