type StatusBadgeProps = {
  value: string;
  tone?: "default" | "success" | "warning" | "danger";
};
export function StatusBadge({ value, tone = "default" }: StatusBadgeProps) {
  return (
    <span className={`status-badge ${tone}`}>{value.replaceAll("_", " ")}</span>
  );
}
