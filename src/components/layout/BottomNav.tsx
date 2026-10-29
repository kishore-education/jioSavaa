import React from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { Home, Search, Library, Heart } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { currentPage, navigateHome, navigateSearch, navigateLibrary, navigateLikedSongs } = useNavigation();

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
    </nav>
  );
};

