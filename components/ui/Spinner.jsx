export function Spinner({ size = 'compact', label = 'Loading' }) {
  const resolvedSize = size === 'panel' ? 'panel' : 'compact';
  const accessibleLabel =
    typeof label === 'string' && label.trim() ? label.trim() : 'Loading';

  return (
    <span
      className={`spinner spinner--${resolvedSize}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="spinner__indicator" aria-hidden="true" />
      <span className="sr-only">{accessibleLabel}</span>
    </span>
  );
}

export default Spinner;