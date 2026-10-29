import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { PlaybackHistoryItem, Playlist, ProfileVectors, Song } from '../types';
import { recommendationEngine } from '../services/recommendationEngine';
import { deduplicateSongs } from '../utils/sanitizer';

interface LibraryContextType {
  customPlaylists: Playlist[];
  likedSongs: Song[];
  recentlyPlayed: Song[];
  playbackHistory: PlaybackHistoryItem[];
  profileVectors: ProfileVectors;
  languagePreferences: string[];
  isLanguageModalOpen: boolean;
  
  // Custom Playlist actions
  createPlaylist: (name?: string, description?: string, image?: string) => Playlist;
  updatePlaylist: (id: string, updates: Partial<Playlist>) => void;
  deletePlaylist: (id: string) => void;
  addSongToPlaylist: (playlistId: string, song: Song) => void;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;
  reorderPlaylistSongs: (playlistId: string, startIndex: number, endIndex: number) => void;
  getCustomPlaylist: (id: string) => Playlist | undefined;

  // Liked Songs actions
  toggleLikeSong: (song: Song) => void;
  isSongLiked: (songId: string) => boolean;

  // History & Tracking
  addToRecentlyPlayed: (song: Song) => void;
  logTrackPlayback: (song: Song) => void;

  // Language Preferences
  openLanguageModal: () => void;
  closeLanguageModal: () => void;
  updateLanguagePreferences: (languages: string[]) => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

const LOCAL_STORAGE_PLAYLISTS_KEY = 'spotify_clone_custom_playlists';
const LOCAL_STORAGE_LIKED_KEY = 'spotify_clone_liked_songs';
const LOCAL_STORAGE_RECENT_KEY = 'spotify_clone_recently_played';
const LOCAL_STORAGE_LANG_KEY = 'spotify_clone_language_preferences';

const DEFAULT_STARTER_PLAYLISTS: Playlist[] = [
  {
    id: 'pl-chill-vibes',
    name: 'My Late Night Vibes',
    description: 'Soft beats, chill melodies, and deep late-night focus.',
    isCustom: true,
    songCount: 0,
    image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=500&q=80',
    songs: [],
    createdAt: Date.now() - 100000,
    updatedAt: Date.now(),
  },
  {
    id: 'pl-workout-energy',
    name: 'Beast Mode Gym Beats',
    description: 'High tempo, pulse-racing bass for maximum lifting power.',
    isCustom: true,
    songCount: 0,
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=500&q=80',
    songs: [],
    createdAt: Date.now() - 50000,
    updatedAt: Date.now(),
  }
];

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check if first-time user
  const hasSavedLanguages = localStorage.getItem(LOCAL_STORAGE_LANG_KEY) !== null;

  const [languagePreferences, setLanguagePreferences] = useState<string[]>(() => {
    return recommendationEngine.getLanguagePreferences();
  });

  // Automatically open language preference selection if newly entering user
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState<boolean>(!hasSavedLanguages);

