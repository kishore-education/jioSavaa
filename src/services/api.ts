import { Album, Artist, Playlist, SearchAllData, Song } from '../types';
import { deduplicateAlbums, deduplicatePlaylists, deduplicateSongs } from '../utils/sanitizer';

const API_BASE_URL = 'https://jiosaavn-api.kishoresaravanan440.workers.dev';

// In-memory cache to prevent redundant API calls during the session
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchFromApi<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Check cache
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    
    // Check if the response follows the standard { success: true, data: ... } wrapper
    if (json && typeof json === 'object') {
      if (json.success === false) {
        throw new Error(json.message || 'API request failed');
      }
      const data = json.data !== undefined ? json.data : json;
      cache.set(url, { data, timestamp: Date.now() });
      return data as T;
    }

    cache.set(url, { data: json, timestamp: Date.now() });
    return json as T;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export const musicApi = {
  /**
   * Global search across songs, albums, artists, and playlists with automatic deduplication
   */
  async searchAll(query: string): Promise<SearchAllData> {
    if (!query.trim()) {
      return {};
    }
    const cleanQuery = encodeURIComponent(query.trim());
    
    try {
      const searchResult = await fetchFromApi<any>(`/api/search?query=${cleanQuery}`);
      const songResults = await this.searchSongs(query, 1, 15).catch(() => ({ total: 0, results: [] as Song[] }));

      const rawSongs = songResults.results?.length ? songResults.results : (searchResult.songs?.results || []);
      const cleanSongs = deduplicateSongs(rawSongs);

      const rawAlbums = searchResult.albums?.results || [];
      const cleanAlbums = deduplicateAlbums(rawAlbums);

      const rawPlaylists = searchResult.playlists?.results || [];
      const cleanPlaylists = deduplicatePlaylists(rawPlaylists);

      return {
        topQuery: searchResult.topQuery,
        songs: {
          results: cleanSongs,
          total: cleanSongs.length,
        },
        albums: {
          results: cleanAlbums,
          total: cleanAlbums.length,
        },
        artists: searchResult.artists,
        playlists: {
          results: cleanPlaylists,
          total: cleanPlaylists.length,
        },
      };
    } catch (err) {
      const fallbackSongs = await this.searchSongs(query, 1, 15).catch(() => ({ total: 0, results: [] as Song[] }));
      return {
        songs: {
          results: deduplicateSongs(fallbackSongs.results),
          total: fallbackSongs.results?.length || 0,
        },
      };
    }
  },

  /**
   * Search songs specifically (deduplicated & with high quality downloadUrl)
   */
  async searchSongs(query: string, page = 1, limit = 20): Promise<{ total: number; results: Song[] }> {
    const cleanQuery = encodeURIComponent(query.trim());
    const res = await fetchFromApi<any>(`/api/search/songs?query=${cleanQuery}&page=${page}&limit=${limit}`);
    const rawList = Array.isArray(res.results) ? res.results : [];
    const cleanList = deduplicateSongs(rawList);
    return {
      total: res.total || cleanList.length,
      results: cleanList,
    };
  },

  /**
   * Search albums specifically with deduplication
   */
  async searchAlbums(query: string, page = 1, limit = 15): Promise<{ total: number; results: Album[] }> {
    const cleanQuery = encodeURIComponent(query.trim());
    const res = await fetchFromApi<any>(`/api/search/albums?query=${cleanQuery}&page=${page}&limit=${limit}`);
    const rawList = Array.isArray(res.results) ? res.results : [];
    const cleanList = deduplicateAlbums(rawList);
    return {
      total: res.total || cleanList.length,
      results: cleanList,
    };
  },

  /**
   * Search artists specifically
   */
  async searchArtists(query: string, page = 1, limit = 15): Promise<{ total: number; results: Artist[] }> {
    const cleanQuery = encodeURIComponent(query.trim());
    const res = await fetchFromApi<any>(`/api/search/artists?query=${cleanQuery}&page=${page}&limit=${limit}`);
    return {
      total: res.total || res.results?.length || 0,
      results: Array.isArray(res.results) ? res.results : [],
    };
  },

  /**
   * Search playlists with deduplication
   */
  async searchPlaylists(query: string, page = 1, limit = 15): Promise<{ total: number; results: Playlist[] }> {
    const cleanQuery = encodeURIComponent(query.trim());
    const res = await fetchFromApi<any>(`/api/search/playlists?query=${cleanQuery}&page=${page}&limit=${limit}`);
    const rawList = Array.isArray(res.results) ? res.results : [];
    const cleanList = deduplicatePlaylists(rawList);
    return {
      total: res.total || cleanList.length,
      results: cleanList,
    };
  },

  /**
   * SECTION 6B: Native Tamil Playlists Hub
   * Background regional extraction for Tamil playlists
   */
  async getTamilPlaylists(): Promise<Playlist[]> {
    try {
      const [res1, res2] = await Promise.allSettled([
        this.searchPlaylists('Tamil', 1, 15),
        this.searchPlaylists('Tamil hits', 1, 10),
      ]);

      const list1 = res1.status === 'fulfilled' ? res1.value.results : [];
      const list2 = res2.status === 'fulfilled' ? res2.value.results : [];
      return deduplicatePlaylists([...list1, ...list2]);
    } catch (err) {
      console.warn('Failed to load Tamil playlists:', err);
      return [];
    }
  },

  /**
   * Fetch song details by ID (including 320kbps downloadUrl)
   */
  async getSongById(id: string): Promise<Song> {
    const res = await fetchFromApi<any>(`/api/songs/${id}`);
    const song = Array.isArray(res) && res.length > 0 ? res[0] : res;
    return deduplicateSongs([song])[0] || song;
  },

  /**
   * Fetch complete album details with deduplicated tracklist
   */
  async getAlbumById(id: string): Promise<Album> {
    const album = await fetchFromApi<Album>(`/api/albums?id=${encodeURIComponent(id)}`);
    if (album.songs) {
      album.songs = deduplicateSongs(album.songs);
    }
    return album;
  },

  /**
   * Fetch artist profile with deduplicated top songs and discography
   */
  async getArtistById(id: string): Promise<Artist> {
    const artist = await fetchFromApi<Artist>(`/api/artists?id=${encodeURIComponent(id)}`);
    if (artist.topSongs) {
      artist.topSongs = deduplicateSongs(artist.topSongs);
    }
    if (artist.topAlbums) {
      artist.topAlbums = deduplicateAlbums(artist.topAlbums);
    }
    return artist;
  },

  /**
   * Fetch playlist details with deduplicated songs
   */
  async getPlaylistById(id: string): Promise<Playlist> {
    const playlist = await fetchFromApi<Playlist>(`/api/playlists?id=${encodeURIComponent(id)}`);
    if (playlist.songs) {
      playlist.songs = deduplicateSongs(playlist.songs);
    }
    return playlist;
  },

  /**
   * Homepage curated modules with regional curation and global deduplication
   */
  async getHomeContent(): Promise<{
    trendingSongs: Song[];
    topEnglishHits: Song[];
    bollywoodHits: Song[];
    popularAlbums: Album[];
    featuredPlaylists: Playlist[];
    topTamilPlaylists: Playlist[];
  }> {
    try {
      const [trending, english, bollywood, albums, playlists, tamil] = await Promise.allSettled([
        this.searchSongs('latest', 1, 12),
        this.searchSongs('top english hits billboard', 1, 10),
        this.searchSongs('bollywood romantic hits', 1, 10),
        this.searchAlbums('arijit singh', 1, 8),
        this.searchPlaylists('top hits', 1, 8),
        this.getTamilPlaylists(),
      ]);

      return {
        trendingSongs: trending.status === 'fulfilled' ? deduplicateSongs(trending.value.results) : [],
        topEnglishHits: english.status === 'fulfilled' ? deduplicateSongs(english.value.results) : [],
        bollywoodHits: bollywood.status === 'fulfilled' ? deduplicateSongs(bollywood.value.results) : [],
        popularAlbums: albums.status === 'fulfilled' ? deduplicateAlbums(albums.value.results) : [],
        featuredPlaylists: playlists.status === 'fulfilled' ? deduplicatePlaylists(playlists.value.results) : [],
        topTamilPlaylists: tamil.status === 'fulfilled' ? tamil.value : [],
      };
    } catch (e) {
      console.error('Failed to load homepage modules:', e);
      return {
        trendingSongs: [],
        topEnglishHits: [],
        bollywoodHits: [],
        popularAlbums: [],
        featuredPlaylists: [],
        topTamilPlaylists: [],
      };
    }
  },
};
