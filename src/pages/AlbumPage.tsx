import React, { useEffect, useState } from 'react';
import { Album, Song } from '../types';
import { musicApi } from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import { useNavigation } from '../context/NavigationContext';
import { useColorExtractor } from '../hooks/useColorExtractor';
import { SongRow } from '../components/common/SongRow';
import { HeroSkeleton, SongRowSkeleton } from '../components/common/SkeletonLoader';
import { decodeHtmlEntities, formatTotalDuration, getArtistNames, getBestImageUrl } from '../utils/formatters';
import { Play, Pause, Shuffle, Disc, Clock } from 'lucide-react';

interface AlbumPageProps {
  id: string;
  onOpenAddToPlaylist: (song: Song) => void;
}

export const AlbumPage: React.FC<AlbumPageProps> = ({ id, onOpenAddToPlaylist }) => {
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { currentSong, isPlaying, playSong, togglePlayPause, toggleShuffle } = usePlayer();
  const { navigateArtist } = useNavigation();

  useEffect(() => {
    let isMounted = true;

    async function loadAlbum() {
      try {
        setLoading(true);
        const data = await musicApi.getAlbumById(id);
        if (isMounted) {
          setAlbum(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Album fetch error:', err);
          setError('Failed to load album information.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadAlbum();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const coverUrl = getBestImageUrl(album?.image, album?.name || 'Album');
  const { rgba } = useColorExtractor(coverUrl, album?.name);

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

  if (error || !album) {
    return (
      <div className="p-8 text-center py-20 text-neutral-400">
        <Disc size={48} className="mx-auto mb-3 opacity-40" />
        <h2 className="text-xl font-bold text-white mb-2">Album not found</h2>
        <p className="text-sm">{error || 'Unable to retrieve album details.'}</p>
      </div>
    );
  }

  const songs = album.songs || [];
  const isAlbumActive = songs.some((s) => s.id === currentSong?.id);
  const isAlbumPlaying = isAlbumActive && isPlaying;
  const totalDurationStr = formatTotalDuration(songs);
  const artistName = getArtistNames(album);
  const primaryArtist = album.artists?.primary?.[0];

  const handlePlayAll = () => {
    if (songs.length === 0) return;
    if (isAlbumActive) {
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
        <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-md overflow-hidden shadow-2xl flex-shrink-0 bg-neutral-900 border border-white/10">
          <img
            src={coverUrl}
            alt={album.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex flex-col justify-end text-center sm:text-left min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-white/90">
            Album
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white my-2 tracking-tight line-clamp-2">
            {decodeHtmlEntities(album.name || album.title)}
          </h1>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm font-semibold text-white/90 mt-1">
            <span 
              onClick={() => {
                if (primaryArtist?.id) navigateArtist(primaryArtist.id);
              }}
              className="hover:underline cursor-pointer text-white font-bold"
            >
              {artistName}
            </span>
            {album.year && (
              <>
                <span>•</span>
                <span>{album.year}</span>
              </>
            )}
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

      {/* Action Controls */}
      <div className="px-6 sm:px-8 py-5 flex items-center gap-6">
        <button
          onClick={handlePlayAll}
          disabled={songs.length === 0}
          className="w-14 h-14 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
          title={isAlbumPlaying ? 'Pause' : 'Play'}
        >
          {isAlbumPlaying ? (
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
      </div>

      {/* Songs Table */}
      <div className="px-4 sm:px-8">
        <div className="grid grid-cols-12 items-center gap-4 px-4 py-2 border-b border-white/10 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
          <span className="col-span-1">#</span>
          <span className="col-span-8 sm:col-span-8">Title</span>
          <div className="col-span-3 sm:col-span-3 flex justify-end items-center pr-4">
            <Clock size={16} />
          </div>
        </div>

        <div className="space-y-1">
          {songs.map((song, index) => (
            <SongRow
              key={song.id}
              song={song}
              index={index}
              contextQueue={songs}
              showAlbum={false}
              onOpenAddToPlaylist={onOpenAddToPlaylist}
            />
          ))}
        </div>

        {/* Copyright notice */}
        {album.year && (
          <div className="mt-8 pt-4 border-t border-white/5 text-xs text-neutral-500">
            <p>© {album.year} JioSaavn Music Clone</p>
          </div>
        )}
      </div>
    </div>
  );
};

