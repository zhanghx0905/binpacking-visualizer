import { Search, ShieldCheck, TriangleAlert } from "lucide-react";
import { validationErrorText } from "@/lib/validation";
import type { ValidationIssue } from "@/types/solution";

type Props = {
  issues: ValidationIssue[];
  onHoverGood: (goodId: string | null) => void;
};

export function ValidationPanel({ issues, onHoverGood }: Props) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-kicker">solution validation</div>
          <h2 className={issues.length > 0 ? "error-text" : undefined}>
            validator
          </h2>
        </div>
        {issues.length > 0 ? (
          <TriangleAlert size={19} className="error-text" />
        ) : (
          <ShieldCheck size={19} className="success-text" />
        )}
      </div>

      {issues.length > 0 ? (
        <div className="issue-list">
          {issues.map((issue, index) => {
            const firstGoodId = issue.affectedGoods[0]?.id ?? null;
            return (
              <div className="issue-row" key={`${issue.error}-${index}`}>
                <span>{validationErrorText(issue.error)}</span>
                <button
                  className="icon-button"
                  type="button"
                  title="focus"
                  disabled={!firstGoodId}
                  onMouseEnter={() => onHoverGood(firstGoodId)}
                  onMouseLeave={() => onHoverGood(null)}
                >
                  <Search size={16} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">solution is valid</div>
      )}
    </section>
  );
}
