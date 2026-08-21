import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

// Read-only display: <ReviewStars value={4.3} />
// Interactive input: <ReviewStars value={rating} onChange={setRating} interactive />
export default function ReviewStars({ value = 0, onChange, interactive = false, size = 'md', label }) {
  const dims = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';
  const stars = [1, 2, 3, 4, 5];

  if (!interactive) {
    return (
      <span className="inline-flex items-center gap-0.5" role="img" aria-label={label || `Rated ${value.toFixed ? value.toFixed(1) : value} out of 5 stars`}>
        {stars.map(s => (
          <Star
            key={s}
            className={cn(dims, s <= Math.round(value) ? 'fill-secondary text-secondary' : 'text-muted-foreground/40')}
            aria-hidden="true"
          />
        ))}
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-1" role="radiogroup" aria-label={label || 'Rating'}>
      {stars.map(s => (
        <button
          key={s}
          type="button"
          role="radio"
          aria-checked={value === s}
          aria-label={`${s} star${s > 1 ? 's' : ''}`}
          onClick={() => onChange?.(s)}
          className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Star className={cn(dims, s <= value ? 'fill-secondary text-secondary' : 'text-muted-foreground/40')} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
