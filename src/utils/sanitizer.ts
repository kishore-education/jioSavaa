import { Album, Playlist, Song } from '../types';
import { decodeHtmlEntities, getArtistNames } from './formatters';

/**
 * Normalizes title/text for fuzzy duplicate detection.
 * Removes parenthetical suffixes like (From "..."), [From "..."], (Remix), punctuation, and lowercase.
 */
export function normalizeText(text?: string): string {
  if (!text) return '';
  return decodeHtmlEntities(text)
    .toLowerCase()
    // Remove (From "...") or [From "..."] or (Original Motion Picture Soundtrack) or (Lofi) or (Remix)
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    // Remove all non-alphanumeric characters except spaces
    .replace(/[^a-z0-9\s]/g, '')
    // Collapse multiple whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if two song titles are identical or substantially similar
 * (e.g. remix, reprise, acoustic, or minor spelling/version differences of the same song)
 */
export function isSimilarSongTitle(titleA?: string, titleB?: string): boolean {
  if (!titleA || !titleB) return false;
  const normA = normalizeText(titleA);
  const normB = normalizeText(titleB);
  if (!normA || !normB) return false;

  // Exact normalized match
  if (normA === normB) return true;

  const wordsA = normA.split(' ').filter((w) => w.length > 0);
  const wordsB = normB.split(' ').filter((w) => w.length > 0);
  if (wordsA.length === 0 || wordsB.length === 0) return false;

  // Check if one set of words is entirely contained in the other
  const isSubset = (smaller: string[], larger: string[]) => {
    return smaller.every((w) => larger.includes(w));
  };

  if (wordsA.length <= wordsB.length && isSubset(wordsA, wordsB)) {
    return true;
  }
  if (wordsB.length < wordsA.length && isSubset(wordsB, wordsA)) {
    return true;
  }

  // Check matching root words and significant token overlap for multi-word titles
  const commonWords = wordsA.filter((w) => wordsB.includes(w) && w.length > 2);
  const minWords = Math.min(wordsA.length, wordsB.length);
  if (minWords >= 2 && commonWords.length >= Math.ceil(minWords * 0.75)) {
    return true;
  }

  // Same first two words match for titles with 2+ words
  if (wordsA.length >= 2 && wordsB.length >= 2) {
    if (wordsA[0] === wordsB[0] && wordsA[1] === wordsB[1]) {
      return true;
    }
  }

  return false;
}

/**
 * Centralized Array Cleaning Utility
 * Purges duplicate track objects based on:
 * 1. Identical ID key
 * 2. Identical normalized title + matching primary artist
 */
export function deduplicateSongs(songs?: Song[]): Song[] {
  if (!songs || !Array.isArray(songs) || songs.length === 0) return [];

  const seenIds = new Set<string>();
  const seenSignatures = new Set<string>();
  const cleanedList: Song[] = [];

  for (const song of songs) {
    if (!song || !song.id) continue;

    // Constraint 1: Unique ID
    if (seenIds.has(song.id)) {
      continue;
    }

    // Constraint 2: Unique Title + Artist Signature
    const rawTitle = song.name || song.title || '';
    const normTitle = normalizeText(rawTitle);
    const normArtist = normalizeText(getArtistNames(song).split(',')[0]);
    const signature = `${normTitle}___${normArtist}`;

    if (normTitle && normArtist && seenSignatures.has(signature)) {
      continue;
    }

    seenIds.add(song.id);
    if (normTitle && normArtist) {
      seenSignatures.add(signature);
    }

    // Clean HTML entities on critical fields
    const sanitizedSong: Song = {
      ...song,
      name: decodeHtmlEntities(song.name || song.title),
      title: decodeHtmlEntities(song.title || song.name),
      primaryArtists: typeof song.primaryArtists === 'string' 
        ? decodeHtmlEntities(song.primaryArtists) 
        : song.primaryArtists,
      label: decodeHtmlEntities(song.label),
    };

    cleanedList.push(sanitizedSong);
  }

  return cleanedList;
}

/**
 * Purges duplicate albums based on ID and normalized title
 */
export function deduplicateAlbums(albums?: Album[]): Album[] {
  if (!albums || !Array.isArray(albums) || albums.length === 0) return [];

  const seenIds = new Set<string>();
  const seenSignatures = new Set<string>();
  const cleaned: Album[] = [];

  for (const album of albums) {
    if (!album || !album.id) continue;

    if (seenIds.has(album.id)) continue;

    const normName = normalizeText(album.name || album.title);
    const normArtist = normalizeText(getArtistNames(album).split(',')[0]);
    const signature = `${normName}___${normArtist}`;

    if (normName && seenSignatures.has(signature)) continue;

    seenIds.add(album.id);
    if (normName) seenSignatures.add(signature);

    cleaned.push({
      ...album,
      name: decodeHtmlEntities(album.name || album.title),
      title: decodeHtmlEntities(album.title || album.name),
      songs: album.songs ? deduplicateSongs(album.songs) : undefined,
    });
  }

  return cleaned;
}

/**
 * Purges duplicate playlists based on ID and normalized name
 */
export function deduplicatePlaylists(playlists?: Playlist[]): Playlist[] {
  if (!playlists || !Array.isArray(playlists) || playlists.length === 0) return [];

  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  const cleaned: Playlist[] = [];

  for (const pl of playlists) {
    if (!pl || !pl.id) continue;

    if (seenIds.has(pl.id)) continue;

    const normName = normalizeText(pl.name || pl.title);
    if (normName && seenNames.has(normName)) continue;

    seenIds.add(pl.id);
    if (normName) seenNames.add(normName);

    cleaned.push({
      ...pl,
      name: decodeHtmlEntities(pl.name || pl.title),
      title: decodeHtmlEntities(pl.title || pl.name),
      description: decodeHtmlEntities(pl.description),
      songs: pl.songs ? deduplicateSongs(pl.songs) : undefined,
    });
  }

  return cleaned;
}

