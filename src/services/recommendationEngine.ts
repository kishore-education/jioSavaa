import { DailyMix, PlaybackHistoryItem, ProfileVectors, Song } from '../types';
import { decodeHtmlEntities, getArtistNames } from '../utils/formatters';
import { isSimilarSongTitle, normalizeText, deduplicateSongs } from '../utils/sanitizer';
import { musicApi } from './api';

const HISTORY_STORAGE_KEY = 'spotify_clone_playback_history';
const LANGUAGE_PREF_KEY = 'spotify_clone_language_preferences';
const SESSION_PLAYED_IDS_KEY = 'spotify_clone_played_session_ids';
const SESSION_PLAYED_TITLES_KEY = 'spotify_clone_played_session_titles';
const MAX_HISTORY_ITEMS = 50;

// Permanent session tracking so ANY song played once (even skipped immediately) is never repeated
const sessionPlayedIds = new Set<string>();
const sessionPlayedTitles = new Set<string>();

// Bootstrap session played tracker from localStorage immediately
try {
  const storedIds = localStorage.getItem(SESSION_PLAYED_IDS_KEY);
  if (storedIds) {
    const parsed = JSON.parse(storedIds);
    if (Array.isArray(parsed)) {
      parsed.forEach((id: string) => sessionPlayedIds.add(id));
    }
  }

  const storedTitles = localStorage.getItem(SESSION_PLAYED_TITLES_KEY);
  if (storedTitles) {
    const parsed = JSON.parse(storedTitles);
    if (Array.isArray(parsed)) {
      parsed.forEach((title: string) => sessionPlayedTitles.add(title));
    }
  }

  const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
  if (storedHistory) {
    const parsed = JSON.parse(storedHistory);
    if (Array.isArray(parsed)) {
      parsed.forEach((item: PlaybackHistoryItem) => {
        if (item.id) sessionPlayedIds.add(item.id);
        const norm = normalizeText(item.title);
        if (norm) sessionPlayedTitles.add(norm);
      });
    }
  }
} catch (e) {
  console.warn('Session tracker bootstrap warning:', e);
}

/**
 * Intelligent Genre Inference
 * Deduces normalized genre from song language, title, and metadata
 */
export function inferSongGenre(song?: Song): string {
  if (!song) return 'Pop';

  const textToScan = `${song.language || ''} ${song.name || song.title || ''} ${typeof song.album === 'object' ? song.album?.name || '' : song.album || ''} ${song.label || ''}`.toLowerCase();

  if (textToScan.includes('lofi') || textToScan.includes('lo-fi') || textToScan.includes('chill')) {
    return 'Lo-Fi Chill';
  }
  if (textToScan.includes('rock') || textToScan.includes('metal')) {
    return 'Rock';
  }
  if (textToScan.includes('hip hop') || textToScan.includes('hiphop') || textToScan.includes('rap')) {
    return 'Hip-Hop';
  }
  if (textToScan.includes('edm') || textToScan.includes('dance') || textToScan.includes('electronic') || textToScan.includes('remix')) {
    return 'Dance & EDM';
  }
  if (textToScan.includes('romantic') || textToScan.includes('love') || textToScan.includes('sad')) {
    return 'Romance';
  }
  if (textToScan.includes('punjabi') || song.language?.toLowerCase() === 'punjabi') {
    return 'Punjabi';
  }
  if (textToScan.includes('hindi') || song.language?.toLowerCase() === 'hindi') {
    return 'Bollywood';
  }
  if (textToScan.includes('tamil') || song.language?.toLowerCase() === 'tamil') {
    return 'Tamil';
  }
  if (textToScan.includes('telugu') || song.language?.toLowerCase() === 'telugu') {
    return 'Telugu';
  }
  if (textToScan.includes('malayalam') || song.language?.toLowerCase() === 'malayalam') {
    return 'Malayalam';
  }
  if (textToScan.includes('kannada') || song.language?.toLowerCase() === 'kannada') {
    return 'Kannada';
  }
  if (textToScan.includes('bengali') || song.language?.toLowerCase() === 'bengali') {
    return 'Bengali';
  }
  if (textToScan.includes('bhojpuri') || song.language?.toLowerCase() === 'bhojpuri') {
    return 'Bhojpuri';
  }
  if (textToScan.includes('gujarati') || song.language?.toLowerCase() === 'gujarati') {
    return 'Gujarati';
  }
  if (textToScan.includes('haryanvi') || song.language?.toLowerCase() === 'haryanvi') {
    return 'Haryanvi';
  }
  if (song.language?.toLowerCase() === 'english') {
    return 'Pop';
  }

  return 'Pop & Global';
}

