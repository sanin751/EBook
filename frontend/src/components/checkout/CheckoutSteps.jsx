import clsx from 'clsx';

const STEPS = [
  { key: 'shipping', label: 'Shipping' },
  { key: 'payment', label: 'Payment' },
  { key: 'review', label: 'Review' },
];

export default function CheckoutSteps({ current }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="mb-10 flex items-center justify-center gap-3 sm:gap-6">
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={step.key} className="flex items-center gap-3 sm:gap-6">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={clsx(
                  'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold',
                  isDone && 'bg-sage-500 text-white',
                  isCurrent && 'bg-plum-500 text-white',
                  !isDone && !isCurrent && 'bg-ink-100 text-ink-500'
                )}
              >
                {isDone ? '✓' : i + 1}
              </span>
              <span
                className={clsx(
                  'text-xs font-medium',
                  isCurrent ? 'text-plum-600' : isDone ? 'text-sage-600' : 'text-ink-400'
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && <span className="h-px w-10 bg-ink-100 sm:w-20" />}
          </div>
        );
      })}
    </div>
  );
}
