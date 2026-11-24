import React, { useId } from 'react';

interface KurasiLogoProps {
  className?: string;
  size?: number;
  variant?: 'solid' | 'gradient';
  showAccent?: boolean;
}

/**
 * Kurasi Logogram matching the latest brand reference:
 * Geometric "K" carved in negative space across 4 vibrant segments
 * (Deep Violet, Magenta-Pink, Tangerine Orange, Amber Gold) + optional slanted accent mark.
 */
export const KurasiLogo: React.FC<KurasiLogoProps> = ({
  className = '',
  size = 36,
  variant = 'solid',
  showAccent = true,
}) => {
  const uid = useId().replace(/:/g, '');
  const gradId = `kurasi-grad-${uid}`;
  const viewBox = showAccent ? '0 0 112 100' : '6 8 82 82';
  const width = showAccent ? Math.round(size * 1.12) : size;

  return (
    <svg
      width={width}
      height={size}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Kurasi Logogram"
    >
      {variant === 'gradient' && (
        <defs>
          <linearGradient id={gradId} x1="10" y1="22" x2="84" y2="82" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#611FD1" />
            <stop offset="48%" stopColor="#EA288E" />
            <stop offset="78%" stopColor="#FF6024" />
            <stop offset="100%" stopColor="#FF9B00" />
          </linearGradient>
        </defs>
      )}

      {/* Left D-shaped semicircle */}
      <path
        d="M 41 21 A 31 31 0 0 0 41 83 Z"
        fill={variant === 'gradient' ? `url(#${gradId})` : '#611FD1'}
      />

      {/* Top-right wedge */}
      <path
        d="M 51 14 A 35.5 35.5 0 0 1 78 29 L 51 44.5 Z"
        fill={variant === 'gradient' ? `url(#${gradId})` : '#FA1D8C'}
      />

      {/* Middle-right rounded wedge */}
      <path
        d="M 81 35 A 35.5 35.5 0 0 1 79 67 L 64 58.2 C 59.5 55.6 59.5 46.4 64 43.8 Z"
        fill={variant === 'gradient' ? `url(#${gradId})` : '#FF5E00'}
      />

      {/* Bottom-right wedge */}
      <path
        d="M 73 73 A 35.5 35.5 0 0 1 51 84.5 L 51 60.5 Z"
        fill={variant === 'gradient' ? `url(#${gradId})` : '#FF9B00'}
      />

      {/* Floating slanted prime / apostrophe accent */}
      {showAccent && (
        <path
          d="M 92 22 L 106 22 L 100 38 L 86 38 Z"
          fill="#FF9B00"
        />
      )}
    </svg>
  );
};

interface KurasiWordmarkProps {
  className?: string;
  height?: number;
  showTagline?: boolean;
}

/**
 * Full Kurasi Brand Lockup matching "3._Logo_Kurasi_-_Gradient_on_White_Rectangle":
 * Geometric K logogram + "urasi" smooth pink-to-violet gradient wordmark + slanted amber mark.
 */
export const KurasiWordmark: React.FC<KurasiWordmarkProps> = ({
  className = '',
  height = 34,
  showTagline = false,
}) => {
  const uid = useId().replace(/:/g, '');
  const kGradId = `kurasi-k-${uid}`;
  const textGradId = `kurasi-text-${uid}`;

  return (
    <div className={`inline-flex flex-col items-start select-none ${className}`}>
      <svg
        height={height}
        viewBox="0 0 264 78"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Kurasi — Your Data Storyteller Partner"
      >
        <defs>
          <linearGradient id={kGradId} x1="6" y1="22" x2="68" y2="70" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#611FD1" />
            <stop offset="45%" stopColor="#E62B92" />
            <stop offset="76%" stopColor="#FF6428" />
            <stop offset="100%" stopColor="#FF9B00" />
          </linearGradient>
          <linearGradient id={textGradId} x1="74" y1="36" x2="232" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F83490" />
            <stop offset="45%" stopColor="#9D2CE0" />
            <stop offset="100%" stopColor="#5E21D1" />
          </linearGradient>
        </defs>

        {/* Logogram "K" (without separate right accent, since accent sits after 'i') */}
        <g transform="translate(0, -2) scale(0.84)">
          <path d="M 41 21 A 31 31 0 0 0 41 83 Z" fill={`url(#${kGradId})`} />
          <path d="M 51 14 A 35.5 35.5 0 0 1 78 29 L 51 44.5 Z" fill={`url(#${kGradId})`} />
          <path
            d="M 81 35 A 35.5 35.5 0 0 1 79 67 L 64 58.2 C 59.5 55.6 59.5 46.4 64 43.8 Z"
            fill={`url(#${kGradId})`}
          />
          <path d="M 73 73 A 35.5 35.5 0 0 1 51 84.5 L 51 60.5 Z" fill={`url(#${kGradId})`} />
        </g>

        {/* Wordmark "urasi" (dotless stem on 'i' matching reference) */}
        <text
          x="74"
          y="67"
          fill={`url(#${textGradId})`}
          fontFamily="'Plus Jakarta Sans', 'Outfit', system-ui, sans-serif"
          fontWeight="800"
          fontSize="54"
          letterSpacing="-1.8"
        >
          urası
        </text>

        {/* Slanted Amber Parallelogram Accent after "i" */}
        <path d="M 239 14 L 254 14 L 247 32 L 232 32 Z" fill="#FF9B00" />
      </svg>

      {showTagline && (
        <span className="text-[11px] font-medium text-slate-500 tracking-wide pl-1 mt-0.5">
          Your Data Storyteller Partner
        </span>
      )}
    </div>
  );
};

export const KurasiBadge: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs">
      <KurasiLogo size={size === 'sm' ? 18 : size === 'lg' ? 26 : 22} variant="solid" />
      <div className="flex flex-col text-left">
        <span className="text-xs font-extrabold tracking-tight bg-gradient-to-r from-[#F83490] via-[#8E2CE0] to-[#5E21D1] bg-clip-text text-transparent">
          kurasi
        </span>
        <span className="text-[10px] text-slate-500 font-medium leading-none">
          Your Data Storyteller Partner
        </span>
      </div>
    </div>
  );
};