/**
 * Extracts normalized artist identification
 */
export function extractArtistMetadata(song: Song): { artistId: string; artistName: string } {
  const primary = song.artists?.primary?.[0];
  if (primary?.id && primary?.name) {
    return {
      artistId: primary.id,
      artistName: decodeHtmlEntities(primary.name).split(',')[0].trim(),
    };
  }

  const name = getArtistNames(song);
  const cleanName = name.split(',')[0].trim();
  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return {
    artistId: `art-${Math.abs(hash)}`,
    artistName: cleanName,
  };
}

export const recommendationEngine = {
  /**
   * Reads language preferences
   */
  getLanguagePreferences(): string[] {
    try {
      const raw = localStorage.getItem(LANGUAGE_PREF_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to read language preferences:', e);
    }
    return [];
  },

  /**
   * Saves language preferences
   */
  saveLanguagePreferences(languages: string[]) {
    try {
      localStorage.setItem(LANGUAGE_PREF_KEY, JSON.stringify(languages));
    } catch (e) {
      console.warn('Failed to save language preferences:', e);
    }
  },

  /**
   * Reads playback history from localStorage
   */
  getHistory(): PlaybackHistoryItem[] {
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to read playback history:', e);
    }
    return [];
  },

  /**
   * Saves sliding window of the last 50 played tracks in localStorage
   * Schema: id, genre, artistId, albumId, timestamp, playCount
   */
  logPlayback(song: Song): PlaybackHistoryItem[] {
    if (!song || !song.id) return this.getHistory();

    const history = this.getHistory();
    const genre = inferSongGenre(song);
    const { artistId, artistName } = extractArtistMetadata(song);
    const albumId = typeof song.album === 'object' && song.album?.id ? song.album.id : '';
    const albumName = typeof song.album === 'object' && song.album?.name 
      ? decodeHtmlEntities(song.album.name) 
      : typeof song.album === 'string' 
      ? decodeHtmlEntities(song.album) 
      : '';

    const existingIndex = history.findIndex((item) => item.id === song.id);
    let playCount = 1;

    if (existingIndex >= 0) {
      playCount = (history[existingIndex].playCount || 1) + 1;
      history.splice(existingIndex, 1);
    }

    const newEntry: PlaybackHistoryItem = {
      id: song.id,
      genre,
      artistId,
      language: song.language || 'hindi',
      albumId,
      timestamp: Date.now(),
      playCount,
      title: decodeHtmlEntities(song.name || song.title || 'Unknown Track'),
      artistName,
      albumName,
      image: song.image,
      songPayload: song,
    };

    // Insert at front (sliding window max 50)
    const updated = [newEntry, ...history].slice(0, MAX_HISTORY_ITEMS);

    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save playback history to localStorage:', e);
    }

    return updated;
  },

  /**
   * Computes Profile Vectors (Top Genres and Top Artists) from frequency weights and language preferences
   */
  calculateProfileVectors(history: PlaybackHistoryItem[], preferredLanguages?: string[]): ProfileVectors {
    const genreWeights: Record<string, number> = {};
    const artistWeights: Record<string, { name: string; weight: number }> = {};

    // Seed from user's explicit language preferences
    const prefs = preferredLanguages || this.getLanguagePreferences();
    if (prefs && prefs.length > 0) {
      prefs.forEach((lang, idx) => {
        const mappedGenre = lang === 'Hindi' ? 'Bollywood' : lang;
        genreWeights[mappedGenre] = (genreWeights[mappedGenre] || 0) + (10 - idx * 1.5);
      });
    }

    // Accumulate from playback history
    history.forEach((item, index) => {
      const recencyFactor = 1 + (1 - index / MAX_HISTORY_ITEMS) * 0.5;
      const weight = (item.playCount || 1) * recencyFactor * 2;

      if (item.genre) {
        genreWeights[item.genre] = (genreWeights[item.genre] || 0) + weight;
      }

      if (item.artistId && item.artistName) {
        if (!artistWeights[item.artistId]) {
          artistWeights[item.artistId] = { name: item.artistName, weight: 0 };
        }
        artistWeights[item.artistId].weight += weight;
      }
    });

    // Default fallback if no history and no preferences
    if (Object.keys(genreWeights).length === 0) {
      genreWeights['Bollywood'] = 5;
      genreWeights['Pop'] = 4;
      genreWeights['Punjabi'] = 3;
    }

    const topGenres = Object.entries(genreWeights)
      .map(([genre, weight]) => ({ genre, weight }))
      .sort((a, b) => b.weight - a.weight);

    const topArtists = Object.entries(artistWeights)
      .map(([artistId, val]) => ({ artistId, name: val.name, weight: val.weight }))
      .sort((a, b) => b.weight - a.weight);

    return {
      topGenres,
      topArtists,
    };
  },

  /**
   * Similarity Scoring Math
   * Match Score = (Genre Match * 0.6) + (Artist Match * 0.4)
   * With Fatigue Prevention penalty for tracks played in the last 5 cycles
   */
  calculateSimilarityScore(
    candidate: Song,
    seedSong: Song,
    recentHistoryIds: string[]
  ): number {
    if (candidate.id === seedSong.id) return -999;

    const seedGenre = inferSongGenre(seedSong);
    const candidateGenre = inferSongGenre(candidate);

    const seedArtist = extractArtistMetadata(seedSong);
    const candidateArtist = extractArtistMetadata(candidate);

    // 1. Genre Match: 1.0 exact, 0.5 related
    let genreMatch = 0;
    if (seedGenre.toLowerCase() === candidateGenre.toLowerCase()) {
      genreMatch = 1.0;
    } else if (
      (seedGenre === 'Bollywood' && candidateGenre === 'Romance') ||
      (seedGenre === 'Romance' && candidateGenre === 'Bollywood') ||
      (seedGenre === 'Pop' && candidateGenre === 'Dance & EDM') ||
      (seedGenre === 'Dance & EDM' && candidateGenre === 'Pop')
    ) {
      genreMatch = 0.5;
    }

    // 2. Artist Match: 1.0 exact, 0.5 featured
    let artistMatch = 0;
    if (
      (seedArtist.artistId && candidateArtist.artistId && seedArtist.artistId === candidateArtist.artistId) ||
      seedArtist.artistName.toLowerCase() === candidateArtist.artistName.toLowerCase()
    ) {
      artistMatch = 1.0;
    } else {
      const candidateAll = candidate.artists?.all?.map((a) => a.name.toLowerCase()) || [];
      const seedAll = seedSong.artists?.all?.map((a) => a.name.toLowerCase()) || [];
      const hasOverlap = candidateAll.some((name) => seedAll.includes(name));
      if (hasOverlap) {
        artistMatch = 0.5;
      }
    }

    const matchScore = genreMatch * 0.6 + artistMatch * 0.4;

    // 3. Fatigue Prevention Filter:
    // Penalty factor for any track played within the last 5 historical cycles
    let fatiguePenalty = 0;
    const historyIndex = recentHistoryIds.indexOf(candidate.id);
    if (historyIndex >= 0 && historyIndex < 5) {
      fatiguePenalty = 0.85 - historyIndex * 0.1;
    }

    return matchScore - fatiguePenalty;
  },

  /**
   * Tracks songs played during the current user session so that
   * NO played song or similar version can ever be selected again by autoplay.
   */
  recordSessionPlay(song: Song) {
    if (!song || !song.id) return;
    sessionPlayedIds.add(song.id);
    const norm = normalizeText(song.name || song.title);
    if (norm) {
      sessionPlayedTitles.add(norm);
    }

    try {
      localStorage.setItem(SESSION_PLAYED_IDS_KEY, JSON.stringify(Array.from(sessionPlayedIds)));
      localStorage.setItem(SESSION_PLAYED_TITLES_KEY, JSON.stringify(Array.from(sessionPlayedTitles)));
    } catch (e) {
      // Ignore quota errors if storage is full
    }
  },

  /**
   * Evaluates if a song has already been played once or is similar to a previously played song
   */
  isAlreadyPlayedOrSimilar(candidate: Song, history: PlaybackHistoryItem[], seedSong?: Song): boolean {
    if (!candidate || !candidate.id) return true;

    // Check seed identity
    if (seedSong && candidate.id === seedSong.id) return true;

    // Check exact ID in session or persistent history
    if (sessionPlayedIds.has(candidate.id)) return true;
    if (history.some((h) => h.id === candidate.id)) return true;

    const candTitle = candidate.name || candidate.title || '';
    const normCand = normalizeText(candTitle);

    // Check title in session titles
    if (normCand && sessionPlayedTitles.has(normCand)) return true;

    // Check similarity with seed song
    if (seedSong && isSimilarSongTitle(candTitle, seedSong.name || seedSong.title)) {
      return true;
    }

    // Check similarity with any track in history
    for (const h of history) {
      if (isSimilarSongTitle(candTitle, h.title)) {
        return true;
      }
    }

    // Check similarity with any track in sessionPlayedTitles
    for (const title of sessionPlayedTitles) {
      if (isSimilarSongTitle(normCand, title)) {
        return true;
      }
    }

    return false;
  },

  /**
   * SECTION 6D: Artist-Isolated Endless Similarity Radio
   * Selects structurally matching tracks from DIFFERENT artists using a randomized mix controller.
   * Strictly enforces: DO NOT replay any song played once, DO NOT play same/similar song,
   * search and fetch completely fresh new songs from the API.
   */
  async selectNextSong(
    seedSong: Song,
    candidatePool: Song[],
    history: PlaybackHistoryItem[]
  ): Promise<Song | null> {
    // Register seed song as played
    this.recordSessionPlay(seedSong);

    const seedGenre = inferSongGenre(seedSong);
    const seedArtist = extractArtistMetadata(seedSong);
    const seedArtistNorm = seedArtist.artistName.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Anti-Repetition Rule: Check if a candidate matches the seed's artist
    const isSameArtist = (candidate: Song): boolean => {
      const candArtist = extractArtistMetadata(candidate);
      if (seedArtist.artistId && candArtist.artistId && seedArtist.artistId === candArtist.artistId) {
        return true;
      }
      const candNorm = candArtist.artistName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seedArtistNorm && candNorm) {
        if (seedArtistNorm === candNorm) return true;
        if (seedArtistNorm.includes(candNorm) || candNorm.includes(seedArtistNorm)) return true;
      }
      const rawPrimary = (typeof candidate.primaryArtists === 'string' 
        ? candidate.primaryArtists 
        : candidate.artists?.primary?.[0]?.name || ''
      ).toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seedArtistNorm && rawPrimary && (rawPrimary.includes(seedArtistNorm) || seedArtistNorm.includes(rawPrimary))) {
        return true;
      }
      return false;
    };

    // Filter candidate pool: MUST NOT be played once, MUST NOT be similar, MUST NOT be same artist
    let freshPool: Song[] = candidatePool.filter(
      (s) => s.id && !this.isAlreadyPlayedOrSimilar(s, history, seedSong) && !isSameArtist(s)
    );

    const langPrefs = this.getLanguagePreferences();
    const preferredLang = langPrefs[0] || seedSong.language || 'Tamil';

    // If fresh pool is too small, actively query the API with diverse searches and random page offsets
    if (freshPool.length < 8) {
      try {
        const page1 = Math.floor(Math.random() * 5) + 1;
        const page2 = Math.floor(Math.random() * 5) + 1;
        const page3 = Math.floor(Math.random() * 5) + 1;
        const page4 = Math.floor(Math.random() * 5) + 1;

        const queries = [
          musicApi.searchSongs(`${seedGenre} hit songs`, page1, 20),
          musicApi.searchSongs(`${seedSong.language || preferredLang} chartbusters`, page2, 20),
          musicApi.searchSongs(`new ${seedGenre} songs`, page3, 20),
          musicApi.searchSongs(`latest ${preferredLang} songs`, page4, 20),
        ];

        const settled = await Promise.allSettled(queries);
        const fetchedRaw: Song[] = [];

        settled.forEach((res) => {
          if (res.status === 'fulfilled' && res.value.results) {
            fetchedRaw.push(...res.value.results);
          }
        });

        const deduplicatedFetched = deduplicateSongs(fetchedRaw);

        // Strictly filter fetched candidates: never played, not similar, not same artist
        for (const cand of deduplicatedFetched) {
          if (
            cand.id &&
            !this.isAlreadyPlayedOrSimilar(cand, history, seedSong) &&
            !isSameArtist(cand) &&
            !freshPool.some((p) => p.id === cand.id)
          ) {
            freshPool.push(cand);
          }
        }
      } catch (err) {
        console.warn('API search for fresh songs error:', err);
      }
    }

    // Secondary fallback: if fresh pool is still empty, search broader trending and regional catalogs with higher pages
    if (freshPool.length === 0) {
      try {
        const randomPage = Math.floor(Math.random() * 6) + 4; // Pages 4 to 9
        const fallbackQueries = [
          musicApi.searchSongs('latest trending songs', randomPage, 20),
          musicApi.searchSongs('top hits billboard', randomPage, 20),
          musicApi.searchSongs(`${preferredLang} new hits`, randomPage, 20),
          musicApi.searchSongs('all time hits', randomPage, 20),
        ];

        const settled = await Promise.allSettled(fallbackQueries);
        const fallbackRaw: Song[] = [];

        settled.forEach((res) => {
          if (res.status === 'fulfilled' && res.value.results) {
            fallbackRaw.push(...res.value.results);
          }
        });

        const dedupedFallback = deduplicateSongs(fallbackRaw);

        for (const cand of dedupedFallback) {
          if (
            cand.id &&
            !this.isAlreadyPlayedOrSimilar(cand, history, seedSong) &&
            !isSameArtist(cand) &&
            !freshPool.some((p) => p.id === cand.id)
          ) {
            freshPool.push(cand);
          }
        }
      } catch (e) {
        console.warn('Broad fallback search failed:', e);
      }
    }

    // Tertiary deep fallback: deep pages 10+ to ensure infinite fresh discovery
    if (freshPool.length === 0) {
      try {
        const deepPage = Math.floor(Math.random() * 8) + 10;
        const deepRes = await musicApi.searchSongs('hits', deepPage, 20);
        const dedupedDeep = deduplicateSongs(deepRes.results || []);

        for (const cand of dedupedDeep) {
          if (
            cand.id &&
            !this.isAlreadyPlayedOrSimilar(cand, history, seedSong) &&
            !isSameArtist(cand) &&
            !freshPool.some((p) => p.id === cand.id)
          ) {
            freshPool.push(cand);
          }
        }
      } catch (e) {
        console.warn('Deep fallback search failed:', e);
      }
    }

    // Strictly DO NOT replay any already played song or similar song
    if (freshPool.length === 0) {
      return null;
    }

    // Score fresh candidates based on Genre/Mood similarity
    const scored = freshPool.map((candidate) => {
      const candGenre = inferSongGenre(candidate);
      let genreScore = 0.5;

      if (candGenre.toLowerCase() === seedGenre.toLowerCase()) {
        genreScore = 1.0;
      } else if (
        (seedGenre === 'Bollywood' && candGenre === 'Romance') ||
        (seedGenre === 'Romance' && candGenre === 'Bollywood') ||
        (seedGenre === 'Pop' && candGenre === 'Dance & EDM') ||
        (seedGenre === 'Dance & EDM' && candGenre === 'Pop')
      ) {
        genreScore = 0.8;
      }

      return {
        candidate,
        score: genreScore,
      };
    });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    // Randomized Mix Controller: Select among top 3 highest-scoring new tracks
    const topTier = scored.slice(0, Math.min(3, scored.length));
    const winningChoice = topTier[Math.floor(Math.random() * topTier.length)].candidate;

    // Permanently record the winning choice as played so it can never be repeated
    this.recordSessionPlay(winningChoice);

    return winningChoice;
  },

  /**
   * Generates Daily Mixes from Top Genres
   */
  async generateDailyMixes(topGenres: Array<{ genre: string; weight: number }>): Promise<DailyMix[]> {
    const genresToUse = (topGenres.length > 0 ? topGenres.slice(0, 3) : [
      { genre: 'Bollywood', weight: 1 },
      { genre: 'Pop', weight: 0.8 },
      { genre: 'Punjabi', weight: 0.6 },
    ]);

    const colors = [
      'from-rose-700 to-amber-900',
      'from-indigo-700 to-cyan-900',
      'from-emerald-700 to-teal-950',
    ];

    const mixPromises = genresToUse.map(async (gItem, idx) => {
      const genre = gItem.genre;
      try {
        const query = `${genre} top hits`;
        const res = await musicApi.searchSongs(query, 1, 15);
        const songs = res.results || [];
        const topArtistsList = Array.from(new Set(songs.map((s) => getArtistNames(s))))
          .slice(0, 3)
          .join(', ');

        return {
          id: `daily-mix-${idx + 1}`,
          title: `Daily Mix ${idx + 1}`,
          genre,
          color: colors[idx % colors.length],
          description: topArtistsList ? `${topArtistsList}, and more` : `Your personal ${genre} mix`,
          songs,
        };
      } catch (e) {
        return {
          id: `daily-mix-${idx + 1}`,
          title: `Daily Mix ${idx + 1}`,
          genre,
          color: colors[idx % colors.length],
          description: `Your custom ${genre} mix`,
          songs: [],
        };
      }
    });

    return Promise.all(mixPromises);
  },

  /**
   * Bubbles up unplayed songs in the user's high-interest categories
   */
  async getDiscoverNewReleases(
    topGenres: Array<{ genre: string; weight: number }>,
    history: PlaybackHistoryItem[]
  ): Promise<Song[]> {
    const playedIds = new Set(history.map((h) => h.id));
    const targetGenre = topGenres[0]?.genre || 'latest';

    try {
      const res = await musicApi.searchSongs(`${targetGenre} new latest`, 1, 15);
      const unplayed = (res.results || []).filter((s) => !playedIds.has(s.id));
      return unplayed.slice(0, 8);
    } catch (e) {
      return [];
    }
  },
};
