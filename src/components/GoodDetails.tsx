import { Search } from "lucide-react";
import { formatLength, formatVolume } from "@/lib/format";
import type { Good, Unit } from "@/types/solution";
import { Metric } from "@/components/Metric";

type Props = {
  title: string;
  good: Good | null;
  unit: Unit;
  accent?: boolean;
  onFocus?: (goodId: string) => void;
};

export function GoodDetails({ title, good, unit, accent = false, onFocus }: Props) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-kicker">{title}</div>
          <h2 className={accent ? "accent-text" : undefined}>
            {good?.desc ?? "no element"}
          </h2>
        </div>
        <button
          className="icon-button"
          type="button"
          title="focus"
          disabled={!good}
          onClick={() => good && onFocus?.(good.id)}
        >
          <Search size={17} />
        </button>
      </div>

      {good ? (
        <div className="metric-grid">
          <Metric label="width" value={formatLength(good.width, unit, 2, true)} />
          <Metric label="height" value={formatLength(good.height, unit, 2, true)} />
          <Metric label="length" value={formatLength(good.length, unit, 2, true)} />
          <Metric
            label="volume"
            value={formatVolume(good.width * good.height * good.length, unit, 2, true)}
          />
          <Metric label="x-coordinate" value={good.xCoord} />
          <Metric label="y-coordinate" value={good.yCoord} />
          <Metric label="z-coordinate" value={good.zCoord} />
        </div>
      ) : null}
    </section>
  );
}
