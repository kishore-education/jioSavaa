import React from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { useLibrary } from '../../context/LibraryContext';
import { ChevronLeft, ChevronRight, Search, User, X, Globe } from 'lucide-react';

interface TopNavProps {
  scrolled: boolean;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  accentRgb?: string;
}

export const TopNav: React.FC<TopNavProps> = ({
  scrolled,
  searchQuery = '',
  onSearchChange,
  accentRgb,
}) => {
  const { currentPage, canGoBack, canGoForward, goBack, goForward, navigateSearch, navigateHome, openLogoFullscreen } = useNavigation();
  const { openLanguageModal, languagePreferences } = useLibrary();

  const isSearchPage = currentPage.type === 'search';

  return (
    <header 
      className={`sticky top-0 z-30 h-16 px-4 sm:px-8 flex items-center justify-between transition-colors duration-300 ${
        scrolled 
          ? 'bg-[#121212]/95 backdrop-blur-md border-b border-white/5' 
          : 'bg-transparent'
      }`}
      style={{
        backgroundColor: scrolled 
          ? '#121212' 
          : accentRgb 
          ? `rgba(${accentRgb}, 0.35)` 
          : 'transparent'
      }}
    >
      {/* Left: Back / Forward Buttons & Search Bar */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <button
            onClick={goBack}
            disabled={!canGoBack}
            className={`w-8 h-8 rounded-full bg-black/60 flex items-center justify-center transition ${
              canGoBack ? 'text-white hover:bg-black/90 cursor-pointer' : 'text-neutral-500 cursor-not-allowed opacity-50'
            }`}
            title="Go back"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            onClick={goForward}
            disabled={!canGoForward}
            className={`w-8 h-8 rounded-full bg-black/60 flex items-center justify-center transition hidden sm:flex ${
              canGoForward ? 'text-white hover:bg-black/90 cursor-pointer' : 'text-neutral-500 cursor-not-allowed opacity-50'
            }`}
            title="Go forward"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Mobile Brand Logo */}
        {!isSearchPage && (
          <div 
            onClick={openLogoFullscreen}
            className="flex md:hidden items-center gap-2 cursor-pointer select-none group flex-shrink-0"
            title="Click to view full screen logo"
          >
            <div className="relative">
              <img 
                src="/madhu-leka-logo.jpg" 
                alt="Madhu Leka" 
                className="w-8 h-8 rounded-full object-cover object-[48%_28%] border-2 border-[#1ed760] shadow-sm group-hover:scale-105 transition-transform"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#1ed760] border border-black rounded-full" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-sm tracking-tight text-white group-hover:text-[#1ed760] transition-colors leading-tight truncate">
                Madhu Leka
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1ed760] leading-none">
                Music
              </span>
            </div>
          </div>
        )}

        {/* Global/Search Page Search Bar */}
        {isSearchPage && onSearchChange && (
          <div className="relative max-w-md w-full ml-1 sm:ml-2">
            <Search 
              size={18} 
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" 
            />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="What do you want to play?"
              className="w-full bg-[#242424] text-white text-sm rounded-full pl-10 pr-9 py-2 focus:outline-none focus:ring-2 focus:ring-white border border-transparent hover:border-neutral-700 transition placeholder:text-neutral-400"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Language Preferences Button */}
        <button
          onClick={openLanguageModal}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-200 hover:text-white transition text-xs font-semibold border border-white/5"
          title="Change music languages"
        >
          <Globe size={14} className="text-[#1ed760]" />
          <span className="hidden sm:inline">Languages</span>
          {languagePreferences.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#1ed760] text-black font-bold text-[10px]">
              {languagePreferences.length}
            </span>
          )}
        </button>

        {!isSearchPage && (
          <button
            onClick={() => navigateSearch()}
            className="md:hidden p-2 rounded-full bg-black/40 text-neutral-300 hover:text-white hover:bg-black/80 transition"
            title="Search"
          >
            <Search size={18} />
          </button>
        )}

        {/* Desktop Profile Pill */}
        <div 
          onClick={openLogoFullscreen}
          className="hidden md:flex items-center gap-2 bg-black/60 hover:bg-black/90 p-1 pr-3 rounded-full cursor-pointer transition select-none border border-white/5 hover:border-[#1ed760]/40 group"
          title="Click to view full screen logo"
        >
          <img 
            src="/madhu-leka-logo.jpg" 
            alt="Madhu Leka" 
            className="w-7 h-7 rounded-full object-cover object-[48%_28%] border border-[#1ed760] group-hover:scale-105 transition-transform"
          />
          <span className="text-xs font-bold text-white group-hover:text-[#1ed760] transition-colors">Madhu Leka</span>
        </div>
      </div>
    </header>
  );
};
