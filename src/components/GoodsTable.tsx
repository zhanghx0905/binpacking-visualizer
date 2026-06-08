import type { Good, Unit } from "@/types/solution";
import { formatLength } from "@/lib/format";

type Props = {
  goods: Good[];
  unit: Unit;
  activeGoodId: string | null;
  selectedGoodId: string | null;
  onHoverGood: (goodId: string | null) => void;
  onSelectGood: (goodId: string) => void;
};

export function GoodsTable({
  goods,
  unit,
  activeGoodId,
  selectedGoodId,
  onHoverGood,
  onSelectGood,
}: Props) {
  return (
    <section className="panel goods-panel">
      <div className="panel-header">
        <div>
          <div className="panel-kicker">positioned goods</div>
          <h2>goods</h2>
        </div>
        <span className="count-badge">{goods.length}</span>
      </div>

      {goods.length > 0 ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>description</th>
                <th>height</th>
                <th>width</th>
                <th>length</th>
              </tr>
            </thead>
            <tbody>
              {goods.map((good) => (
                <tr
                  key={good.id}
                  className={
                    good.id === selectedGoodId
                      ? "selected"
                      : good.id === activeGoodId
                        ? "active"
                        : undefined
                  }
                  onMouseEnter={() => onHoverGood(good.id)}
                  onMouseLeave={() => onHoverGood(null)}
                  onClick={() => onSelectGood(good.id)}
                >
                  <td>{good.desc ?? "unknown"}</td>
                  <td>{formatLength(good.height, unit, 0)}</td>
                  <td>{formatLength(good.width, unit, 0)}</td>
                  <td>{formatLength(good.length, unit, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">no goods available</div>
      )}
    </section>
  );
}
