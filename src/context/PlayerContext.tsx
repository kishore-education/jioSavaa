import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { RepeatMode, Song } from '../types';
import { decodeHtmlEntities, getArtistNames, getBestAudioUrl, getBestImageUrl } from '../utils/formatters';
import { musicApi } from '../services/api';
import { useLibrary } from './LibraryContext';
import { recommendationEngine } from '../services/recommendationEngine';
import { deduplicateSongs } from '../utils/sanitizer';

interface PlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  queue: Song[];
  queueIndex: number;
  isMiniPlayerOpen: boolean;
  isQueueOpen: boolean;
  isLoadingSong: boolean;
  
  // Actions
  playSong: (song: Song, contextQueue?: Song[], explicitIndex?: number) => Promise<void>;
  togglePlayPause: () => void;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  seekTo: (timeInSeconds: number) => void;
  setAudioVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  toggleMiniPlayer: () => void;
  setIsMiniPlayerOpen: (open: boolean) => void;
  toggleQueue: () => void;
  addToQueue: (song: Song) => void;
  playQueueAtIndex: (index: number) => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

const LOCAL_STORAGE_VOL_KEY = 'spotify_clone_volume';
const LOCAL_STORAGE_MUTED_KEY = 'spotify_clone_muted';

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logTrackPlayback, playbackHistory } = useLibrary();

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Core Playback State
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isLoadingSong, setIsLoadingSong] = useState<boolean>(false);

  // Settings State
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_VOL_KEY);
    return saved !== null ? parseFloat(saved) : 0.8;
  });
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_MUTED_KEY);
    return saved === 'true';
  });
  const [previousVolume, setPreviousVolume] = useState<number>(0.8);

  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isShuffled, setIsShuffled] = useState<boolean>(false);

  // Queue State
  const [originalQueue, setOriginalQueue] = useState<Song[]>([]);
  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);
  const [isMiniPlayerOpen, setIsMiniPlayerOpen] = useState<boolean>(false);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);

  // Synchronous references
  const hasLoggedCurrentTrackRef = useRef<boolean>(false);
  const currentSongRef = useRef<Song | null>(null);
  const queueRef = useRef<Song[]>([]);
  const queueIndexRef = useRef<number>(-1);
  const originalQueueRef = useRef<Song[]>([]);
  const repeatModeRef = useRef<RepeatMode>('off');
  const logTrackPlaybackRef = useRef(logTrackPlayback);
  const playbackHistoryRef = useRef(playbackHistory);
  const isAutoPlayingRef = useRef<boolean>(false);

  // Keep references synchronized
  useEffect(() => {
    logTrackPlaybackRef.current = logTrackPlayback;
  }, [logTrackPlayback]);

  useEffect(() => {
    playbackHistoryRef.current = playbackHistory;
  }, [playbackHistory]);

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  /**
   * Helper to resolve audio URL, fetching details if the item lacks downloadUrl
   */
  const resolveAudioUrl = async (song: Song): Promise<{ song: Song; audioUrl: string }> => {
    let audioUrl = getBestAudioUrl(song.downloadUrl);
    let resolvedSong = song;

    if (!audioUrl && song.id) {
      try {
        const fullDetails = await musicApi.getSongById(song.id);
        if (fullDetails && fullDetails.downloadUrl) {
          resolvedSong = { ...song, ...fullDetails };
          audioUrl = getBestAudioUrl(resolvedSong.downloadUrl);
        }
      } catch (err) {
        console.error('Failed to resolve full song stream:', err);
      }
    }

    return { song: resolvedSong, audioUrl };
  };

  /**
   * Main playSong function
   * Synchronously sets refs so nextTrack and autoplay algorithms always have fresh queue state
   */
  const playSong = async (song: Song, contextQueue?: Song[], explicitIndex?: number) => {
    if (!audioRef.current) return;

    hasLoggedCurrentTrackRef.current = false;
    setIsLoadingSong(true);

    try {
      const { song: resolvedSong, audioUrl } = await resolveAudioUrl(song);

      if (!audioUrl) {
        console.warn(`Audio preview unavailable for "${resolvedSong.name || resolvedSong.title}". Skipping to next.`);
        setIsLoadingSong(false);
        // Automatically attempt next track
        nextTrack();
        return;
      }

      // Compute new deduplicated queue
      let newQueue: Song[];
      let newOriginal: Song[];

      if (contextQueue && contextQueue.length > 0) {
        newQueue = deduplicateSongs(contextQueue);
        newOriginal = newQueue;
      } else if (queueRef.current.length > 0 && queueRef.current.some((s) => s.id === resolvedSong.id)) {
        newQueue = deduplicateSongs(queueRef.current);
        newOriginal = originalQueueRef.current;
      } else {
        newQueue = deduplicateSongs([resolvedSong, ...queueRef.current]);
        newOriginal = deduplicateSongs([resolvedSong, ...originalQueueRef.current]);
      }

      // Compute new queue index
      let newIndex = 0;
      if (explicitIndex !== undefined && explicitIndex >= 0 && explicitIndex < newQueue.length) {
        newIndex = explicitIndex;
      } else {
        const found = newQueue.findIndex((s) => s.id === resolvedSong.id);
        newIndex = found >= 0 ? found : 0;
      }

      // SYNCHRONOUS REF UPDATES
      currentSongRef.current = resolvedSong;
      queueRef.current = newQueue;
      originalQueueRef.current = newOriginal;
      queueIndexRef.current = newIndex;

      // REACT STATE UPDATES
      setCurrentSong(resolvedSong);
      setQueue(newQueue);
      setOriginalQueue(newOriginal);
      setQueueIndex(newIndex);

      // AUDIO PLAYBACK
      audioRef.current.src = audioUrl;
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
      setIsPlaying(true);

      // Permanently record playback in session tracker immediately so this track is never repeated
      recommendationEngine.recordSessionPlay(resolvedSong);
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        console.error('Playback error:', error);
      }
      setIsPlaying(false);
    } finally {
      setIsLoadingSong(false);
    }
  };

  const playQueueAtIndex = async (index: number) => {
    const currentQ = queueRef.current;
    if (index >= 0 && index < currentQ.length) {
      const target = currentQ[index];
      await playSong(target, currentQ, index);
    }
  };

  /**
   * SECTION 5C: Intelligent Next Song Queuing Algorithm
   * Triggers when queue is exhausted or user triggers next on an empty/finished queue
   */
  const triggerAutoplayRecommendation = useCallback(async () => {
    if (isAutoPlayingRef.current) return;
    const seed = currentSongRef.current;
    if (!seed) return;

    isAutoPlayingRef.current = true;
    setIsLoadingSong(true);

    try {
      const currentQ = queueRef.current;
      const history = playbackHistoryRef.current;

      // Select next best song using similarity score (Genre Match * 0.6 + Artist Match * 0.4) and fatigue penalty
      const nextSong = await recommendationEngine.selectNextSong(seed, currentQ, history);

      if (nextSong) {
        // Append recommended song to deduplicated queue
        const updatedQueue = deduplicateSongs([...currentQ, nextSong]);
        const newIndex = updatedQueue.length - 1;
        await playSong(nextSong, updatedQueue, newIndex);
      } else {
        setIsPlaying(false);
      }
    } catch (err) {
      console.warn('Auto-play recommendation error:', err);
      setIsPlaying(false);
    } finally {
      setIsLoadingSong(false);
      isAutoPlayingRef.current = false;
    }
  }, []);

  /**
   * Next Track action
   * Plays the next unplayed track in queue or triggers intelligent recommendation algorithm to search & fetch new songs
   */
  const nextTrack = useCallback(async () => {
    if (repeatModeRef.current === 'one' && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
      return;
    }

    const currentQ = queueRef.current;
    const currentIndex = queueIndexRef.current;
    const nextIndex = currentIndex + 1;

    // 1. Scan forward in current queue for the first unplayed, non-similar track
    let targetIndex = -1;
    for (let i = nextIndex; i < currentQ.length; i++) {
      const candidate = currentQ[i];
      if (!recommendationEngine.isAlreadyPlayedOrSimilar(candidate, playbackHistoryRef.current, currentSongRef.current || undefined)) {
        targetIndex = i;
        break;
      }
    }

    if (targetIndex !== -1) {
      await playQueueAtIndex(targetIndex);
      return;
    }

    // 2. If loop queue is on, check if any earlier tracks in currentQ are unplayed
    if (repeatModeRef.current === 'all' && currentQ.length > 0) {
      let loopIndex = -1;
      for (let i = 0; i < currentQ.length; i++) {
        const candidate = currentQ[i];
        if (!recommendationEngine.isAlreadyPlayedOrSimilar(candidate, playbackHistoryRef.current, currentSongRef.current || undefined)) {
          loopIndex = i;
          break;
        }
      }
      if (loopIndex !== -1) {
        await playQueueAtIndex(loopIndex);
        return;
      }
    }

    // 3. Queue has no unplayed fresh tracks left -> Search API and auto-play a brand new song!
    await triggerAutoplayRecommendation();
  }, [triggerAutoplayRecommendation]);

  const previousTrack = useCallback(async () => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    const currentQ = queueRef.current;
    const currentIndex = queueIndexRef.current;
    const prevIndex = currentIndex - 1;

    if (prevIndex >= 0 && prevIndex < currentQ.length) {
      await playQueueAtIndex(prevIndex);
    } else if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  }, []);

  // Initialize HTML5 Audio Element & Event Listeners
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (!audioRef.current) return;
      const cur = audioRef.current.currentTime;
      setCurrentTime(cur);

      // Log to history once played for > 30 seconds
      if (cur >= 30 && !hasLoggedCurrentTrackRef.current && currentSongRef.current) {
        logTrackPlaybackRef.current(currentSongRef.current);
        hasLoggedCurrentTrackRef.current = true;
      }
    };

    const handleLoadedMetadata = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration || 0);
      }
    };

    // Auto-play next song on ended
    const handleEnded = () => {
      if (!hasLoggedCurrentTrackRef.current && currentSongRef.current) {
        logTrackPlaybackRef.current(currentSongRef.current);
        hasLoggedCurrentTrackRef.current = true;
      }

      nextTrack();
    };

    const handleWaiting = () => {
      setIsLoadingSong(true);
    };

    const handlePlaying = () => {
      setIsLoadingSong(false);
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleError = (e: Event) => {
      console.warn('Audio playback error event:', e);
      setIsLoadingSong(false);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
  }, [nextTrack]);

  // Volume synchronization
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    localStorage.setItem(LOCAL_STORAGE_VOL_KEY, volume.toString());
    localStorage.setItem(LOCAL_STORAGE_MUTED_KEY, isMuted.toString());
  }, [volume, isMuted]);

  const togglePlayPause = () => {
    if (!audioRef.current || !currentSong) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((err) => {
        console.error('Failed to resume playback:', err);
      });
      setIsPlaying(true);
    }
  };

  const seekTo = (timeInSeconds: number) => {
    if (!audioRef.current) return;
    const clamped = Math.max(0, Math.min(timeInSeconds, duration || 0));
    audioRef.current.currentTime = clamped;
    setCurrentTime(clamped);
  };

  const setAudioVolume = (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolume(clamped);
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(previousVolume > 0 ? previousVolume : 0.8);
    } else {
      setPreviousVolume(volume);
      setIsMuted(true);
    }
  };

  const toggleRepeat = () => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const toggleShuffle = () => {
    setIsShuffled((prev) => {
      const next = !prev;
      if (next) {
        if (currentSong) {
          const others = originalQueueRef.current.filter((s) => s.id !== currentSong.id);
          for (let i = others.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [others[i], others[j]] = [others[j], others[i]];
          }
          const shuffledQueue = [currentSong, ...others];
          queueRef.current = shuffledQueue;
          queueIndexRef.current = 0;
          setQueue(shuffledQueue);
          setQueueIndex(0);
        }
      } else {
        const orig = originalQueueRef.current;
        queueRef.current = orig;
        setQueue(orig);
        if (currentSong) {
          const origIdx = orig.findIndex((s) => s.id === currentSong.id);
          const finalIdx = origIdx >= 0 ? origIdx : 0;
          queueIndexRef.current = finalIdx;
          setQueueIndex(finalIdx);
        }
      }
      return next;
    });
  };

  const toggleMiniPlayer = () => {
    setIsMiniPlayerOpen((prev) => !prev);
  };

  const toggleQueue = () => {
    setIsQueueOpen((prev) => !prev);
  };

  const addToQueue = (song: Song) => {
    const updated = deduplicateSongs([...queueRef.current, song]);
    queueRef.current = updated;
    originalQueueRef.current = deduplicateSongs([...originalQueueRef.current, song]);
    setQueue(updated);
    setOriginalQueue(originalQueueRef.current);
  };

  // Mutable function references for Media Session API (Bluetooth headphone / Hardware controls)
  const nextTrackRef = useRef(nextTrack);
  const previousTrackRef = useRef(previousTrack);
  const togglePlayPauseRef = useRef(togglePlayPause);
  const seekToRef = useRef(seekTo);

  useEffect(() => {
    nextTrackRef.current = nextTrack;
  }, [nextTrack]);

  useEffect(() => {
    previousTrackRef.current = previousTrack;
  }, [previousTrack]);

  useEffect(() => {
    togglePlayPauseRef.current = togglePlayPause;
  }, [togglePlayPause]);

  useEffect(() => {
    seekToRef.current = seekTo;
  }, [seekTo]);

  // Set up Bluetooth Headphone Hardware Actions (Next, Previous, Play, Pause, Seek)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const actionHandlers: Array<[MediaSessionAction, MediaSessionActionHandler]> = [
      ['play', () => {
        if (audioRef.current) {
          audioRef.current.play().catch(console.error);
          setIsPlaying(true);
        }
      }],
      ['pause', () => {
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      }],
      ['previoustrack', () => {
        previousTrackRef.current();
      }],
      ['nexttrack', () => {
        nextTrackRef.current();
      }],
      ['seekto', (details) => {
        if (details.seekTime !== undefined && details.seekTime !== null) {
          seekToRef.current(details.seekTime);
        }
      }],
      ['seekbackward', (details) => {
        const offset = details.seekOffset || 10;
        if (audioRef.current) {
          seekToRef.current(Math.max(audioRef.current.currentTime - offset, 0));
        }
      }],
      ['seekforward', (details) => {
        const offset = details.seekOffset || 10;
        if (audioRef.current) {
          seekToRef.current(Math.min(audioRef.current.currentTime + offset, audioRef.current.duration || 0));
        }
      }],
      ['stop', () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setIsPlaying(false);
        }
      }]
    ];

    actionHandlers.forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (err) {
        // Specific browser action unsupported fallback
      }
    });

    return () => {
      actionHandlers.forEach(([action]) => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch (e) {
          // ignore
        }
      });
    };
  }, []);

  // Update Media Session Metadata for Bluetooth Headphone Screen, Watch & Lockscreen
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    if (currentSong) {
      const title = decodeHtmlEntities(currentSong.name || currentSong.title || 'Unknown Track');
      const artist = getArtistNames(currentSong);
      const album = typeof currentSong.album === 'object' && currentSong.album?.name 
        ? decodeHtmlEntities(currentSong.album.name)
        : typeof currentSong.album === 'string'
        ? decodeHtmlEntities(currentSong.album)
        : 'Madhu Leka Music';

      const bestImage = getBestImageUrl(currentSong.image, title);

      let artwork: Array<{ src: string; sizes: string; type: string }> = [];
      if (Array.isArray(currentSong.image) && currentSong.image.length > 0) {
        artwork = currentSong.image.map((img) => ({
          src: img.url,
          sizes: img.quality || '500x500',
          type: 'image/jpeg',
        }));
      } else {
        artwork = [
          { src: bestImage, sizes: '500x500', type: 'image/jpeg' },
          { src: '/madhu-leka-logo.jpg', sizes: '512x512', type: 'image/jpeg' }
        ];
      }

      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title,
          artist,
          album,
          artwork,
        });
      } catch (err) {
        console.warn('Failed to set media session metadata:', err);
      }
    } else {
      navigator.mediaSession.metadata = null;
    }
  }, [currentSong]);

  // Sync Media Session Playback State (playing vs paused)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    } catch (e) {
      // ignore
    }
  }, [isPlaying]);

  // Sync Position State for Bluetooth timeline scrubber
  useEffect(() => {
    if (!('mediaSession' in navigator) || !('setPositionState' in navigator.mediaSession)) return;
    if (duration > 0 && currentTime >= 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: Math.max(duration, 0.1),
          playbackRate: audioRef.current?.playbackRate || 1,
          position: Math.min(Math.max(currentTime, 0), duration),
        });
      } catch (e) {
        // ignore
      }
    }
  }, [currentTime, duration]);

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        repeatMode,
        isShuffled,
        queue,
        queueIndex,
        isMiniPlayerOpen,
        isQueueOpen,
        isLoadingSong,
        playSong,
        togglePlayPause,
        nextTrack,
        previousTrack,
        seekTo,
        setAudioVolume,
        toggleMute,
        toggleRepeat,
        toggleShuffle,
        toggleMiniPlayer,
        setIsMiniPlayerOpen,
        toggleQueue,
        addToQueue,
        playQueueAtIndex,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = (): PlayerContextType => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
