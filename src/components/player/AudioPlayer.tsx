import React, { useRef, useState } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { useLibrary } from '../../context/LibraryContext';
import { useNavigation } from '../../context/NavigationContext';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Repeat1, 
  Volume2, 
  Volume1, 
  VolumeX, 
  Heart, 
  Maximize2, 
  ListMusic, 
  Loader2 
} from 'lucide-react';
import { decodeHtmlEntities, formatDuration, getArtistNames, getBestImageUrl } from '../../utils/formatters';

export const AudioPlayer: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffled,
    isLoadingSong,
    togglePlayPause,
    nextTrack,
    previousTrack,
    seekTo,
    setAudioVolume,
    toggleMute,
    toggleRepeat,
    toggleShuffle,
    toggleMiniPlayer,
    toggleQueue,
    isQueueOpen,
  } = usePlayer();

  const { isSongLiked, toggleLikeSong } = useLibrary();
  const { navigateAlbum, navigateArtist } = useNavigation();

  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);

  if (!currentSong) {
    return null;
  }

  const liked = isSongLiked(currentSong.id);
  const imageUrl = getBestImageUrl(currentSong.image, currentSong.name);
  const title = decodeHtmlEntities(currentSong.name || currentSong.title || 'Unknown Track');
  const artists = getArtistNames(currentSong);

  // Calculate percentage
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Handle clicking or dragging progress bar
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    seekTo(ratio * duration);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAudioVolume(parseFloat(e.target.value));
  };

  return (
    <footer className="h-16 md:h-20 sm:md:h-[88px] bg-[#181818] border-t border-[#282828] px-3 sm:px-4 flex items-center justify-between text-white z-40 select-none relative">
      {/* MOBILE PROGRESS BAR (Slim top scrubber on mobile screens) */}
      <div 
        ref={progressBarRef}
        onClick={handleProgressClick}
        className="md:hidden absolute top-0 left-0 right-0 h-1 bg-[#282828] cursor-pointer group"
      >
        <div 
          className="h-full bg-[#1ed760] transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* LEFT: Currently Playing Track Info */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-1 md:flex-initial md:w-1/4 md:min-w-[180px] md:max-w-[320px] min-w-0 mr-2">
        <div className="relative group w-11 h-11 sm:w-14 sm:h-14 rounded overflow-hidden flex-shrink-0 bg-neutral-900 shadow">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
          {isLoadingSong && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Loader2 className="animate-spin text-[#1ed760]" size={18} />
            </div>
          )}
        </div>

        <div className="overflow-hidden min-w-0 pr-1 flex-1">
          <p 
            onClick={() => {
              if (typeof currentSong.album === 'object' && currentSong.album?.id) {
                navigateAlbum(currentSong.album.id);
              }
            }}
            className="text-xs sm:text-sm font-semibold text-white truncate hover:underline cursor-pointer"
            title={title}
          >
            {title}
          </p>
          <p 
            onClick={() => {
              const primary = currentSong.artists?.primary?.[0];
              if (primary?.id) navigateArtist(primary.id);
            }}
            className="text-[10px] sm:text-xs text-neutral-400 truncate hover:text-white hover:underline cursor-pointer transition"
            title={artists}
          >
            {artists}
          </p>
        </div>

        <button
          onClick={() => toggleLikeSong(currentSong)}
          className={`p-1.5 transition flex-shrink-0 ${
            liked ? 'text-[#1ed760]' : 'text-neutral-400 hover:text-white'
          }`}
          title={liked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
        >
          <Heart size={18} fill={liked ? '#1ed760' : 'transparent'} />
        </button>
      </div>

      {/* MOBILE CONTROLS (Rendered compactly on small screens) */}
      <div className="flex md:hidden items-center gap-2 flex-shrink-0">
        <button
          onClick={previousTrack}
          className="text-neutral-400 hover:text-white transition active:scale-95 p-1"
          title="Previous track"
        >
          <SkipBack size={18} fill="currentColor" />
        </button>

        <button
          onClick={togglePlayPause}
          className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-md"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isLoadingSong ? (
            <Loader2 className="animate-spin text-black" size={16} />
          ) : isPlaying ? (
            <Pause size={16} fill="black" />
          ) : (
            <Play size={16} fill="black" className="ml-0.5" />
          )}
        </button>

        <button
          onClick={nextTrack}
          className="text-neutral-400 hover:text-white transition active:scale-95 p-1"
          title="Next track"
        >
          <SkipForward size={18} fill="currentColor" />
        </button>
      </div>

      {/* DESKTOP CENTER: Playback Controls & Dynamic Seekbar */}
      <div className="hidden md:flex flex-col items-center max-w-[722px] w-2/4 px-2">
        {/* Buttons Row */}
        <div className="flex items-center gap-4 sm:gap-6 mb-1.5">
          {/* Shuffle */}
          <button
            onClick={toggleShuffle}
            className={`transition relative ${
              isShuffled ? 'text-[#1ed760]' : 'text-neutral-400 hover:text-white'
            }`}
            title={isShuffled ? 'Disable Shuffle' : 'Enable Shuffle'}
          >
            <Shuffle size={18} />
            {isShuffled && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1ed760] rounded-full" />
            )}
          </button>

          {/* Previous Track */}
          <button
            onClick={previousTrack}
            className="text-neutral-400 hover:text-white transition active:scale-95"
            title="Previous track"
          >
            <SkipBack size={20} fill="currentColor" />
          </button>

          {/* Play / Pause Primary Button */}
          <button
            onClick={togglePlayPause}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-md"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoadingSong ? (
              <Loader2 className="animate-spin text-black" size={18} />
            ) : isPlaying ? (
              <Pause size={18} fill="black" />
            ) : (
              <Play size={18} fill="black" className="ml-0.5" />
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={nextTrack}
            className="text-neutral-400 hover:text-white transition active:scale-95"
            title="Next track"
          >
            <SkipForward size={20} fill="currentColor" />
          </button>

          {/* Repeat */}
          <button
            onClick={toggleRepeat}
            className={`transition relative ${
              repeatMode !== 'off' ? 'text-[#1ed760]' : 'text-neutral-400 hover:text-white'
            }`}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
            {repeatMode !== 'off' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1ed760] rounded-full" />
            )}
          </button>
        </div>

        {/* Progress Timeline Scrubber */}
        <div className="w-full flex items-center gap-2 text-xs font-mono text-neutral-400">
          <span className="w-9 text-right">{formatDuration(currentTime)}</span>

          <div
            onClick={handleProgressClick}
            onMouseEnter={() => setIsHoveringProgress(true)}
            onMouseLeave={() => setIsHoveringProgress(false)}
            className="group flex-1 h-3 flex items-center cursor-pointer relative"
          >
            {/* Background track */}
            <div className="w-full h-1 bg-[#4d4d4d] rounded-full overflow-hidden relative">
              {/* Active fill */}
              <div
                className={`h-full transition-colors rounded-full ${
                  isHoveringProgress ? 'bg-[#1ed760]' : 'bg-white'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Draggable handle knob */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 -ml-1.5 w-3 h-3 bg-white rounded-full shadow-md transition-opacity duration-150 pointer-events-none ${
                isHoveringProgress ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ left: `${progressPercent}%` }}
            />
          </div>

          <span className="w-9 text-left">{formatDuration(duration)}</span>
        </div>
      </div>

      {/* RIGHT: Volume, Queue, MiniPlayer */}
      <div className="hidden md:flex items-center justify-end gap-3 w-1/4 min-w-[180px]">
        {/* Queue Toggle */}
        <button
          onClick={toggleQueue}
          className={`p-1.5 transition ${
            isQueueOpen ? 'text-[#1ed760]' : 'text-neutral-400 hover:text-white'
          }`}
          title="Queue"
        >
          <ListMusic size={18} />
        </button>

        {/* Mini Player / Picture-in-picture */}
        <button
          onClick={toggleMiniPlayer}
          className="p-1.5 text-neutral-400 hover:text-white transition"
          title="Mini Player"
        >
          <Maximize2 size={16} />
        </button>

        {/* Volume Controls */}
        <div className="flex items-center gap-2 group w-28">
          <button
            onClick={toggleMute}
            className="text-neutral-400 hover:text-white transition p-1"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX size={18} />
            ) : volume < 0.5 ? (
              <Volume1 size={18} />
            ) : (
              <Volume2 size={18} />
            )}
          </button>

          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-full h-1 bg-[#4d4d4d] accent-[#1ed760] rounded-full cursor-pointer hover:accent-[#1fdf64]"
            title="Volume"
          />
        </div>
      </div>
    </footer>
  );
};

