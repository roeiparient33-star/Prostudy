export default function ProgressBar({ value, label, showLabel = true, color, size = 'md' }) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  const height = size === 'sm' ? '6px' : '8px';

  const fillColor = color
    ? `linear-gradient(90deg, ${color}cc, ${color})`
    : pct >= 80
    ? 'linear-gradient(90deg, #22b85f, #28C96F)'
    : pct >= 50
    ? 'linear-gradient(90deg, #4570f0, #4F7EF7)'
    : 'linear-gradient(90deg, #f57c24, #FF6524)';

  return (
    <div className="progress-wrap">
      {showLabel && (
        <div className="progress-label-row">
          {label && <span className="progress-label">{label}</span>}
          <span className="progress-pct">{pct}%</span>
        </div>
      )}
      <div className="progress-track" style={{ height }}>
        <div
          className="progress-fill"
          style={{ width: `${pct}%`, background: fillColor }}
        />
      </div>
    </div>
  );
}