  // Custom Playlists State
  const [customPlaylists, setCustomPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PLAYLISTS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse playlists from localStorage:', e);
    }
    return DEFAULT_STARTER_PLAYLISTS;
  });

  // Liked Songs State
  const [likedSongs, setLikedSongs] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_LIKED_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse liked songs from localStorage:', e);
    }
    return [];
  });

  // Recently Played State
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_RECENT_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse recently played from localStorage:', e);
    }
    return [];
  });

  // Playback History State
  const [playbackHistory, setPlaybackHistory] = useState<PlaybackHistoryItem[]>(() => {
    return recommendationEngine.getHistory();
  });

  // Profile Vectors dynamically combining playback history AND language preferences
  const profileVectors = useMemo(() => {
    return recommendationEngine.calculateProfileVectors(playbackHistory, languagePreferences);
  }, [playbackHistory, languagePreferences]);

  // Persist storage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PLAYLISTS_KEY, JSON.stringify(customPlaylists));
  }, [customPlaylists]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_LIKED_KEY, JSON.stringify(likedSongs));
  }, [likedSongs]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_RECENT_KEY, JSON.stringify(recentlyPlayed));
  }, [recentlyPlayed]);

  // Playlist Management
  const createPlaylist = (
    name?: string, 
    description: string = 'Created by you', 
    image: string = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=500&q=80'
  ): Playlist => {
    const playlistNumber = customPlaylists.length + 1;
    const newPlaylist: Playlist = {
      id: `custom-pl-${Date.now()}`,
      name: name?.trim() || `My Playlist #${playlistNumber}`,
      description,
      isCustom: true,
      image,
      songCount: 0,
      songs: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setCustomPlaylists((prev) => [newPlaylist, ...prev]);
    return newPlaylist;
  };

  const updatePlaylist = (id: string, updates: Partial<Playlist>) => {
    setCustomPlaylists((prev) =>
      prev.map((pl) => (pl.id === id ? { ...pl, ...updates, updatedAt: Date.now() } : pl))
    );
  };

  const deletePlaylist = (id: string) => {
    setCustomPlaylists((prev) => prev.filter((pl) => pl.id !== id));
  };

  const addSongToPlaylist = (playlistId: string, song: Song) => {
    setCustomPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== playlistId) return pl;

        const currentSongs = pl.songs || [];
        const updatedSongs = deduplicateSongs([...currentSongs, song]);

        return {
          ...pl,
          songs: updatedSongs,
          songCount: updatedSongs.length,
          updatedAt: Date.now(),
        };
      })
    );
  };

  const removeSongFromPlaylist = (playlistId: string, songId: string) => {
    setCustomPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== playlistId) return pl;

        const updatedSongs = (pl.songs || []).filter((s) => s.id !== songId);
        return {
          ...pl,
          songs: updatedSongs,
          songCount: updatedSongs.length,
          updatedAt: Date.now(),
        };
      })
    );
  };

  const reorderPlaylistSongs = (playlistId: string, startIndex: number, endIndex: number) => {
    setCustomPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== playlistId || !pl.songs) return pl;

        const result = Array.from(pl.songs);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);

        return {
          ...pl,
          songs: result,
          updatedAt: Date.now(),
        };
      })
    );
  };

  const getCustomPlaylist = (id: string): Playlist | undefined => {
    return customPlaylists.find((pl) => pl.id === id);
  };

  // Liked Songs Management
  const isSongLiked = (songId: string): boolean => {
    return likedSongs.some((s) => s.id === songId);
  };

  const toggleLikeSong = (song: Song) => {
    setLikedSongs((prev) => {
      const exists = prev.some((s) => s.id === song.id);
      if (exists) {
        return prev.filter((s) => s.id !== song.id);
      } else {
        return deduplicateSongs([song, ...prev]);
      }
    });
  };

  // Recently Played
  const addToRecentlyPlayed = (song: Song) => {
    setRecentlyPlayed((prev) => {
      const deduped = deduplicateSongs([song, ...prev]);
      return deduped.slice(0, 20);
    });
  };

  // Log Track Playback (triggered after >30s or finished)
  const logTrackPlayback = (song: Song) => {
    const updated = recommendationEngine.logPlayback(song);
    setPlaybackHistory([...updated]);
    addToRecentlyPlayed(song);
  };

  // Language Preferences Controls
  const openLanguageModal = () => setIsLanguageModalOpen(true);
  const closeLanguageModal = () => setIsLanguageModalOpen(false);

  const updateLanguagePreferences = (languages: string[]) => {
    recommendationEngine.saveLanguagePreferences(languages);
    setLanguagePreferences(languages);
    setIsLanguageModalOpen(false);
  };

  return (
    <LibraryContext.Provider
      value={{
        customPlaylists,
        likedSongs,
        recentlyPlayed,
        playbackHistory,
        profileVectors,
        languagePreferences,
        isLanguageModalOpen,
        createPlaylist,
        updatePlaylist,
        deletePlaylist,
        addSongToPlaylist,
        removeSongFromPlaylist,
        reorderPlaylistSongs,
        getCustomPlaylist,
        toggleLikeSong,
        isSongLiked,
        addToRecentlyPlayed,
        logTrackPlayback,
        openLanguageModal,
        closeLanguageModal,
        updateLanguagePreferences,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = (): LibraryContextType => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};
