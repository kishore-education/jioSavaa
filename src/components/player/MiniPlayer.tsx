import React from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { useLibrary } from '../../context/LibraryContext';
import { Play, Pause, SkipBack, SkipForward, X, Heart } from 'lucide-react';
import { decodeHtmlEntities, formatDuration, getArtistNames, getBestImageUrl } from '../../utils/formatters';

export const MiniPlayer: React.FC = () => {
  const { 
    currentSong, 
    isPlaying, 
    currentTime, 
    duration, 
    isMiniPlayerOpen, 
    setIsMiniPlayerOpen, 
    togglePlayPause, 
    nextTrack, 
    previousTrack 
  } = usePlayer();
  const { isSongLiked, toggleLikeSong } = useLibrary();

  if (!isMiniPlayerOpen || !currentSong) return null;

  const title = decodeHtmlEntities(currentSong.name || currentSong.title || 'Unknown');
  const artists = getArtistNames(currentSong);
  const imageUrl = getBestImageUrl(currentSong.image, title);
  const liked = isSongLiked(currentSong.id);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-24 right-6 z-50 w-72 bg-[#181818] border border-neutral-700 rounded-xl shadow-2xl overflow-hidden animate-slide-up select-none">
      {/* Top Bar with Close button */}
      <div className="flex items-center justify-between px-3 py-2 bg-black/40 border-b border-neutral-800 text-xs font-semibold text-neutral-400">
        <span>Mini Player</span>
        <button
          onClick={() => setIsMiniPlayerOpen(false)}
          className="text-neutral-400 hover:text-white transition p-1 rounded-full hover:bg-neutral-800"
        >
          <X size={14} />
        </button>
      </div>

      {/* Album Artwork */}
      <div className="relative aspect-square w-full bg-neutral-900 overflow-hidden group">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Progress bar line at bottom of artwork */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
          <div 
            className="h-full bg-[#1ed760] transition-all" 
            style={{ width: `${progressPercent}%` }} 
          />
        </div>
      </div>

      {/* Info & Controls */}
      <div className="p-3 bg-[#181818]">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-white truncate" title={title}>
              {title}
            </h4>
            <p className="text-xs text-neutral-400 truncate" title={artists}>
              {artists}
            </p>
          </div>
          <button
            onClick={() => toggleLikeSong(currentSong)}
            className={`p-1.5 transition flex-shrink-0 ${
              liked ? 'text-[#1ed760]' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Heart size={16} fill={liked ? '#1ed760' : 'transparent'} />
          </button>
        </div>

        {/* Progress time indicators */}
        <div className="flex justify-between text-[10px] text-neutral-400 font-mono mb-2">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>

        {/* Player Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={previousTrack}
            className="text-neutral-400 hover:text-white transition"
          >
            <SkipBack size={18} fill="currentColor" />
          </button>

          <button
            onClick={togglePlayPause}
            className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition"
          >
            {isPlaying ? (
              <Pause size={16} fill="black" />
            ) : (
              <Play size={16} fill="black" className="ml-0.5" />
            )}
          </button>

          <button
            onClick={nextTrack}
            className="text-neutral-400 hover:text-white transition"
          >
            <SkipForward size={20} fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
};

