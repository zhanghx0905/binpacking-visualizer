import { Shuffle, Wand2 } from "lucide-react";

type Props = {
  count: number;
  seed: number;
  onCountChange: (count: number) => void;
  onSeedChange: (seed: number) => void;
  onGenerate: () => void;
  onOptimize: () => void;
};

export function OptimizerControls({
  count,
  seed,
  onCountChange,
  onSeedChange,
  onGenerate,
  onOptimize,
}: Props) {
  return (
    <section className="panel optimizer-panel">
      <div className="panel-header">
        <div>
          <div className="panel-kicker">packing</div>
          <h2>optimizer</h2>
        </div>
        <Wand2 size={19} className="panel-icon" />
      </div>

      <div className="optimizer-grid">
        <label>
          <span>items</span>
          <input
            min={1}
            max={60}
            type="number"
            value={count}
            onChange={(event) => onCountChange(Number(event.target.value))}
          />
        </label>
        <label>
          <span>seed</span>
          <input
            min={1}
            type="number"
            value={seed}
            onChange={(event) => onSeedChange(Number(event.target.value))}
          />
        </label>
      </div>

      <div className="optimizer-actions">
        <button type="button" className="action-button" onClick={onGenerate}>
          <Shuffle size={16} />
          <span>random example</span>
        </button>
        <button type="button" className="action-button" onClick={onOptimize}>
          <Wand2 size={16} />
          <span>optimize current</span>
        </button>
      </div>
    </section>
  );
}
