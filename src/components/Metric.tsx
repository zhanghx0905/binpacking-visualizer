type Props = {
  label: string;
  value: string | number;
};

export function Metric({ label, value }: Props) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
    </div>
  );
}
