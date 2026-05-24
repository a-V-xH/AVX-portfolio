import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Cpu, Shield, Fingerprint, Layers
} from 'lucide-react';

interface DeviceMockupProps {
  children: React.ReactNode;
  theme?: 'cyberpunk' | 'neon' | 'glass-dark' | 'glass-light';
  highContrast?: boolean;
  statusText?: string;
  statusIcon?: React.ReactNode;
}

export default function DeviceMockup({
  children,
  theme = 'glass-dark',
  highContrast = false,
  statusText,
  statusIcon,
}: DeviceMockupProps) {
  // Active theme and layout configuration
  const [isMobile, setIsMobile] = useState(false);

  // Automatically detect mobile interface & screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Determine active theme colors for inside content
  const getThemeBg = () => {
    if (highContrast) return 'bg-black text-white';
    if (theme === 'cyberpunk') return 'bg-slate-950 text-pink-50';
    if (theme === 'neon') return 'bg-neutral-950 text-emerald-100';
    if (theme === 'glass-light') return 'bg-white text-slate-800';
    return 'bg-slate-950/95 text-white';
  };

  // Determine rotating gradient colors mapping dynamically
  const getGradientColors = () => {
    if (highContrast) return 'conic-gradient(from 0deg, #333 0%, #fff 50%, #333 100%)';
    if (theme === 'cyberpunk') return 'conic-gradient(from 0deg, #ec4899 0%, #3b82f6 30%, #a855f7 60%, #ec4899 100%)';
    if (theme === 'neon') return 'conic-gradient(from 0deg, #10b981 0%, #06b6d4 40%, #84cc16 75%, #10b981 100%)';
    if (theme === 'glass-light') return 'conic-gradient(from 0deg, #3b82f6 0%, #6366f1 35%, #ec4899 70%, #3b82f6 100%)';
    // default premium futuristic gradient
    return 'conic-gradient(from 0deg, #6366f1 0%, #22d3ee 25%, #d946ef 50%, #ec4899 75%, #6366f1 100%)';
  };

  return (
    <div id="device_mockup_container" className="flex flex-col items-center justify-center w-full min-h-screen p-0 md:p-3 lg:p-4 bg-transparent overflow-hidden">
      
      {/* Centered Card container with Rotating Gradient Border & 3D Tilt Transform */}
      <div
        id="nexus_responsive_chassis"
        className={`relative w-full ease-out flex flex-col items-center justify-center overflow-hidden
          ${isMobile 
            ? 'w-full h-screen min-h-screen rounded-none p-0' 
            : 'w-[98vw] max-w-[1536px] h-[95vh] max-h-[880px] rounded-[24px] p-[3.5px] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.85)] relative'
          }`}
      >
        {/* ROTATING GRADIENT BACKGROUND LAYER - Renders Only on Desktop Forms */}
        {!isMobile && (
          <div 
            className="absolute w-[200%] h-[200%] -top-1/2 -left-1/2 animate-spin-gradient origin-center transition-all duration-500 select-none pointer-events-none"
            style={{
              background: getGradientColors(),
            }}
          />
        )}

        {/* Internal Solid Base Screen that covers center, exposing beautiful border */}
        <div className={`relative flex-1 flex flex-col h-full w-full overflow-hidden select-none ${getThemeBg()} ${
          isMobile ? 'rounded-none border-b border-neutral-950' : 'rounded-[21px]'
        }`}>
          
          {/* MOBILE STATUS BAR - Renders always, feels native */}
          <div id="mobile_status_bar" className={`h-10 px-8 flex items-center justify-between select-none font-sans text-xs w-full relative z-40 bg-transparent flex-shrink-0 ${
            theme === 'glass-light' ? 'text-slate-500' : 'text-neutral-400'
          }`}>
            <div id="local-clock" className={`font-semibold text-xxs tracking-wide ${theme === 'glass-light' ? 'text-slate-800' : 'text-neutral-205'}`}>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            
            {/* Dynamic iOS Notification Pill inside status bar */}
            {statusText && (
              <div
                id="dynamic_island_notification"
                className={`absolute left-1/2 -translate-x-1/2 top-1.5 px-3 py-1 rounded-full border flex items-center gap-1.5 animate-fade-in shadow-md max-w-[190px] w-auto h-7 truncate text-[10px] ${
                  theme === 'glass-light' 
                    ? 'bg-white/95 text-slate-900 border-indigo-200' 
                    : 'bg-black/90 text-white border-neutral-800'
                }`}
              >
                {statusIcon}
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider truncate">
                  {statusText}
                </span>
              </div>
            )}
            
            {/* Empty space placeholder for right top */}
            <div className="w-12 h-3" />
          </div>

          {/* VIEWPORT FOR INTERNAL SCREENS */}
          <div id="device_screen_viewport" className="flex-1 flex flex-col h-full w-full relative overflow-y-auto no-scrollbar pt-2">
            {children}
          </div>

          {/* BOTTOM SCREEN FOOTER BAR */}
          <div className="h-4 flex items-center justify-center pb-2 flex-shrink-0">
            <div className={`w-24 h-1 rounded-full ${theme === 'glass-light' ? 'bg-slate-300' : 'bg-neutral-800/65'}`} />
          </div>

        </div>
      </div>
    </div>
  );
}
