export default function FormField({ label, htmlFor, error, action, children }) {
  return (
    <div className="space-y-1.5">
      {(label || action) && (
        <div className="flex items-center justify-between">
          {label && (
            <label htmlFor={htmlFor} className="text-sm font-medium text-ink-800">
              {label}
            </label>
          )}
          {action}
        </div>
      )}
      {children}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
