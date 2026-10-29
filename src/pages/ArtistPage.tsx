import React, { useEffect, useState } from 'react';
import { Artist, Song } from '../types';
import { musicApi } from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import { useColorExtractor } from '../hooks/useColorExtractor';
import { SongRow } from '../components/common/SongRow';
import { MediaCard } from '../components/common/MediaCard';
import { HeroSkeleton, SongRowSkeleton } from '../components/common/SkeletonLoader';
import { decodeHtmlEntities, getBestImageUrl } from '../utils/formatters';
import { Play, Pause, BadgeCheck, User, Users } from 'lucide-react';

interface ArtistPageProps {
  id: string;
  onOpenAddToPlaylist: (song: Song) => void;
}

export const ArtistPage: React.FC<ArtistPageProps> = ({ id, onOpenAddToPlaylist }) => {
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);

  const { currentSong, isPlaying, playSong, togglePlayPause } = usePlayer();

  useEffect(() => {
    let isMounted = true;

    async function loadArtist() {
      try {
        setLoading(true);
        const data = await musicApi.getArtistById(id);
        if (isMounted) {
          setArtist(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Artist fetch error:', err);
          setError('Failed to load artist profile.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadArtist();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const coverUrl = getBestImageUrl(artist?.image, artist?.name || 'Artist');
  const { rgba } = useColorExtractor(coverUrl, artist?.name);

  if (loading) {
    return (
      <div className="space-y-6">
        <HeroSkeleton />
        <div className="p-8 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <SongRowSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="p-8 text-center py-20 text-neutral-400">
        <User size={48} className="mx-auto mb-3 opacity-40" />
        <h2 className="text-xl font-bold text-white mb-2">Artist not found</h2>
        <p className="text-sm">{error || 'Unable to retrieve artist information.'}</p>
      </div>
    );
  }

  const topSongs = artist.topSongs || [];
  const topAlbums = artist.topAlbums || [];
  const isArtistActive = topSongs.some((s) => s.id === currentSong?.id);
  const isArtistPlaying = isArtistActive && isPlaying;
  const followers = artist.followerCount || artist.fanCount;

  const handlePlayArtist = () => {
    if (topSongs.length === 0) return;
    if (isArtistActive) {
      togglePlayPause();
    } else {
      playSong(topSongs[0], topSongs);
    }
  };

  return (
    <div className="animate-fade-in pb-32">
      {/* Massive Artist Banner with Ambient Gradient */}
      <div 
        className="relative min-h-[300px] sm:min-h-[380px] p-6 sm:p-8 flex flex-col justify-end transition-colors duration-700 bg-cover bg-center"
        style={{
          background: `linear-gradient(to bottom, ${rgba(0.7)}, ${rgba(0.4)} 50%, #121212 100%)`
        }}
      >
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-end gap-6">
          <img
            src={coverUrl}
            alt={artist.name}
            className="w-36 h-36 sm:w-48 sm:h-48 rounded-full object-cover shadow-2xl border-4 border-black/40"
          />

          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-blue-400 text-sm font-semibold">
              <BadgeCheck size={18} fill="#3b82f6" className="text-black" />
              <span className="text-white text-xs uppercase tracking-wider font-bold">
                Verified Artist
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight">
              {decodeHtmlEntities(artist.name || artist.title)}
            </h1>

            {followers && (
              <p className="text-sm text-neutral-300 flex items-center gap-1.5">
                <Users size={16} />
                <span>{parseInt(followers.toString(), 10).toLocaleString()} monthly listeners</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-6 sm:px-8 py-5 flex items-center gap-6">
        <button
          onClick={handlePlayArtist}
          disabled={topSongs.length === 0}
          className="w-14 h-14 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
          title={isArtistPlaying ? 'Pause' : 'Play'}
        >
          {isArtistPlaying ? (
            <Pause size={26} fill="black" />
          ) : (
            <Play size={26} fill="black" className="ml-1" />
          )}
        </button>

        <button
          onClick={() => setIsFollowing((prev) => !prev)}
          className={`px-4 py-1.5 rounded-full text-xs font-bold border transition ${
            isFollowing 
              ? 'border-white bg-transparent text-white' 
              : 'border-neutral-500 text-neutral-200 hover:border-white hover:text-white'
          }`}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </button>
      </div>

      {/* Popular Tracks Section */}
      <div className="px-4 sm:px-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Popular</h2>
          {topSongs.length > 0 ? (
            <div className="space-y-1">
              {topSongs.slice(0, 10).map((song, index) => (
                <SongRow
                  key={song.id}
                  song={song}
                  index={index}
                  contextQueue={topSongs}
                  onOpenAddToPlaylist={onOpenAddToPlaylist}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-400 italic">No popular songs found.</p>
          )}
        </div>

        {/* Discography / Albums Section */}
        {topAlbums.length > 0 && (
          <div className="pt-6">
            <h2 className="text-2xl font-bold text-white mb-4">Discography</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {topAlbums.slice(0, 6).map((album) => (
                <MediaCard key={album.id} item={{ type: 'album', data: album }} />
              ))}
            </div>
          </div>
        )}

        {/* Bio / About */}
        {artist.bio && (
          <div className="pt-6">
            <h2 className="text-xl font-bold text-white mb-3">About</h2>
            <div className="bg-[#181818] p-6 rounded-xl border border-neutral-800 max-w-3xl">
              <p className="text-sm text-neutral-300 leading-relaxed">
                {decodeHtmlEntities(artist.bio)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

