import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { useNavigation } from '../context/NavigationContext';
import { SongRow } from '../components/common/SongRow';
import { formatTotalDuration } from '../utils/formatters';
import { deduplicateSongs } from '../utils/sanitizer';
import { Play, Pause, Shuffle, Heart, Clock, Search } from 'lucide-react';
import { Song } from '../types';

interface LikedSongsPageProps {
  onOpenAddToPlaylist: (song: Song) => void;
}

export const LikedSongsPage: React.FC<LikedSongsPageProps> = ({ onOpenAddToPlaylist }) => {
  const { likedSongs: rawLikedSongs } = useLibrary();
  const likedSongs = deduplicateSongs(rawLikedSongs);
  const { currentSong, isPlaying, playSong, togglePlayPause, toggleShuffle } = usePlayer();
  const { navigateSearch } = useNavigation();

  const [filterText, setFilterText] = useState('');

  const filteredSongs = likedSongs.filter((song) => {
    if (!filterText.trim()) return true;
    const q = filterText.toLowerCase();
    const titleMatch = (song.name || song.title || '').toLowerCase().includes(q);
    const artistMatch = typeof song.primaryArtists === 'string' 
      ? song.primaryArtists.toLowerCase().includes(q) 
      : false;
    return titleMatch || artistMatch;
  });

  const isLikedActive = likedSongs.some((s) => s.id === currentSong?.id);
  const isLikedPlaying = isLikedActive && isPlaying;
  const totalDurationStr = formatTotalDuration(likedSongs);

  const handlePlayAll = () => {
    if (likedSongs.length === 0) return;
    if (isLikedActive) {
      togglePlayPause();
    } else {
      playSong(likedSongs[0], likedSongs);
    }
  };

  const handleShufflePlay = () => {
    if (likedSongs.length === 0) return;
    const randomIdx = Math.floor(Math.random() * likedSongs.length);
    playSong(likedSongs[randomIdx], likedSongs);
    toggleShuffle();
  };

  return (
    <div className="animate-fade-in pb-32 select-none">
      {/* Iconic Spotify Liked Songs Hero Header (Violet/Indigo gradient) */}
      <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-end gap-6 bg-gradient-to-b from-[#5038a0] via-[#35256e] 60% to-[#121212]">
        {/* Cover Art */}
        <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-md shadow-2xl flex-shrink-0 bg-gradient-to-br from-[#450af5] to-[#8e8ee5] flex items-center justify-center text-white">
          <Heart size={84} fill="white" />
        </div>

        {/* Hero Meta Info */}
        <div className="flex flex-col justify-end text-center sm:text-left min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-white/90">
            Playlist
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black text-white my-2 tracking-tight">
            Liked Songs
          </h1>
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm font-semibold text-white/90 mt-2">
            <span>Spotify User</span>
            <span>•</span>
            <span>{likedSongs.length} songs</span>
            {likedSongs.length > 0 && (
              <>
                <span>•</span>
                <span className="text-white/70">{totalDurationStr}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar & Filter Input */}
      <div className="px-6 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <button
            onClick={handlePlayAll}
            disabled={likedSongs.length === 0}
            className="w-14 h-14 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title={isLikedPlaying ? 'Pause' : 'Play'}
          >
            {isLikedPlaying ? (
              <Pause size={26} fill="black" />
            ) : (
              <Play size={26} fill="black" className="ml-1" />
            )}
          </button>

          <button
            onClick={handleShufflePlay}
            disabled={likedSongs.length === 0}
            className="text-neutral-400 hover:text-white transition disabled:opacity-50"
            title="Shuffle Play"
          >
            <Shuffle size={24} />
          </button>
        </div>

        {/* Search within liked songs */}
        {likedSongs.length > 0 && (
          <div className="relative max-w-xs w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search in Liked Songs"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full bg-[#242424] text-white text-xs rounded-full pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-white border border-transparent placeholder:text-neutral-400"
            />
          </div>
        )}
      </div>

      {/* Tracklist Table */}
      <div className="px-4 sm:px-8">
        {filteredSongs.length > 0 ? (
          <div>
            <div className="grid grid-cols-12 items-center gap-4 px-4 py-2 border-b border-white/10 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              <span className="col-span-1">#</span>
              <span className="col-span-6 sm:col-span-5">Title</span>
              <span className="hidden sm:block col-span-3">Album</span>
              <div className="col-span-5 sm:col-span-3 flex justify-end items-center pr-4">
                <Clock size={16} />
              </div>
            </div>

            <div className="space-y-1">
              {filteredSongs.map((song, index) => (
                <SongRow
                  key={song.id}
                  song={song}
                  index={index}
                  contextQueue={filteredSongs}
                  onOpenAddToPlaylist={onOpenAddToPlaylist}
                />
              ))}
            </div>
          </div>
        ) : likedSongs.length > 0 ? (
          <div className="text-center py-16 text-neutral-400">
            <Search size={36} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold text-white">No matches found for "{filterText}"</p>
          </div>
        ) : (
          <div className="text-center py-20 text-neutral-400 border border-dashed border-neutral-800 rounded-xl my-6">
            <Heart size={44} className="mx-auto mb-3 opacity-30 text-[#1ed760]" />
            <h3 className="text-lg font-bold text-white">Songs you like will appear here</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              Save songs by tapping the heart icon while exploring or listening.
            </p>
            <button
              onClick={() => navigateSearch()}
              className="mt-4 px-6 py-2.5 bg-white text-black font-bold text-sm rounded-full hover:scale-105 active:scale-95 transition"
            >
              Find songs to like
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

