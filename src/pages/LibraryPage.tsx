import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { useNavigation } from '../context/NavigationContext';
import { Plus, Heart, Music, Trash2, Edit2, Play, Sparkles, RotateCcw } from 'lucide-react';
import { getBestImageUrl } from '../utils/formatters';
import { EditPlaylistModal } from '../components/common/EditPlaylistModal';
import { Playlist } from '../types';

export const LibraryPage: React.FC = () => {
  const { 
    customPlaylists, 
    likedSongs, 
    createPlaylist, 
    deletePlaylist,
    twoDayPlayedCount,
    resetTwoDayPlayedHistory
  } = useLibrary();
  const { navigatePlaylist, navigateLikedSongs } = useNavigation();

  const [activeFilter, setActiveFilter] = useState<'all' | 'playlists' | 'liked'>('all');
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);

  const handleCreate = () => {
    const pl = createPlaylist();
    navigatePlaylist(pl.id, true);
  };

  const showLiked = activeFilter === 'all' || activeFilter === 'liked';
  const showPlaylists = activeFilter === 'all' || activeFilter === 'playlists';

  return (
    <div className="p-4 sm:p-8 space-y-6 pb-28 animate-fade-in select-none">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Your Library
          </h1>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                activeFilter === 'all'
                  ? 'bg-white text-black'
                  : 'bg-[#242424] text-white hover:bg-[#2c2c2c]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('playlists')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                activeFilter === 'playlists'
                  ? 'bg-white text-black'
                  : 'bg-[#242424] text-white hover:bg-[#2c2c2c]'
              }`}
            >
              Playlists
            </button>
            <button
              onClick={() => setActiveFilter('liked')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                activeFilter === 'liked'
                  ? 'bg-white text-black'
                  : 'bg-[#242424] text-white hover:bg-[#2c2c2c]'
              }`}
            >
              Liked Songs
            </button>
          </div>
        </div>

        {/* Create playlist action */}
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black font-bold text-sm rounded-full hover:scale-105 active:scale-95 transition shadow-lg w-fit"
        >
          <Plus size={18} strokeWidth={2.5} />
          Create playlist
        </button>
      </div>

      {/* 2-Day Unique Autoplay Tracker Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-[#181818] to-[#181818] border border-emerald-500/25 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1ed760]/10 border border-[#1ed760]/30 flex items-center justify-center text-[#1ed760] flex-shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-white">
                2-Day Unique Autoplay Engine
              </h3>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-[#1ed760] font-mono font-bold">
                {twoDayPlayedCount} {twoDayPlayedCount === 1 ? 'song' : 'songs'} logged
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Every played song is recorded and strictly excluded from Autoplay for 48 hours to guarantee unique songs. Resets automatically after 2 days.
            </p>
          </div>
        </div>

        {twoDayPlayedCount > 0 && (
          <button
            onClick={() => {
              if (confirm('Reset the 2-day played songs registry now? All previously played tracks will become eligible for Autoplay again.')) {
                resetTwoDayPlayedHistory();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 hover:text-white font-semibold transition self-start sm:self-center flex-shrink-0 border border-neutral-700/60"
          >
            <RotateCcw size={13} />
            <span>Reset 2-day history</span>
          </button>
        )}
      </div>

      {/* Grid of collections */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {/* Liked Songs Big Card */}
        {showLiked && (
          <div
            onClick={navigateLikedSongs}
            className="group relative bg-gradient-to-br from-indigo-700 via-purple-700 to-emerald-600 p-4 rounded-lg cursor-pointer transition duration-300 hover:scale-[1.02] shadow-xl flex flex-col justify-between aspect-square"
          >
            <div>
              <span className="text-xs uppercase font-extrabold text-white/80 tracking-wider">
                Collection
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-2 leading-tight">
                Liked Songs
              </h3>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white/90">
                {likedSongs.length} liked {likedSongs.length === 1 ? 'song' : 'songs'}
              </span>
              <div className="w-10 h-10 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition duration-300">
                <Play size={18} fill="black" className="ml-0.5" />
              </div>
            </div>
          </div>
        )}

        {/* Custom Playlists */}
        {showPlaylists &&
          customPlaylists.map((pl) => {
            const coverUrl = getBestImageUrl(pl.image, pl.name);

            return (
              <div
                key={pl.id}
                onClick={() => navigatePlaylist(pl.id, true)}
                className="group relative bg-[#181818] hover:bg-[#282828] p-3.5 rounded-lg transition duration-300 cursor-pointer flex flex-col justify-between shadow-md hover:shadow-xl"
              >
                <div className="relative w-full aspect-square mb-3 overflow-hidden rounded-md bg-neutral-900 shadow">
                  <img
                    src={coverUrl}
                    alt={pl.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Floating Action buttons on hover */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPlaylist(pl);
                      }}
                      className="p-1.5 rounded-full bg-black/70 hover:bg-black text-white hover:scale-105 transition shadow"
                      title="Edit playlist"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete playlist "${pl.name}"?`)) {
                          deletePlaylist(pl.id);
                        }
                      }}
                      className="p-1.5 rounded-full bg-black/70 hover:bg-black text-red-400 hover:text-red-300 hover:scale-105 transition shadow"
                      title="Delete playlist"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-white text-sm line-clamp-1">
                    {pl.name}
                  </h3>
                  <p className="text-xs text-neutral-400 line-clamp-1 mt-1">
                    Playlist • {pl.songs?.length || 0} songs
                  </p>
                </div>
              </div>
            );
          })}
      </div>

      {/* Empty State */}
      {showPlaylists && customPlaylists.length === 0 && !showLiked && (
        <div className="text-center py-20 text-neutral-400">
          <Music size={48} className="mx-auto mb-3 opacity-30 text-[#1ed760]" />
          <h3 className="text-lg font-bold text-white">Create your first playlist</h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            It's easy, we'll help you organize your favorite tracks.
          </p>
          <button
            onClick={handleCreate}
            className="mt-4 px-6 py-2.5 bg-white text-black font-bold text-sm rounded-full hover:scale-105 active:scale-95 transition"
          >
            Create playlist
          </button>
        </div>
      )}

      {/* Edit Details Modal */}
      {editingPlaylist && (
        <EditPlaylistModal
          playlist={editingPlaylist}
          isOpen={!!editingPlaylist}
          onClose={() => setEditingPlaylist(null)}
        />
      )}
    </div>
  );
};

