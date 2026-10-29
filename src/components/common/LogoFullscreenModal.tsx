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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/92 backdrop-blur-2xl animate-in fade-in duration-200 select-none"
      onClick={closeLogoFullscreen}
    >
      {/* Top Right Floating Close Button */}
      <button
        onClick={closeLogoFullscreen}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2.5 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-all hover:scale-105 active:scale-95 border border-white/10 shadow-xl z-20"
        title="Close (Esc)"
        aria-label="Close"
      >
        <X size={22} />
      </button>

      {/* Main Showcase Card */}
      <div 
        className="relative max-w-4xl max-h-[92vh] w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#181818]/90 to-[#121212]/95 border border-white/10 p-4 sm:p-6 rounded-3xl shadow-2xl shadow-[#1ed760]/15 ring-1 ring-[#1ed760]/30 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Badge */}
        <div className="flex items-center justify-between w-full mb-3 px-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#1ed760] flex items-center justify-center text-black font-bold shadow-md shadow-[#1ed760]/30">
              <Music2 size={16} className="stroke-[2.5]" />
            </div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Madhu Leka Music
              </h2>
              <CheckCircle2 size={18} className="text-[#1ed760] fill-[#1ed760]/20" />
            </div>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1ed760]/15 text-[#1ed760] border border-[#1ed760]/30 text-xs font-semibold">
            <Sparkles size={13} />
            Official Identity
          </span>
        </div>

        {/* The Full High-Resolution Logo / Photo */}
        <div className="relative group w-full flex items-center justify-center overflow-hidden rounded-2xl bg-black/40 border border-white/5">
          <img 
            src="/madhu-leka-logo.jpg" 
            alt="Madhu Leka Music Official Logo" 
            className="max-h-[70vh] sm:max-h-[72vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl transition-transform duration-300 group-hover:scale-[1.01]"
          />
        </div>

        {/* Footer Hint */}
        <div className="mt-3 text-center flex items-center justify-between w-full px-2 text-neutral-400 text-xs">
          <span className="text-neutral-400 font-medium">
            Acoustic Serenade • Official Portrait
          </span>
          <span className="text-neutral-400 hidden sm:inline">
            Click anywhere or press <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-neutral-300 border border-neutral-700 text-[10px]">ESC</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
};

