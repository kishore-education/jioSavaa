export interface ImageAsset {
  quality: string;
  url: string;
}

export interface DownloadUrlAsset {
  quality: string;
  url: string;
}

export interface ArtistSummary {
  id: string;
  name: string;
  role?: string;
  type?: string;
  image?: ImageAsset[];
  url?: string;
}

export interface SongAlbum {
  id: string;
  name: string;
  url?: string;
}

export interface Song {
  id: string;
  name: string;
  title?: string;
  type?: string;
  year?: string | number;
  releaseDate?: string;
  duration: number | string;
  label?: string;
  explicitContent?: boolean;
  playCount?: string | number;
  language?: string;
  hasLyrics?: boolean;
  lyricsId?: string;
  url?: string;
  copyright?: string;
  album?: SongAlbum | string;
  artists?: {
    primary?: ArtistSummary[];
    featured?: ArtistSummary[];
    all?: ArtistSummary[];
  };
  primaryArtists?: string | ArtistSummary[];
  featuredArtists?: string | ArtistSummary[];
  singers?: string;
  image: ImageAsset[] | string;
  downloadUrl: DownloadUrlAsset[] | string;
}

export interface Album {
  id: string;
  name: string;
  title?: string;
  year?: string | number;
  type?: string;
  playCount?: string | number;
  language?: string;
  explicitContent?: boolean;
  songCount?: string | number;
  url?: string;
  primaryArtists?: string | ArtistSummary[];
  featuredArtists?: string | ArtistSummary[];
  artists?: {
    primary?: ArtistSummary[];
    featured?: ArtistSummary[];
    all?: ArtistSummary[];
  };
  image: ImageAsset[] | string;
  songs?: Song[];
  description?: string;
}

export interface Artist {
  id: string;
  name: string;
  title?: string;
  url?: string;
  type?: string;
  image: ImageAsset[] | string;
  followerCount?: string | number;
  fanCount?: string | number;
  isVerified?: boolean;
  dominantLanguage?: string;
  dominantType?: string;
  bio?: string;
  dob?: string;
  topSongs?: Song[];
  topAlbums?: Album[];
  singles?: Song[];
  similarArtists?: ArtistSummary[];
}

export interface Playlist {
  id: string;
  name: string;
  title?: string;
  description?: string;
  type?: string;
  year?: string | number;
  playCount?: string | number;
  language?: string;
  explicitContent?: boolean;
  url?: string;
  songCount?: string | number;
  image: ImageAsset[] | string;
  songs?: Song[];
  isCustom?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export interface SearchAllData {
  topQuery?: {
    results: Array<{
      id: string;
      title: string;
      image: ImageAsset[] | string;
      album?: string;
      url?: string;
      type?: string;
      description?: string;
      primaryArtists?: string;
      singers?: string;
      language?: string;
    }>;
  };
  songs?: {
    results: Song[];
    total?: number;
  };
  albums?: {
    results: Album[];
    total?: number;
  };
  artists?: {
    results: Artist[];
    total?: number;
  };
  playlists?: {
    results: Playlist[];
    total?: number;
  };
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface PlayedTrackRecord {
  id: string;
  title: string;
  normalizedTitle: string;
  artist: string;
  timestamp: number; // Unix epoch ms
  language?: string;
  genre?: string;
}

export interface PlaybackHistoryItem {
  id: string;
  genre: string;
  artistId: string;
  language: string;
  albumId: string;
  timestamp: number;
  playCount: number;
  title: string;
  artistName: string;
  albumName?: string;
  image?: ImageAsset[] | string;
  songPayload: Song;
}

export interface ProfileVectors {
  topGenres: Array<{ genre: string; weight: number }>;
  topArtists: Array<{ artistId: string; name: string; weight: number }>;
}

export interface DailyMix {
  id: string;
  title: string;
  description: string;
  genre: string;
  color: string;
  songs: Song[];
}

export type ActivePage = 
  | { type: 'home' }
  | { type: 'search'; initialQuery?: string }
  | { type: 'library' }
  | { type: 'liked-songs' }
  | { type: 'playlist'; id: string; isCustom?: boolean }
  | { type: 'album'; id: string }
  | { type: 'artist'; id: string };

