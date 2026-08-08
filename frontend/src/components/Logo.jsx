import { useId } from "react";

/**
 * Tube Mill Reporting — mechanical (gear, wrench) + electrical (bolt, cable) + tube mill
 */
export default function Logo({ size = "md", showWordmark = false, className = "" }) {
  const uid = useId().replace(/:/g, "");
  const sizes = {
    sm: 36,
    md: 52,
    lg: 72,
  };
  const box = sizes[size] || sizes.md;

  return (
    <div
      className={`logo-wrap ${className}`}
      style={{ display: "flex", alignItems: "center", gap: showWordmark ? 12 : 0 }}
    >
      <svg
        width={box}
        height={box}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label={showWordmark ? "Tube Mill Reporting" : undefined}
        role={showWordmark ? "img" : "presentation"}
      >
        <defs>
          <linearGradient id={`${uid}-bg`} x1="6" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1e40af" />
            <stop offset="0.55" stopColor="#2563eb" />
            <stop offset="1" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id={`${uid}-mech`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#f8fafc" />
            <stop offset="1" stopColor="#cbd5e1" />
          </linearGradient>
          <linearGradient id={`${uid}-tube`} x1="16" y1="34" x2="48" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" />
            <stop offset="1" stopColor="#e0f2fe" />
          </linearGradient>
        </defs>

        <rect x="3" y="3" width="58" height="58" rx="15" fill={`url(#${uid}-bg)`} />
        <rect x="3" y="3" width="58" height="58" rx="15" stroke="#fff" strokeOpacity="0.2" strokeWidth="1" />

        {/* Mechanical — gear (top-left) */}
        <g transform="translate(11 11)" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round">
          <circle cx="9" cy="9" r="5.5" fill={`url(#${uid}-mech)`} stroke="#64748b" strokeWidth="1" />
          <path
            fill={`url(#${uid}-mech)`}
            stroke="#64748b"
            d="M9 2.5v2M9 13.5v2M2.5 9h2M13.5 9h2M4.6 4.6l1.4 1.4M12 12l1.4 1.4M13.4 4.6L12 6M6 12l-1.4 1.4"
          />
          <circle cx="9" cy="9" r="2" fill="#475569" stroke="none" />
        </g>

        {/* Electrical — lightning (top-right) */}
        <path
          d="M44 10h7l-5 9h4.5L41 28l2-11h-4l5-7z"
          fill="#fbbf24"
          stroke="#fff"
          strokeWidth="1"
          strokeLinejoin="round"
        />

        {/* Electrical — cable / wire arc */}
        <path
          d="M46 38c6-2 8-6 6-10"
          stroke="#fde68a"
          strokeWidth="1.75"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="52" cy="27" r="2" fill="#fbbf24" stroke="#fff" strokeWidth="0.75" />

        {/* Tube mill — three rollers */}
        <circle cx="22" cy="26" r="3.5" fill="#94a3b8" stroke="#fff" strokeWidth="1" strokeOpacity="0.6" />
        <circle cx="32" cy="24" r="3.5" fill="#cbd5e1" stroke="#fff" strokeWidth="1" strokeOpacity="0.6" />
        <circle cx="42" cy="26" r="3.5" fill="#94a3b8" stroke="#fff" strokeWidth="1" strokeOpacity="0.6" />

        {/* Tube */}
        <rect x="15" y="34" width="34" height="12" rx="6" fill={`url(#${uid}-tube)`} />
        <rect x="15" y="34" width="34" height="12" rx="6" stroke="#fff" strokeWidth="1.1" strokeOpacity="0.55" />
        <ellipse cx="15" cy="40" rx="3" ry="6" fill="#93c5fd" />
        <ellipse cx="49" cy="40" rx="3" ry="6" fill="#60a5fa" />

        {/* Mechanical — wrench (bottom-left) */}
        <g transform="translate(8 44) rotate(-35 8 8)" strokeLinecap="round">
          <path
            d="M2 14c0-3.3 2.7-6 6-6 1.2 0 2.3.3 3.3.9l3.5-3.5 2.1 2.1-3.5 3.5c.6 1 .9 2.1.9 3.3 0 3.3-2.7 6-6 6s-6-2.7-6-6z"
            fill="#e2e8f0"
            stroke="#475569"
            strokeWidth="1.2"
          />
          <path d="M11.5 5.5l4 4" stroke="#64748b" strokeWidth="2" />
        </g>

        {/* Electrical — plug / terminal (bottom-right) */}
        <rect x="48" y="46" width="8" height="10" rx="2" fill="#1e293b" stroke="#fbbf24" strokeWidth="1.2" />
        <rect x="50" y="49" width="1.5" height="4" rx="0.5" fill="#fbbf24" />
        <rect x="52.5" y="49" width="1.5" height="4" rx="0.5" fill="#fbbf24" />
      </svg>
      {showWordmark && (
        <div className="logo-wordmark">
          <span className="logo-title">Tube Mill</span>
          <span className="logo-sub">Reporting</span>
        </div>
      )}
    </div>
  );
}
