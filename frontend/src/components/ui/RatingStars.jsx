import clsx from 'clsx';

export default function RatingStars({ rating = 0, count, size = 'sm' }) {
  const rounded = Math.round(rating);
  const starSize = size === 'lg' ? 'text-lg' : 'text-sm';

  return (
    <span className={clsx('inline-flex items-center gap-1 text-plum-500', starSize)}>
      <span aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (i < rounded ? '★' : '☆')).join('')}
      </span>
      {count != null && <span className="text-ink-400 text-xs font-normal">({count})</span>}
    </span>
  );
}
