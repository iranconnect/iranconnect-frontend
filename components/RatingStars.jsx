//frontend/components/RatingStars.jsx
import { useState, useEffect } from 'react';

export default function RatingStars({ value = 0, onChange }) {
  const [v, setV] = useState(0);

  /* 🛡️ Sync & sanitize initial value */
  useEffect(() => {
    const safeValue = Number.isInteger(value)
      ? Math.max(1, Math.min(5, value))
      : 0;
    setV(safeValue);
  }, [value]);

  /* 🛡️ Defensive UI hardening (NOT backend security) */
  function setRating(n) {
    if (typeof onChange !== 'function') return;

    const safe = Math.max(1, Math.min(5, n));
    setV(safe);
    onChange(safe);
  }

  return (
    <div className="flex gap-2" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"                 // 🛡️ prevent form submit
          onClick={() => setRating(n)}
          disabled={!onChange}          // 🛡️ read-only mode
          aria-label={`Rate ${n}`}
          aria-checked={n === v}
          role="radio"
          className="text-2xl leading-none disabled:cursor-not-allowed"
        >
          <span
            className={
              n <= v
                ? 'text-[var(--turquoise)]'
                : 'text-muted'
            }
          >
            ★
          </span>
        </button>
      ))}
    </div>
  );
}
