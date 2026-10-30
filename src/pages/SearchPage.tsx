import React, { useState, useEffect } from 'react';
import { Song, Album, Artist, Playlist, SearchAllData } from '../types';
import { musicApi } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import { usePlayer } from '../context/PlayerContext';
import { useNavigation } from '../context/NavigationContext';
import { SongRow } from '../components/common/SongRow';
import { MediaCard } from '../components/common/MediaCard';
import { GridSkeleton } from '../components/common/SkeletonLoader';
import { decodeHtmlEntities, getArtistNames, getBestImageUrl } from '../utils/formatters';
import { Play, Pause, Search as SearchIcon, Compass } from 'lucide-react';

interface SearchPageProps {
  initialQuery?: string;
  onOpenAddToPlaylist: (song: Song) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const CATEGORY_PILLS = [
  { label: 'All', query: '' },
  { label: 'Tamil', query: 'tamil' },
  { label: 'Trending', query: 'latest trending hits' },
  { label: 'Bollywood', query: 'bollywood hits' },
  { label: 'Pop', query: 'pop hits' },
  { label: 'Rock', query: 'rock classics' },
  { label: 'Hip-Hop', query: 'hip hop' },
  { label: 'Dance & EDM', query: 'electronic dance music' },
  { label: 'Punjabi', query: 'punjabi hits' },
  { label: 'Romance', query: 'romantic love songs' },
  { label: 'Chill & Lo-Fi', query: 'lo-fi chill' },
  { label: 'Workout', query: 'workout motivation bass' },
];

const BROWSE_GENRES = [
  { title: 'Podcasts', color: 'bg-red-600', query: 'podcast' },
  { title: 'Made For You', color: 'bg-indigo-700', query: 'top hits' },
  { title: 'Tamil Hits', color: 'bg-emerald-700', query: 'tamil hits' },
  { title: 'New Releases', color: 'bg-pink-700', query: 'new releases' },
  { title: 'Bollywood', color: 'bg-orange-600', query: 'bollywood hits' },
  { title: 'Pop', color: 'bg-emerald-600', query: 'pop hits' },
  { title: 'Hip-Hop', color: 'bg-yellow-700', query: 'hip hop' },
  { title: 'Rock', color: 'bg-blue-800', query: 'rock hits' },
  { title: 'Punjabi', color: 'bg-amber-600', query: 'punjabi songs' },
  { title: 'Dance / Electronic', color: 'bg-teal-600', query: 'dance party' },
  { title: 'Romantic', color: 'bg-rose-700', query: 'romantic songs' },
  { title: 'Acoustic & Chill', color: 'bg-cyan-800', query: 'chill acoustic' },
  { title: 'Workout', color: 'bg-lime-700', query: 'workout motivation' },
];

export const SearchPage: React.FC<SearchPageProps> = ({
  initialQuery = '',
  onOpenAddToPlaylist,
  searchQuery,
  setSearchQuery,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [results, setResults] = useState<SearchAllData | null>(null);
  const [tamilPlaylists, setTamilPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { currentSong, isPlaying, playSong, togglePlayPause } = usePlayer();
  const { navigateAlbum, navigateArtist, navigatePlaylist } = useNavigation();

  // Debounced search query
  const debouncedQuery = useDebounce(searchQuery, 300);

  // SECTION 6B: Async Regional Extraction on Search Hub bootstrap
  useEffect(() => {
    let isMounted = true;
    musicApi.getTamilPlaylists().then((playlists) => {
      if (isMounted) {
        setTamilPlaylists(playlists);
      }
    }).catch(console.warn);

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function executeSearch() {
      const activeSearch = debouncedQuery.trim();
      if (!activeSearch) {
        setResults(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await musicApi.searchAll(activeSearch);
        if (isMounted) {
          setResults(data);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Search error:', err);
          setError('Failed to fetch search results. Please try again.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    executeSearch();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery]);

  const handleCategoryClick = (cat: typeof CATEGORY_PILLS[0]) => {
    setSelectedCategory(cat.label);
    if (cat.query) {
      setSearchQuery(cat.query);
    } else {
      setSearchQuery('');
    }
  };

  const topSong = results?.songs?.results?.[0];
  const isTopSongPlaying = currentSong?.id === topSong?.id && isPlaying;
  const songResults = results?.songs?.results || [];
  const albumResults = results?.albums?.results || [];
  const artistResults = results?.artists?.results || [];
  const playlistResults = results?.playlists?.results || [];

  return (
    <div className="p-4 sm:p-8 space-y-6 pb-28 animate-fade-in select-none">
      {/* Category Pills (Horizontal scrolling) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
        {CATEGORY_PILLS.map((cat) => {
          const isSelected = selectedCategory === cat.label;
          return (
            <button
              key={cat.label}
              onClick={() => handleCategoryClick(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition transform active:scale-95 ${
                isSelected
                  ? 'bg-white text-black font-bold'
                  : 'bg-[#242424] text-white hover:bg-[#2e2e2e]'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-6 mt-4">
          <div className="h-6 w-32 bg-[#282828] rounded animate-pulse" />
          <GridSkeleton count={6} />
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="p-4 bg-red-950/40 border border-red-800 rounded-lg text-neutral-300 text-sm">
          {error}
        </div>
      )}

      {/* Search Results Display */}
      {!isLoading && results && debouncedQuery && (
        <div className="space-y-8 animate-fade-in">
          {/* Top Result + Songs split layout */}
          {topSong && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Top Result Spotlight Card */}
              <div className="lg:col-span-5 flex flex-col">
                <h2 className="text-xl font-bold text-white mb-3">Top result</h2>
                <div 
                  onClick={() => {
                    if (currentSong?.id === topSong.id) togglePlayPause();
                    else playSong(topSong, songResults, 0);
                  }}
                  className="group relative flex-1 bg-[#181818] hover:bg-[#282828] p-5 rounded-lg transition duration-300 cursor-pointer flex flex-col justify-between shadow-lg"
                >
                  <div>
                    <img
                      src={getBestImageUrl(topSong.image, topSong.name)}
                      alt={topSong.name}
                      className="w-24 h-24 rounded shadow-xl object-cover mb-4"
                    />
                    <h3 className="text-2xl font-extrabold text-white line-clamp-1 mb-1">
                      {decodeHtmlEntities(topSong.name || topSong.title)}
                    </h3>
                    <p className="text-xs text-neutral-400">
                      <span className="text-white font-medium">{getArtistNames(topSong)}</span>
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-black/60 text-[10px] uppercase font-bold text-neutral-300">
                        Song
                      </span>
                    </p>
                  </div>

                  <div className={`self-end w-12 h-12 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-xl transition-all duration-300 ${
                    isTopSongPlaying
                      ? 'opacity-100 scale-100'
                      : 'opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100'
                  }`}>
                    {isTopSongPlaying ? (
                      <Pause size={22} fill="black" />
                    ) : (
                      <Play size={22} fill="black" className="ml-0.5" />
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Songs List */}
              <div className="lg:col-span-7 flex flex-col">
                <h2 className="text-xl font-bold text-white mb-3">Songs</h2>
                <div className="space-y-1">
                  {songResults.slice(0, 5).map((song, idx) => (
                    <SongRow
                      key={song.id}
                      song={song}
                      index={idx}
                      contextQueue={songResults}
                      showAlbum={false}
                      onOpenAddToPlaylist={onOpenAddToPlaylist}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* More Songs */}
          {songResults.length > 5 && (
            <section>
              <h2 className="text-xl font-bold text-white mb-3">More Songs</h2>
              <div className="space-y-1">
                {songResults.slice(5, 12).map((song, idx) => (
                  <SongRow
                    key={song.id}
                    song={song}
                    index={idx + 5}
                    contextQueue={songResults}
                    onOpenAddToPlaylist={onOpenAddToPlaylist}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Artists Section */}
          {artistResults.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-white mb-4">Artists</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {artistResults.slice(0, 6).map((art) => (
                  <MediaCard key={art.id} item={{ type: 'artist', data: art }} />
                ))}
              </div>
            </section>
          )}

          {/* Albums Section */}
          {albumResults.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-white mb-4">Albums</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {albumResults.slice(0, 6).map((album) => (
                  <MediaCard key={album.id} item={{ type: 'album', data: album }} />
                ))}
              </div>
            </section>
          )}

          {/* Playlists Section */}
          {playlistResults.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-white mb-4">Playlists</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {playlistResults.slice(0, 6).map((pl) => (
                  <MediaCard key={pl.id} item={{ type: 'playlist', data: pl }} />
                ))}
              </div>
            </section>
          )}

          {/* No results */}
          {songResults.length === 0 && albumResults.length === 0 && artistResults.length === 0 && (
            <div className="text-center py-16 text-neutral-400">
              <SearchIcon size={40} className="mx-auto mb-3 opacity-40" />
              <h3 className="text-lg font-bold text-white">No results found for "{debouncedQuery}"</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Please make sure your words are spelled correctly or try using different keywords.
              </p>
            </div>
          )}
        </div>
      )}

      {/* SECTION 6B: Search View Card Dashboard - Curated Tamil Playlists Gallery */}
      {!debouncedQuery && tamilPlaylists.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span className="text-[#1ed760] font-black">தமிழ்</span> Curated Tamil Playlists
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#1ed760]/20 text-[#1ed760] text-[10px] font-bold uppercase border border-[#1ed760]/30">
                  Dashboard
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Explore dedicated Kollywood playlists directly from the search hub
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tamilPlaylists.slice(0, 6).map((pl) => (
              <MediaCard key={pl.id} item={{ type: 'playlist', data: pl }} />
            ))}
          </div>
        </section>
      )}

      {/* Browse All Genres (When not searching) */}
      {!debouncedQuery && (
        <section className="space-y-4 pt-2">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Browse all</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {BROWSE_GENRES.map((g) => (
              <div
                key={g.title}
                onClick={() => setSearchQuery(g.query)}
                className={`${g.color} h-36 sm:h-44 rounded-lg p-4 relative overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-95 transition-all shadow-md select-none group`}
              >
                <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
                  {g.title}
                </h3>
                <div className="absolute -bottom-2 -right-3 w-20 h-20 bg-black/20 rounded shadow-2xl transform rotate-25 group-hover:rotate-12 transition duration-300" />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
