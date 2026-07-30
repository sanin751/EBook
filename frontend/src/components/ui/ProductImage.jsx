import clsx from 'clsx';
import { swatchFor } from '../../utils/colorSwatches';

function BookIcon({ className, style }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} style={style}>
      <path
        d="M32 14c-4-3-11-4-18-3v34c7-1 14 0 18 3 4-3 11-4 18-3V11c-7-1-14 0-18 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M32 14v34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function ProductImage({ src, alt, className, imgClassName }) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={clsx('h-full w-full object-cover', imgClassName)}
        loading="lazy"
      />
    );
  }

  const bg = swatchFor(alt);

  return (
    <div
      className={clsx('flex h-full w-full items-center justify-center', className)}
      style={{ backgroundColor: `${bg}33` }}
    >
      <BookIcon className="h-1/3 w-1/3" style={{ color: bg }} />
    </div>
  );
}
