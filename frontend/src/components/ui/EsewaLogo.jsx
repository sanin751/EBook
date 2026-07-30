export default function EsewaLogo({ className = 'h-8 w-8' }) {
  return (
    <svg viewBox="0 0 40 40" className={className} role="img" aria-label="eSewa">
      <circle cx="20" cy="20" r="20" fill="#60BB46" />
      <text
        x="20"
        y="28"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="22"
        fontWeight="700"
        fontStyle="italic"
        fill="#ffffff"
      >
        e
      </text>
    </svg>
  );
}
