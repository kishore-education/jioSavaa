import React from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { Home, Search, Library, Heart } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { currentPage, navigateHome, navigateSearch, navigateLibrary, navigateLikedSongs, openLogoFullscreen } = useNavigation();

  const isHome = currentPage.type === 'home';
  const isSearch = currentPage.type === 'search';
  const isLibrary = currentPage.type === 'library';
  const isLiked = currentPage.type === 'liked-songs';

  return (
    <nav className="md:hidden flex items-center justify-around h-14 bg-black/95 backdrop-blur border-t border-neutral-800 text-neutral-400 select-none z-30">
      <button
        onClick={navigateHome}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
          isHome ? 'text-white' : 'hover:text-white'
        }`}
      >
        <Home size={20} />
        <span className="text-[10px] mt-1 font-medium">Home</span>
      </button>

      <button
        onClick={() => navigateSearch()}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
          isSearch ? 'text-white' : 'hover:text-white'
        }`}
      >
        <Search size={20} />
        <span className="text-[10px] mt-1 font-medium">Search</span>
      </button>

      <button
        onClick={navigateLibrary}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
          isLibrary ? 'text-white' : 'hover:text-white'
        }`}
      >
        <Library size={20} />
        <span className="text-[10px] mt-1 font-medium">Your Library</span>
      </button>

      <button
        onClick={navigateLikedSongs}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
          isLiked ? 'text-[#1ed760]' : 'hover:text-white'
        }`}
      >
        <Heart size={20} />
        <span className="text-[10px] mt-1 font-medium">Liked</span>
      </button>

      <button
        onClick={openLogoFullscreen}
        className="flex flex-col items-center justify-center flex-1 py-1 transition hover:text-white group"
        title="Madhu Leka Logo"
      >
        <div className="relative">
          <img 
            src="/madhu-leka-logo.jpg" 
            alt="Madhu Leka Logo" 
            className="w-5 h-5 rounded-full object-cover object-[48%_28%] border border-[#1ed760] group-hover:scale-110 transition-transform"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-[#1ed760] rounded-full" />
        </div>
        <span className="text-[10px] mt-1 font-medium group-hover:text-[#1ed760] transition-colors">Logo</span>
      </button>
    </nav>
  );
};

