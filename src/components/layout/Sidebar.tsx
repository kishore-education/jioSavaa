import React from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { useLibrary } from '../../context/LibraryContext';
import { 
  Home, 
  Search, 
  Library, 
  Plus, 
  Heart, 
  Music, 
  Trash2,
  FolderHeart,
  Globe
} from 'lucide-react';
import { getBestImageUrl } from '../../utils/formatters';

export const Sidebar: React.FC = () => {
  const { 
    currentPage, 
    navigateHome, 
    navigateSearch, 
    navigateLibrary, 
    navigateLikedSongs, 
    navigatePlaylist,
    openLogoFullscreen 
  } = useNavigation();

  const { customPlaylists, createPlaylist, deletePlaylist, likedSongs, openLanguageModal } = useLibrary();

  const isHome = currentPage.type === 'home';
  const isSearch = currentPage.type === 'search';
  const isLibrary = currentPage.type === 'library';
  const isLiked = currentPage.type === 'liked-songs';

  const handleCreatePlaylist = () => {
    const pl = createPlaylist();
    navigatePlaylist(pl.id, true);
  };

  return (
    <aside className="w-64 bg-black p-2 flex flex-col gap-2 flex-shrink-0 select-none hidden md:flex h-full">
      {/* Upper Navigation Card */}
      <div className="bg-[#121212] rounded-lg p-4 space-y-4">
        {/* Madhu Leka Music Brand Logo */}
        <div 
          onClick={openLogoFullscreen}
          className="flex items-center gap-3 cursor-pointer text-white px-1 mb-2 group"
          title="Click to view full screen logo"
        >
          <div className="relative flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
            <img 
              src="/madhu-leka-logo.jpg" 
              alt="Madhu Leka Music" 
              className="w-10 h-10 rounded-full object-cover object-[48%_28%] border-2 border-[#1ed760] shadow-md shadow-[#1ed760]/30"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#1ed760] border-2 border-[#121212] rounded-full flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-extrabold text-[16px] tracking-tight text-white group-hover:text-[#1ed760] transition-colors leading-tight truncate">
              Madhu Leka
            </span>
            <span className="text-[11px] font-bold tracking-wider uppercase text-[#1ed760] group-hover:text-white transition-colors">
              Music
            </span>
          </div>
        </div>

        {/* Links */}
        <nav className="space-y-1">
          <button
            onClick={navigateHome}
            className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-md font-semibold text-sm transition ${
              isHome ? 'text-white bg-white/10' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Home size={22} />
            <span>Home</span>
          </button>

          <button
            onClick={() => navigateSearch()}
            className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-md font-semibold text-sm transition ${
              isSearch ? 'text-white bg-white/10' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Search size={22} />
            <span>Search</span>
          </button>

          <button
            onClick={openLanguageModal}
            className="w-full flex items-center gap-4 px-3 py-2.5 rounded-md font-semibold text-sm transition text-neutral-400 hover:text-white"
          >
            <Globe size={22} />
            <span>Languages</span>
          </button>
        </nav>
      </div>

      {/* Lower Library Card */}
      <div className="bg-[#121212] rounded-lg p-3 flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Library Header */}
        <div className="flex items-center justify-between px-3 py-2 mb-2">
          <button
            onClick={navigateLibrary}
            className={`flex items-center gap-3 font-bold text-sm transition ${
              isLibrary ? 'text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Library size={22} />
            <span>Your Library</span>
          </button>

          <button
            onClick={handleCreatePlaylist}
            className="p-1 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition"
            title="Create playlist"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Scrollable Library List */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {/* Liked Songs Special Item */}
          <div
            onClick={navigateLikedSongs}
            className={`group flex items-center gap-3 p-2 rounded-md cursor-pointer transition ${
              isLiked ? 'bg-white/10' : 'hover:bg-white/5'
            }`}
          >
            <div className="w-12 h-12 rounded bg-gradient-to-br from-indigo-700 via-purple-600 to-emerald-400 flex items-center justify-center text-white flex-shrink-0 shadow">
              <Heart size={20} fill="white" />
            </div>
            <div className="overflow-hidden min-w-0">
              <p className={`text-sm font-semibold truncate ${isLiked ? 'text-[#1ed760]' : 'text-white'}`}>
                Liked Songs
              </p>
              <p className="text-xs text-neutral-400 truncate">
                Playlist • {likedSongs.length} songs
              </p>
            </div>
          </div>

          {/* User Custom Playlists */}
          {customPlaylists.map((pl) => {
            const isSelected = currentPage.type === 'playlist' && currentPage.id === pl.id;
            const coverUrl = getBestImageUrl(pl.image, pl.name);

            return (
              <div
                key={pl.id}
                onClick={() => navigatePlaylist(pl.id, true)}
                className={`group flex items-center justify-between p-2 rounded-md cursor-pointer transition ${
                  isSelected ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden min-w-0">
                  <img
                    src={coverUrl}
                    alt={pl.name}
                    className="w-12 h-12 rounded object-cover flex-shrink-0 bg-neutral-900"
                  />
                  <div className="overflow-hidden min-w-0">
                    <p className={`text-sm font-semibold truncate ${isSelected ? 'text-[#1ed760]' : 'text-white'}`}>
                      {pl.name}
                    </p>
                    <p className="text-xs text-neutral-400 truncate">
                      Playlist • {pl.songs?.length || 0} songs
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete playlist "${pl.name}"?`)) {
                      deletePlaylist(pl.id);
                    }
                  }}
                  className="p-1.5 text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition rounded"
                  title="Delete playlist"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

