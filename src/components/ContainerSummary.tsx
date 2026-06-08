import { Box } from "lucide-react";
import { formatLength, formatPercent, formatVolume } from "@/lib/format";
import type { Container } from "@/types/solution";
import { Metric } from "@/components/Metric";

type Props = {
  container: Container;
};

export function ContainerSummary({ container }: Props) {
  const used = container.goods.reduce(
    (sum, good) => sum + good.width * good.height * good.length,
    0,
  );
  const total = container.width * container.height * container.length;
  const percentage = total > 0 ? (used / total) * 100 : 0;

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-kicker">general</div>
          <h2>Container</h2>
        </div>
        <Box size={19} className="panel-icon" />
      </div>

      <div className="usage">
        <div className="usage-number">{formatPercent(percentage)}</div>
        <div className="usage-track">
          <span style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }} />
        </div>
        <div className="usage-caption">
          {formatVolume(used, container.unit, 2, true)} used
        </div>
      </div>

      <div className="metric-grid">
        <Metric
          label="width"
          value={formatLength(container.width, container.unit, 3, true)}
        />
        <Metric
          label="height"
          value={formatLength(container.height, container.unit, 3, true)}
        />
        <Metric
          label="length"
          value={formatLength(container.length, container.unit, 3, true)}
        />
        <Metric
          label="volume"
          value={formatVolume(total, container.unit, 2, true)}
        />
      </div>
    </section>
  );
}
