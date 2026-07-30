import clsx from 'clsx';

const tones = {
  sage: 'bg-sage-500 text-white',
  plum: 'bg-plum-500 text-white',
  ink: 'bg-ink-800 text-white',
  neutral: 'bg-ink-50 text-ink-600',
};

export default function Badge({ tone = 'sage', className, children }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
