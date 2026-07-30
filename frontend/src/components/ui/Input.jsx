import clsx from 'clsx';
import { forwardRef } from 'react';

const Input = forwardRef(function Input({ className, error, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={clsx(
        'w-full rounded-xl border bg-cream-100 px-4 py-3 text-ink-800 placeholder:text-ink-400/70',
        'focus:outline-none focus:ring-2 focus:ring-plum-300 focus:border-plum-300',
        error ? 'border-red-400' : 'border-transparent',
        className
      )}
      {...props}
    />
  );
});

export default Input;
