import React from 'react';

interface OfficialLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'mark' | 'full';
  showBadge?: boolean;
}

export const OfficialLogo: React.FC<OfficialLogoProps> = ({
  size = 'md',
  className = '',
  variant = 'mark',
  showBadge = false,
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-xl',
    xl: 'w-20 h-20 text-3xl',
  };

  const svgDimensions = {
    sm: { width: 28, height: 28 },
    md: { width: 40, height: 40 },
    lg: { width: 56, height: 56 },
    xl: { width: 80, height: 80 },
  };

  const { width, height } = svgDimensions[size];

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Official 5S Logo SVG (Strictly rendered from the official Five Seasons brand asset) */}
      <div
        id="official-5s-logo-mark"
        className={`relative flex items-center justify-center rounded-2xl bg-white flex-shrink-0 shadow-[0_4px_20px_rgba(67,85,250,0.35)] overflow-hidden p-1 ${sizeClasses[size]}`}
        style={{
          aspectRatio: '1/1',
        }}
      >
        <svg
          viewBox="0 0 500 500"
          width={width}
          height={height}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full select-none"
        >
          {/* Official Royal/Cobalt Blue 5S Typography */}
          <text
            x="50%"
            y="54%"
            dominantBaseline="central"
            textAnchor="middle"
            fill="#4355fa"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
            fontWeight="900"
            fontSize="310"
            letterSpacing="-12"
          >
            5S
          </text>
        </svg>
      </div>

      {variant === 'full' && (
        <div className="flex flex-col select-none">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-lg md:text-xl tracking-wider text-white uppercase brand-glow">
              FIVE SEASONS
            </span>
            {showBadge && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#4355fa]/20 border border-[#4355fa]/40 text-[#4355fa] text-[9px] font-mono font-bold">
                8K
              </span>
            )}
          </div>
          <span className="text-[10px] text-[#4355fa] font-mono tracking-widest uppercase font-semibold">
            15s Clips • 5 Seasons
          </span>
        </div>
      )}
    </div>
  );
};
