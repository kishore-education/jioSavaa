import React, { useEffect, useState } from 'react';
import { Playlist, Song } from '../types';
import { musicApi } from '../services/api';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { useNavigation } from '../context/NavigationContext';
import { useColorExtractor } from '../hooks/useColorExtractor';
import { SongRow } from '../components/common/SongRow';
import { HeroSkeleton, SongRowSkeleton } from '../components/common/SkeletonLoader';
import { EditPlaylistModal } from '../components/common/EditPlaylistModal';
import { decodeHtmlEntities, formatTotalDuration, getBestImageUrl } from '../utils/formatters';
import { deduplicateSongs } from '../utils/sanitizer';
import { Play, Pause, Shuffle, Edit2, Trash2, Clock, Music } from 'lucide-react';

interface PlaylistPageProps {
  id: string;
  isCustom?: boolean;
  onOpenAddToPlaylist: (song: Song) => void;
}

export const PlaylistPage: React.FC<PlaylistPageProps> = ({ id, isCustom, onOpenAddToPlaylist }) => {
  const { getCustomPlaylist, deletePlaylist, reorderPlaylistSongs, removeSongFromPlaylist } = useLibrary();
  const { currentSong, isPlaying, playSong, togglePlayPause, toggleShuffle } = usePlayer();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // If custom, get directly from Library context
  const customPl = getCustomPlaylist(id);

  useEffect(() => {
    let isMounted = true;

    if (isCustom || id.startsWith('custom-pl-') || id.startsWith('pl-')) {
      if (customPl) {
        setPlaylist(customPl);
        setLoading(false);
      }
      return;
    }

    // Fetch from JioSaavn API
    async function fetchPlaylist() {
      try {
        setLoading(true);
        const data = await musicApi.getPlaylistById(id);
        if (isMounted) {
          setPlaylist(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Playlist fetch error:', err);
          setError('Failed to load playlist details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchPlaylist();

    return () => {
      isMounted = false;
    };
  }, [id, isCustom, customPl]);

  // If it's a custom playlist, keep state in sync
  useEffect(() => {
    if ((isCustom || id.startsWith('custom-pl-') || id.startsWith('pl-')) && customPl) {
      setPlaylist(customPl);
    }
  }, [customPl, id, isCustom]);

  const coverUrl = getBestImageUrl(playlist?.image, playlist?.name || 'Playlist');
  const { rgbString, rgba } = useColorExtractor(coverUrl, playlist?.name);

  if (loading) {
    return (
      <div className="space-y-6">
        <HeroSkeleton />
        <div className="p-8 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <SongRowSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="p-8 text-center py-20 text-neutral-400">
        <Music size={48} className="mx-auto mb-3 opacity-40" />
        <h2 className="text-xl font-bold text-white mb-2">Playlist not found</h2>
        <p className="text-sm">{error || 'This playlist might have been removed.'}</p>
      </div>
    );
  }

  const songs = deduplicateSongs(playlist.songs || []);
  const isPlaylistActive = songs.some((s) => s.id === currentSong?.id);
  const isPlaylistPlaying = isPlaylistActive && isPlaying;
  const totalDurationStr = formatTotalDuration(songs);

  const handlePlayAll = () => {
    if (songs.length === 0) return;
    if (isPlaylistActive) {
      togglePlayPause();
    } else {
      playSong(songs[0], songs, 0);
    }
  };

  const handleShufflePlay = () => {
    if (songs.length === 0) return;
    const randomIdx = Math.floor(Math.random() * songs.length);
    playSong(songs[randomIdx], songs, randomIdx);
    toggleShuffle();
  };

  return (
    <div className="animate-fade-in pb-32">
      {/* Dynamic Ambient Gradient Hero Banner */}
      <div 
        className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-end gap-6 transition-colors duration-700"
        style={{
          background: `linear-gradient(to bottom, ${rgba(0.85)}, ${rgba(0.4)} 60%, #121212 100%)`
        }}
      >
        {/* Cover Art */}
        <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-md overflow-hidden shadow-2xl flex-shrink-0 bg-neutral-900 border border-white/10 group relative">
          <img
            src={coverUrl}
            alt={playlist.name}
            className="w-full h-full object-cover"
          />
          {playlist.isCustom && (
            <button
              onClick={() => setIsEditing(true)}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition gap-1"
            >
              <Edit2 size={24} />
              <span className="text-xs font-semibold">Change details</span>
            </button>
          )}
        </div>

        {/* Hero Meta Info */}
        <div className="flex flex-col justify-end text-center sm:text-left min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-white/90">
            {playlist.isCustom ? 'Custom Playlist' : 'Playlist'}
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white my-2 tracking-tight line-clamp-2">
            {decodeHtmlEntities(playlist.name || playlist.title)}
          </h1>
          {playlist.description && (
            <p className="text-sm text-white/80 line-clamp-2 mb-3 max-w-2xl">
              {decodeHtmlEntities(playlist.description)}
            </p>
          )}
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm font-semibold text-white/90">
            <span>Spotify</span>
            <span>•</span>
            <span>{songs.length} songs</span>
            {songs.length > 0 && (
              <>
                <span>•</span>
                <span className="text-white/70">{totalDurationStr}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar (Play All, Shuffle, Edit, Delete) */}
      <div className="px-6 sm:px-8 py-5 flex items-center gap-6">
        <button
          onClick={handlePlayAll}
          disabled={songs.length === 0}
          className="w-14 h-14 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
          title={isPlaylistPlaying ? 'Pause' : 'Play'}
        >
          {isPlaylistPlaying ? (
            <Pause size={26} fill="black" />
          ) : (
            <Play size={26} fill="black" className="ml-1" />
          )}
        </button>

        <button
          onClick={handleShufflePlay}
          disabled={songs.length === 0}
          className="text-neutral-400 hover:text-white transition disabled:opacity-50"
          title="Shuffle Play"
        >
          <Shuffle size={24} />
        </button>

        {playlist.isCustom && (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="text-neutral-400 hover:text-white transition p-2 rounded-full hover:bg-white/10"
              title="Edit playlist"
            >
              <Edit2 size={20} />
            </button>

            <button
              onClick={() => {
                if (confirm(`Delete playlist "${playlist.name}"?`)) {
                  deletePlaylist(playlist.id);
                }
              }}
              className="text-neutral-400 hover:text-red-400 transition p-2 rounded-full hover:bg-white/10"
              title="Delete playlist"
            >
              <Trash2 size={20} />
            </button>
          </>
        )}
      </div>

      {/* Tracklist Table */}
      <div className="px-4 sm:px-8">
        {songs.length > 0 ? (
          <div>
            {/* Table Header */}
            <div className="grid grid-cols-12 items-center gap-4 px-4 py-2 border-b border-white/10 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              <span className="col-span-1">#</span>
              <span className="col-span-6 sm:col-span-5">Title</span>
              <span className="hidden sm:block col-span-3">Album</span>
              <div className="col-span-5 sm:col-span-3 flex justify-end items-center pr-4">
                <Clock size={16} />
              </div>
            </div>

            {/* Song Rows */}
            <div className="space-y-1">
              {songs.map((song, index) => (
                <SongRow
                  key={`${song.id}-${index}`}
                  song={song}
                  index={index}
                  contextQueue={songs}
                  canReorder={playlist.isCustom}
                  canRemove={playlist.isCustom}
                  onRemove={() => removeSongFromPlaylist(playlist.id, song.id)}
                  onMoveUp={() => {
                    if (index > 0) reorderPlaylistSongs(playlist.id, index, index - 1);
                  }}
                  onMoveDown={() => {
                    if (index < songs.length - 1) reorderPlaylistSongs(playlist.id, index, index + 1);
                  }}
                  onOpenAddToPlaylist={onOpenAddToPlaylist}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-neutral-400 border border-dashed border-neutral-800 rounded-xl my-6">
            <Music size={40} className="mx-auto mb-2 opacity-30 text-[#1ed760]" />
            <h3 className="text-lg font-bold text-white">This playlist is empty</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              Search for tracks across JioSaavn and click the "..." menu to add songs to this playlist!
            </p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <EditPlaylistModal
          playlist={playlist}
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
        />
      )}
    </div>
  );
};

