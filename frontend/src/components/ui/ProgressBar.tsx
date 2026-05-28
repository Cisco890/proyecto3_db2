type Props = {
  percent: number;
  label?: string;
};

export function ProgressBar({ percent, label }: Props) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1 text-xs text-slate-500">
          <span>{label}</span>
          <span>{Math.round(clamped)}%</span>
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-slate-200">
        <div
          className="h-2 rounded-full bg-indigo-500 transition-all"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
