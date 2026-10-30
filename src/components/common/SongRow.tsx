import React, { useState, useRef, useEffect } from 'react';
import { Song } from '../../types';
import { usePlayer } from '../../context/PlayerContext';
import { useLibrary } from '../../context/LibraryContext';
import { useNavigation } from '../../context/NavigationContext';
import { 
  Play, 
  Pause, 
  Heart, 
  MoreHorizontal, 
  ListPlus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  User, 
  Disc 
} from 'lucide-react';
import { decodeHtmlEntities, formatDuration, getArtistNames, getBestImageUrl } from '../../utils/formatters';

interface SongRowProps {
  song: Song;
  index: number;
  contextQueue?: Song[];
  showAlbum?: boolean;
  canReorder?: boolean;
  canRemove?: boolean;
  onRemove?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onOpenAddToPlaylist?: (song: Song) => void;
}

export const SongRow: React.FC<SongRowProps> = ({
  song,
  index,
  contextQueue,
  showAlbum = true,
  canReorder = false,
  canRemove = false,
  onRemove,
  onMoveUp,
  onMoveDown,
  onOpenAddToPlaylist,
}) => {
  const { currentSong, isPlaying, playSong, togglePlayPause, addToQueue } = usePlayer();
  const { isSongLiked, toggleLikeSong, addToRecentlyPlayed } = useLibrary();
  const { navigateAlbum, navigateArtist } = useNavigation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isCurrent = currentSong?.id === song.id;
  const isRowPlaying = isCurrent && isPlaying;
  const liked = isSongLiked(song.id);
  const imageUrl = getBestImageUrl(song.image, song.name);
  const title = decodeHtmlEntities(song.name || song.title || 'Untitled');
  const artists = getArtistNames(song);

  const albumName = typeof song.album === 'object' && song.album !== null
    ? decodeHtmlEntities(song.album.name)
    : typeof song.album === 'string'
    ? decodeHtmlEntities(song.album)
    : '';

  const albumId = typeof song.album === 'object' && song.album !== null ? song.album.id : undefined;

  // Primary artist ID if available
  const primaryArtist = song.artists?.primary?.[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleRowClick = () => {
    if (isCurrent) {
      togglePlayPause();
    } else {
      playSong(song, contextQueue, index);
      addToRecentlyPlayed(song);
    }
  };

  const handleArtistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (primaryArtist?.id) {
      navigateArtist(primaryArtist.id);
    }
  };

  const handleAlbumClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (albumId) {
      navigateAlbum(albumId);
    }
  };

  return (
    <div 
      onClick={handleRowClick}
      className={`group grid grid-cols-12 items-center gap-4 px-4 py-2 rounded-md hover:bg-white/10 transition cursor-pointer select-none text-sm ${
        isCurrent ? 'bg-white/5' : ''
      }`}
    >
      {/* Index / Play / Playing indicator */}
      <div className="col-span-1 flex items-center justify-start text-neutral-400 group-hover:text-white w-7">
        {isRowPlaying ? (
          <div className="flex items-end gap-[3px] h-4 w-4">
            <span className="w-1 bg-[#1ed760] rounded-full animate-bounce h-full" style={{ animationDelay: '0ms' }} />
            <span className="w-1 bg-[#1ed760] rounded-full animate-bounce h-2/3" style={{ animationDelay: '150ms' }} />
            <span className="w-1 bg-[#1ed760] rounded-full animate-bounce h-4/5" style={{ animationDelay: '300ms' }} />
          </div>
        ) : isCurrent ? (
          <div className="hidden group-hover:block">
            <Play size={16} fill="white" />
          </div>
        ) : (
          <>
            <span className="group-hover:hidden text-neutral-400 font-medium">
              {index + 1}
            </span>
            <button className="hidden group-hover:block text-white hover:scale-110 transition">
              <Play size={16} fill="white" />
            </button>
          </>
        )}
      </div>

      {/* Song Info (Title + Artist) */}
      <div className={`flex items-center gap-3 overflow-hidden ${showAlbum ? 'col-span-6 sm:col-span-5' : 'col-span-8'}`}>
        <img
          src={imageUrl}
          alt={title}
          className="w-10 h-10 rounded object-cover flex-shrink-0 bg-neutral-800 shadow"
        />
        <div className="overflow-hidden min-w-0 pr-2">
          <p className={`font-medium truncate leading-snug ${isCurrent ? 'text-[#1ed760]' : 'text-white'}`}>
            {title}
          </p>
          <p 
            onClick={handleArtistClick}
            className="text-xs text-neutral-400 hover:text-white hover:underline truncate transition"
          >
            {artists}
          </p>
        </div>
      </div>

      {/* Album (optional / responsive) */}
      {showAlbum && (
        <div className="hidden sm:block col-span-3 truncate text-xs text-neutral-400">
          {albumName ? (
            <span 
              onClick={handleAlbumClick} 
              className="hover:text-white hover:underline transition cursor-pointer"
            >
              {albumName}
            </span>
          ) : (
            '—'
          )}
        </div>
      )}

      {/* Right Actions: Reorder / Like / Duration / Menu */}
      <div className={`flex items-center justify-end gap-3 ${showAlbum ? 'col-span-5 sm:col-span-3' : 'col-span-3'}`}>
        {/* Reordering buttons for custom playlist */}
        {canReorder && (
          <div className="hidden md:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp?.();
              }}
              title="Move Up"
              className="p-1 hover:text-white text-neutral-400 hover:bg-neutral-800 rounded"
            >
              <ChevronUp size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown?.();
              }}
              title="Move Down"
              className="p-1 hover:text-white text-neutral-400 hover:bg-neutral-800 rounded"
            >
              <ChevronDown size={14} />
            </button>
          </div>
        )}

        {/* Like Heart */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleLikeSong(song);
          }}
          className={`p-1.5 transition ${
            liked 
              ? 'text-[#1ed760]' 
              : 'text-neutral-400 hover:text-white opacity-0 group-hover:opacity-100'
          }`}
          title={liked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
        >
          <Heart size={16} fill={liked ? '#1ed760' : 'transparent'} />
        </button>

        {/* Duration */}
        <span className="text-xs text-neutral-400 font-mono w-10 text-right">
          {formatDuration(song.duration)}
        </span>

        {/* Context Menu "..." */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen((prev) => !prev);
            }}
            className="p-1.5 text-neutral-400 hover:text-white opacity-0 group-hover:opacity-100 transition rounded-full hover:bg-neutral-800"
            title="More options"
          >
            <MoreHorizontal size={16} />
          </button>

          {isMenuOpen && (
            <div 
              className="absolute right-0 top-8 z-40 w-48 bg-[#282828] border border-neutral-700 rounded-md shadow-xl py-1 animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenAddToPlaylist?.(song);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-neutral-200 hover:text-white hover:bg-neutral-700/60 transition text-left"
              >
                <ListPlus size={15} />
                Add to playlist
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  addToQueue(song);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-neutral-200 hover:text-white hover:bg-neutral-700/60 transition text-left"
              >
                <Play size={15} />
                Add to queue
              </button>

              {primaryArtist?.id && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigateArtist(primaryArtist.id);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-neutral-200 hover:text-white hover:bg-neutral-700/60 transition text-left"
                >
                  <User size={15} />
                  Go to artist
                </button>
              )}

              {albumId && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigateAlbum(albumId);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-neutral-200 hover:text-white hover:bg-neutral-700/60 transition text-left"
                >
                  <Disc size={15} />
                  Go to album
                </button>
              )}

              {canRemove && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onRemove?.();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-neutral-700/60 transition text-left border-t border-neutral-700 mt-1"
                >
                  <Trash2 size={15} />
                  Remove from this playlist
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

