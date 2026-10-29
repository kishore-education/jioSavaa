import React, { useEffect } from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { X, Sparkles, Music2, CheckCircle2 } from 'lucide-react';

export const LogoFullscreenModal: React.FC = () => {
  const { isLogoFullscreen, closeLogoFullscreen } = useNavigation();

  // Close on Escape key
  useEffect(() => {
    if (!isLogoFullscreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLogoFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLogoFullscreen, closeLogoFullscreen]);

  if (!isLogoFullscreen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-200 select-none overflow-y-auto"
      onClick={closeLogoFullscreen}
    >
      {/* Top Floating Close Button - Thumb Friendly on Mobile */}
      <button
        onClick={closeLogoFullscreen}
        className="fixed top-3 right-3 sm:top-6 sm:right-6 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-all active:scale-90 border border-white/10 shadow-2xl z-30 flex items-center justify-center cursor-pointer"
        title="Close (Esc)"
        aria-label="Close"
      >
        <X size={20} className="sm:w-6 sm:h-6" />
      </button>

      {/* Main Showcase Card */}
      <div 
        className="relative max-w-4xl max-h-[94vh] w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#181818]/95 to-[#121212]/98 border border-white/10 p-3 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl shadow-[#1ed760]/20 ring-1 ring-[#1ed760]/30 animate-in zoom-in-95 duration-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Badge */}
        <div className="flex items-center justify-between w-full mb-2 sm:mb-3 px-1 sm:px-2 pr-9 sm:pr-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#1ed760] flex items-center justify-center text-black font-bold shadow-md shadow-[#1ed760]/30 flex-shrink-0">
              <Music2 size={14} className="sm:w-4 sm:h-4 stroke-[2.5]" />
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <h2 className="text-base sm:text-xl font-extrabold text-white tracking-tight truncate">
                Madhu Leka Music
              </h2>
              <CheckCircle2 size={16} className="text-[#1ed760] fill-[#1ed760]/20 flex-shrink-0 sm:w-4 sm:h-4" />
            </div>
          </div>

          <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[#1ed760]/15 text-[#1ed760] border border-[#1ed760]/30 text-[10px] sm:text-xs font-semibold flex-shrink-0">
            <Sparkles size={11} className="sm:w-3 sm:h-3" />
            <span>Official Logo</span>
          </span>
        </div>

        {/* The Full High-Resolution Logo / Photo */}
        <div 
          onClick={closeLogoFullscreen}
          className="relative group w-full flex items-center justify-center overflow-hidden rounded-xl sm:rounded-2xl bg-black/50 border border-white/5 cursor-pointer"
          title="Click to dismiss"
        >
          <img 
            src="/madhu-leka-logo.jpg" 
            alt="Madhu Leka Music Official Logo" 
            className="max-h-[65vh] sm:max-h-[72vh] w-auto max-w-full rounded-xl sm:rounded-2xl object-contain shadow-2xl transition-transform duration-300"
          />
        </div>

        {/* Footer Hint */}
        <div className="mt-2.5 sm:mt-3 text-center flex items-center justify-between w-full px-1 sm:px-2 text-neutral-400 text-[11px] sm:text-xs">
          <span className="text-neutral-400 font-medium truncate">
            Acoustic Serenade • Official Portrait
          </span>
          <span className="text-neutral-400 flex items-center gap-1 flex-shrink-0 ml-2">
            <span className="sm:hidden">Tap anywhere to close</span>
            <span className="hidden sm:inline">Press <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-neutral-300 border border-neutral-700 text-[10px]">ESC</kbd> to close</span>
          </span>
        </div>
      </div>
    </div>
  );
};
