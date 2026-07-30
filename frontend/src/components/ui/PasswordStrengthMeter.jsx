// Lightweight custom heuristic instead of pulling in zxcvbn — good enough
// for live feedback that nudges toward the server's actual policy (10+
// chars, upper/lower/digit/special), not a substitute for it.
const LEVELS = [
  { label: 'Very weak', color: 'bg-red-400' },
  { label: 'Weak', color: 'bg-orange-400' },
  { label: 'Fair', color: 'bg-yellow-400' },
  { label: 'Good', color: 'bg-sage-500' },
  { label: 'Strong', color: 'bg-sage-600' },
];

export function scorePassword(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 10) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (password.length >= 16) score += 1;
  return Math.min(score, 5);
}

export default function PasswordStrengthMeter({ password }) {
  const score = scorePassword(password);
  const level = LEVELS[Math.max(0, score - 1)] || LEVELS[0];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i < score ? level.color : 'bg-ink-100'}`}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-ink-500">{level.label}</p>
    </div>
  );
}
