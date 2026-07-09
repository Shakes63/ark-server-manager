/**
 * The Palisade mark — a wall of sharpened stakes (same art as the app icon /
 * Unraid icon, inlined so the header never waits on a fetch). Sized via className.
 */
export function Logo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden="true">
      <rect width="512" height="512" rx="96" fill="#0f172a" />
      <g stroke="#0f172a" strokeWidth="10" strokeLinejoin="round">
        <path d="M78 436 V196 L118 148 L158 196 V436 Z" fill="#0d9488" />
        <path d="M170 436 V150 L210 102 L250 150 V436 Z" fill="#10b981" />
        <path d="M262 436 V116 L302 68 L342 116 V436 Z" fill="#10b981" />
        <path d="M354 436 V162 L394 114 L434 162 V436 Z" fill="#0d9488" />
      </g>
      <rect x="58" y="252" width="396" height="30" rx="15" fill="#0f172a" opacity="0.55" />
      <rect x="58" y="342" width="396" height="30" rx="15" fill="#0f172a" opacity="0.55" />
    </svg>
  );
}
