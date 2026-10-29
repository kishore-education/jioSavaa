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
  const { currentPage, canGoBack, canGoForward, goBack, goForward, navigateSearch, navigateHome } = useNavigation();
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
            onClick={navigateHome}
            className="flex md:hidden items-center gap-2 cursor-pointer select-none group flex-shrink-0"
            title="Spotify"
          >
            <div className="w-7 h-7 rounded-full bg-[#1ed760] flex items-center justify-center text-black shadow-sm group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-black">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.308a.747.747 0 01-1.028.248c-2.813-1.718-6.353-2.107-10.525-1.155a.75.75 0 01-.334-1.462c4.568-1.042 8.489-.597 11.639 1.341a.75.75 0 01.248 1.028zm1.469-3.267a.936.936 0 01-1.286.309c-3.22-1.979-8.127-2.551-11.936-1.394a.938.938 0 11-.548-1.794c4.354-1.321 9.771-.684 13.461 1.583a.938.938 0 01.309 1.296zm.126-3.411C15.241 8.358 8.87 8.14 5.166 9.266a1.125 1.125 0 11-.65-2.155c4.256-1.292 11.298-1.041 15.688 1.564a1.125 1.125 0 11-1.106 1.956z"/>
              </svg>
            </div>
            <span className="font-extrabold text-base tracking-tight text-white group-hover:text-[#1ed760] transition-colors">
              Spotify
            </span>
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
          className="hidden md:flex items-center gap-2 bg-black/60 hover:bg-black/90 p-1 pr-3 rounded-full cursor-pointer transition select-none border border-white/5 hover:border-white/20 group"
        >
          <div className="w-7 h-7 rounded-full bg-[#282828] flex items-center justify-center text-white font-bold text-xs">
            <User size={15} />
          </div>
          <span className="text-xs font-bold text-white group-hover:text-white transition-colors">Spotify User</span>
        </div>
      </div>
    </header>
  );
};
