import React, { useEffect, useState } from 'react';
import { Album, DailyMix, Playlist, Song } from '../types';
import { musicApi } from '../services/api';
import { recommendationEngine } from '../services/recommendationEngine';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { useNavigation } from '../context/NavigationContext';
import { MediaCard } from '../components/common/MediaCard';
import { GridSkeleton } from '../components/common/SkeletonLoader';
import { decodeHtmlEntities, getArtistNames, getBestImageUrl, getGreeting } from '../utils/formatters';
import { Play, Pause, Flame, Sparkles, Disc, Radio, Compass, ChevronRight } from 'lucide-react';

interface HomeData {
  trendingSongs: Song[];
  topEnglishHits: Song[];
  bollywoodHits: Song[];
  popularAlbums: Album[];
  featuredPlaylists: Playlist[];
  topTamilPlaylists: Playlist[];
}

interface HomePageProps {
  onOpenAddToPlaylist: (song: Song) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenAddToPlaylist }) => {
  const [data, setData] = useState<HomeData | null>(null);
  const [dailyMixes, setDailyMixes] = useState<DailyMix[]>([]);
  const [discoverNewReleases, setDiscoverNewReleases] = useState<Song[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { currentSong, isPlaying, playSong, togglePlayPause } = usePlayer();
  const { playbackHistory, profileVectors, languagePreferences, openLanguageModal } = useLibrary();
  const { navigatePlaylist } = useNavigation();

  // SECTION 6C: Real-time Homepage Adaptation
  // Re-evaluates recommendations whenever playbackHistory or profile preferences update
  useEffect(() => {
    let isMounted = true;

    async function loadPersonalizedContent() {
      try {
        setLoading(true);

        const [homeContent, mixes, discover] = await Promise.all([
          musicApi.getHomeContent(),
          recommendationEngine.generateDailyMixes(profileVectors.topGenres),
          recommendationEngine.getDiscoverNewReleases(profileVectors.topGenres, playbackHistory),
        ]);

        if (isMounted) {
          setData(homeContent);
          setDailyMixes(mixes);
          setDiscoverNewReleases(discover);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Home content error:', err);
          setError('Failed to load music recommendations.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadPersonalizedContent();

    return () => {
      isMounted = false;
    };
  }, [playbackHistory, profileVectors, languagePreferences]);

  const greeting = getGreeting();

  // Extract recent unique tracks from playbackHistory
  const recentTracks = playbackHistory.slice(0, 6).map((h) => h.songPayload);

  // Extract Heavy Rotation tracks (sorted by playCount descending)
  const heavyRotationTracks = [...playbackHistory]
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, 6);

  // Quick access items: top heavy rotation or recent tracks or trending
  const quickItems = recentTracks.length > 0 
    ? recentTracks 
    : (data?.trendingSongs?.slice(0, 6) || []);

  const handlePlayDailyMix = (mix: DailyMix) => {
    if (mix.songs && mix.songs.length > 0) {
      playSong(mix.songs[0], mix.songs);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-9 animate-fade-in pb-28 select-none">
      {/* 1. GREETING & QUICK ACCESS GRID */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {greeting}
          </h1>
          {profileVectors.topGenres.length > 0 && (
            <button
              onClick={openLanguageModal}
              className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-xs text-neutral-300 hover:text-white transition cursor-pointer"
            >
              <Sparkles size={13} className="text-[#1ed760]" />
              <span>Tailored to: {profileVectors.topGenres.slice(0, 2).map((g) => g.genre).join(', ')}</span>
              <span className="text-[10px] text-[#1ed760] font-bold ml-1 hover:underline">Change</span>
            </button>
          )}
        </div>

        {/* Quick Access 6-item Grid */}
        {quickItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickItems.map((song) => {
              const isCurrent = currentSong?.id === song.id;
              const isRowPlaying = isCurrent && isPlaying;
              const title = decodeHtmlEntities(song.name || song.title || 'Song');
              const img = getBestImageUrl(song.image, title);

              return (
                <div
                  key={song.id}
                  onClick={() => {
                    if (isCurrent) togglePlayPause();
                    else playSong(song, quickItems);
                  }}
                  className="group flex items-center bg-[#242424]/80 hover:bg-[#2c2c2c] rounded-md overflow-hidden cursor-pointer transition duration-300 relative shadow-md"
                >
                  <img
                    src={img}
                    alt={title}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover flex-shrink-0"
                  />
                  <div className="flex-1 px-3 min-w-0 pr-14">
                    <p className="text-sm font-bold text-white truncate">
                      {title}
                    </p>
                    <p className="text-xs text-neutral-400 truncate mt-0.5">
                      {getArtistNames(song)}
                    </p>
                  </div>

                  <div className={`absolute right-3 w-10 h-10 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-xl transition-all duration-300 ${
                    isRowPlaying 
                      ? 'opacity-100 scale-100' 
                      : 'opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100'
                  }`}>
                    {isRowPlaying ? (
                      <Pause size={18} fill="black" />
                    ) : (
                      <Play size={18} fill="black" className="ml-0.5" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-8">
          <div>
            <div className="h-6 w-48 bg-[#282828] rounded mb-4 animate-pulse" />
            <GridSkeleton count={4} />
          </div>
          <div>
            <div className="h-6 w-48 bg-[#282828] rounded mb-4 animate-pulse" />
            <GridSkeleton count={6} />
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="p-4 bg-red-950/30 border border-red-800/40 rounded-xl text-neutral-300 text-sm">
          {error}
        </div>
      )}

      {/* 2. SECTION 6B: NATIVE TOP TAMIL PLAYLISTS HORIZONTAL CAROUSEL ROW */}
      {!loading && data?.topTamilPlaylists && data.topTamilPlaylists.length > 0 && (
        <section className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span className="text-[#1ed760] font-black">தமிழ்</span> Top Tamil Playlists
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#1ed760]/20 text-[#1ed760] text-[10px] font-extrabold uppercase border border-[#1ed760]/30">
                  Regional Spotlight
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Authentic Kollywood chartbusters, 90s gold, Anirudh hits, and soulful Tamil melodies
              </p>
            </div>
          </div>

          {/* Horizontal Card Carousel */}
          <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-neutral-700 scroll-smooth">
            {data.topTamilPlaylists.map((pl) => (
              <div key={pl.id} className="w-44 sm:w-48 flex-shrink-0">
                <MediaCard item={{ type: 'playlist', data: pl }} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. SECTION 5B: "HEAVY ROTATION" (Highest playCount) */}
      {!loading && heavyRotationTracks.length > 0 && heavyRotationTracks[0].playCount > 1 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <Flame size={22} className="text-orange-500" />
                Heavy Rotation
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Your most frequently played songs ranked by listen count
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {heavyRotationTracks.map((item) => (
              <div key={item.id} className="relative group">
                <MediaCard item={{ type: 'song', data: item.songPayload }} />
                <div className="absolute top-2 left-2 z-10 pointer-events-none">
                  <span className="bg-black/80 backdrop-blur text-orange-400 font-bold text-[10px] px-2 py-0.5 rounded-full border border-orange-500/30 flex items-center gap-1">
                    <Flame size={10} />
                    {item.playCount}x
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. SECTION 5B: "RECENTLY PLAYED" (Unique Sliding Window) */}
      {!loading && recentTracks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Recently Played
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Tracks from your local listening session
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recentTracks.map((song) => (
              <MediaCard key={song.id} item={{ type: 'song', data: song }} />
            ))}
          </div>
        </section>
      )}

      {/* 5. "MADE FOR YOU" DAILY MIXES */}
      {!loading && dailyMixes.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <Radio size={22} className="text-[#1ed760]" />
                Made For You
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Dynamic mixes grouped from your top genre profile vectors
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {dailyMixes.map((mix) => (
              <div
                key={mix.id}
                onClick={() => handlePlayDailyMix(mix)}
                className={`group relative bg-gradient-to-br ${mix.color} p-5 rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-xl flex flex-col justify-between min-h-[170px] select-none`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/70 bg-black/40 px-2 py-0.5 rounded-full">
                      {mix.genre}
                    </span>
                    <span className="text-xs font-semibold text-white/80">
                      {mix.songs.length} songs
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-white mt-2 leading-tight">
                    {mix.title}
                  </h3>
                  <p className="text-xs text-white/80 line-clamp-2 mt-1">
                    {mix.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <span className="text-[11px] font-bold text-white/70">Spotify Mix</span>
                  <div className="w-11 h-11 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 group-hover:scale-105 active:scale-95 transition-all">
                    <Play size={20} fill="black" className="ml-0.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. "DISCOVER NEW RELEASES" (Unplayed in User's Top Genres) */}
      {!loading && discoverNewReleases.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <Sparkles size={22} className="text-[#1ed760]" />
                Discover New Releases
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Fresh, unplayed songs matching your high-interest categories
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {discoverNewReleases.slice(0, 6).map((song) => (
              <MediaCard key={song.id} item={{ type: 'song', data: song }} />
            ))}
          </div>
        </section>
      )}

      {/* 7. GENERAL CURATED TRENDING HITS */}
      {!loading && data?.trendingSongs && data.trendingSongs.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Trending Right Now
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {data.trendingSongs.slice(0, 6).map((song) => (
              <MediaCard key={song.id} item={{ type: 'song', data: song }} />
            ))}
          </div>
        </section>
      )}

      {/* 8. POPULAR ALBUMS */}
      {!loading && data?.popularAlbums && data.popularAlbums.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Disc size={20} className="text-neutral-400" />
              Popular Albums
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {data.popularAlbums.slice(0, 6).map((album) => (
              <MediaCard key={album.id} item={{ type: 'album', data: album }} />
            ))}
          </div>
        </section>
      )}

      {/* 9. FEATURED PLAYLISTS */}
      {!loading && data?.featuredPlaylists && data.featuredPlaylists.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Featured Playlists
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {data.featuredPlaylists.slice(0, 6).map((pl) => (
              <MediaCard key={pl.id} item={{ type: 'playlist', data: pl }} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
