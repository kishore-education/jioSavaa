import { DownloadUrlAsset, ImageAsset, Song } from '../types';

/**
 * Decodes HTML entities (e.g. &amp;, &quot;, &#039;) frequently returned by music APIs.
 */
export function decodeHtmlEntities(str?: string): string {
  if (!str) return '';
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  return txt.value;
}

/**
 * Extracts the highest quality streaming audio URL from downloadUrl array or string
 */
export function getBestAudioUrl(downloadUrl?: DownloadUrlAsset[] | string): string {
  if (!downloadUrl) return '';
  if (typeof downloadUrl === 'string') return downloadUrl;
  if (!Array.isArray(downloadUrl) || downloadUrl.length === 0) return '';

  // Order of preference: 320kbps -> 160kbps -> 96kbps -> 48kbps -> 12kbps -> last item
  const preference = ['320kbps', '160kbps', '96kbps', '48kbps', '12kbps'];
  for (const quality of preference) {
    const match = downloadUrl.find((item) => item.quality === quality && item.url);
    if (match) return match.url;
  }

  // Fallback to highest available or last item
  const valid = downloadUrl.filter((item) => item.url);
  if (valid.length > 0) {
    return valid[valid.length - 1].url;
  }
  return '';
}

/**
 * Extracts highest resolution image URL from image array or string
 */
export function getBestImageUrl(image?: ImageAsset[] | string, fallbackText = 'Spotify'): string {
  if (!image) return `https://placehold.co/500x500/181818/ffffff?text=${encodeURIComponent(fallbackText)}`;
  if (typeof image === 'string') return image;
  if (!Array.isArray(image) || image.length === 0) {
    return `https://placehold.co/500x500/181818/ffffff?text=${encodeURIComponent(fallbackText)}`;
  }

  // Look for 500x500 first, then 150x150, 50x50, or the last item
  const match500 = image.find((img) => img.quality === '500x500' && img.url);
  if (match500) return match500.url;

  const match150 = image.find((img) => img.quality === '150x150' && img.url);
  if (match150) return match150.url;

  const valid = image.filter((img) => img.url);
  if (valid.length > 0) {
    return valid[valid.length - 1].url;
  }
  return `https://placehold.co/500x500/181818/ffffff?text=${encodeURIComponent(fallbackText)}`;
}

/**
 * Formats duration in seconds to "m:ss" format (e.g. 215 -> "3:35")
 */
export function formatDuration(duration?: number | string): string {
  if (duration === undefined || duration === null || duration === '') return '0:00';
  const totalSeconds = typeof duration === 'number' ? Math.floor(duration) : parseInt(duration, 10);
  if (isNaN(totalSeconds) || totalSeconds < 0) return '0:00';

  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Formats total duration for album / playlist header (e.g. "1 hr 15 min" or "45 min")
 */
export function formatTotalDuration(songs?: Song[]): string {
  if (!songs || songs.length === 0) return '0 min';
  const totalSeconds = songs.reduce((acc, song) => {
    const sec = typeof song.duration === 'number' ? song.duration : parseInt(song.duration || '0', 10);
    return acc + (isNaN(sec) ? 0 : sec);
  }, 0);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} hr ${minutes} min`;
  }
  return `${minutes} min`;
}

/**
 * Formats artist names from song/album object
 */
export function getArtistNames(item?: {
  primaryArtists?: any;
  featuredArtists?: any;
  singers?: string;
  artists?: {
    primary?: Array<{ name: string; id?: string }>;
    all?: Array<{ name: string; id?: string }>;
  };
}): string {
  if (!item) return 'Various Artists';

  // If artists.primary array is provided
  if (item.artists?.primary && item.artists.primary.length > 0) {
    return item.artists.primary.map((a) => decodeHtmlEntities(a.name)).join(', ');
  }

  // If primaryArtists is string
  if (typeof item.primaryArtists === 'string' && item.primaryArtists.trim()) {
    return decodeHtmlEntities(item.primaryArtists);
  }

  // If primaryArtists is array
  if (Array.isArray(item.primaryArtists) && item.primaryArtists.length > 0) {
    return item.primaryArtists.map((a) => (typeof a === 'string' ? a : decodeHtmlEntities(a.name))).join(', ');
  }

  // If singers string is provided
  if (item.singers && item.singers.trim()) {
    return decodeHtmlEntities(item.singers);
  }

  // Fallback to artists.all
  if (item.artists?.all && item.artists.all.length > 0) {
    return item.artists.all.map((a) => decodeHtmlEntities(a.name)).slice(0, 3).join(', ');
  }

  return 'Unknown Artist';
}

/**
 * Returns dynamic greeting based on current local hour
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

