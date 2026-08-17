import React from 'react';

interface WarsgateLogoProps {
  className?: string;
  variant?: 'full' | 'icon' | 'compact';
  lightMode?: boolean; // true for white background / printing
}

export const WarsgateLogo: React.FC<WarsgateLogoProps> = ({
  className = 'h-10',
  variant = 'full',
  lightMode = false
}) => {
  if (variant === 'icon') {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ic-red" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
          <linearGradient id="ic-maroon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#991b1b" />
            <stop offset="100%" stopColor="#450a0a" />
          </linearGradient>
        </defs>
        
        {/* Splash dots */}
        <circle cx="14" cy="22" r="6" fill="#881337" />
        <circle cx="28" cy="32" r="8" fill="#991b1b" />
        <circle cx="18" cy="52" r="5" fill="#dc2626" />
        <circle cx="32" cy="65" r="7" fill="#7f1d1d" />
        <circle cx="20" cy="80" r="5" fill="#be123c" />

        {/* Back Maroon Stroke */}
        <path d="M38,12 L58,80 L76,32 L92,80 L108,12" 
              stroke="url(#ic-maroon)" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Front Vivid Red Stroke */}
        <path d="M46,10 L66,86 L84,24 L100,86 L116,10" 
              stroke="url(#ic-red)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  const gateTextColor = lightMode ? '#0f172a' : '#ffffff';
  const automationTextColor = lightMode ? '#475569' : '#94a3b8';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Vector Icon */}
      <svg className="h-full aspect-[1.3/1] shrink-0" viewBox="0 0 160 110" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="wg-red-main" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="50%" stopColor="#e11d48" />
            <stop offset="100%" stopColor="#be123c" />
          </linearGradient>
          <linearGradient id="wg-maroon-main" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#991b1b" />
            <stop offset="100%" stopColor="#450a0a" />
          </linearGradient>
          <filter id="shadow-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#dc2626" floodOpacity="0.3"/>
          </filter>
        </defs>

        {/* Splash Dots Left */}
        <g opacity="0.95">
          <circle cx="12" cy="18" r="7.5" fill="#7f1d1d" />
          <circle cx="28" cy="24" r="9.5" fill="#991b1b" />
          <circle cx="16" cy="40" r="5.5" fill="#e11d48" />
          <circle cx="34" cy="50" r="8.5" fill="#7f1d1d" />
          <circle cx="20" cy="64" r="6.5" fill="#b91c1c" />
          <circle cx="36" cy="76" r="5.5" fill="#991b1b" />
          <circle cx="48" cy="84" r="4.5" fill="#f43f5e" />
        </g>

        {/* W Left Stroke Deep Maroon */}
        <path d="M42,12 L65,76 C67,81 73,81 76,76 L92,30 C94,25 99,25 102,30 L118,76 C121,81 127,81 129,76 L145,12" 
              stroke="url(#wg-maroon-main)" strokeWidth="17" strokeLinecap="round" strokeLinejoin="round" />

        {/* W Front Stroke Vivid Red */}
        <path d="M52,10 L78,84 L100,24 L122,84 L148,10" 
              stroke="url(#wg-red-main)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" filter="url(#shadow-glow)" />
      </svg>

      {/* Brand Text */}
      {variant !== 'compact' && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-center font-sans tracking-tight font-extrabold text-xl md:text-2xl">
            <span className="text-rose-600 dark:text-red-500">WARS</span>
            <span style={{ color: gateTextColor }}>GATE</span>
          </div>
          <span 
            className="font-sans font-bold text-[10px] md:text-[11px] tracking-[0.22em] uppercase mt-0.5"
            style={{ color: automationTextColor }}
          >
            AUTOMATION
          </span>
        </div>
      )}
    </div>
  );
};
