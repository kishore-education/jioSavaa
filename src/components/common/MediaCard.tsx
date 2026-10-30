import React from 'react';
import { Play, Pause } from 'lucide-react';
import { Album, Artist, Playlist, Song } from '../../types';
import { decodeHtmlEntities, getArtistNames, getBestImageUrl } from '../../utils/formatters';
import { usePlayer } from '../../context/PlayerContext';
import { useNavigation } from '../../context/NavigationContext';
import { musicApi } from '../../services/api';

type MediaItem = 
  | { type: 'song'; data: Song }
  | { type: 'album'; data: Album }
  | { type: 'artist'; data: Artist }
  | { type: 'playlist'; data: Playlist };

interface MediaCardProps {
  item: MediaItem;
}

export const MediaCard: React.FC<MediaCardProps> = ({ item }) => {
  const { currentSong, isPlaying, playSong, togglePlayPause } = usePlayer();
  const { navigateAlbum, navigateArtist, navigatePlaylist } = useNavigation();

  // Extract metadata based on item type
  let id = '';
  let title = '';
  let subtitle = '';
  let imageUrl = '';
  let isArtist = false;
  let isCurrentItemPlaying = false;

  if (item.type === 'song') {
    const s = item.data;
    id = s.id;
    title = decodeHtmlEntities(s.name || s.title || 'Unknown Song');
    subtitle = getArtistNames(s);
    imageUrl = getBestImageUrl(s.image, title);
    isCurrentItemPlaying = currentSong?.id === s.id && isPlaying;
  } else if (item.type === 'album') {
    const a = item.data;
    id = a.id;
    title = decodeHtmlEntities(a.name || a.title || 'Unknown Album');
    subtitle = `Album • ${getArtistNames(a)}`;
    imageUrl = getBestImageUrl(a.image, title);
  } else if (item.type === 'artist') {
    const ar = item.data;
    id = ar.id;
    title = decodeHtmlEntities(ar.name || ar.title || 'Artist');
    subtitle = 'Artist';
    imageUrl = getBestImageUrl(ar.image, title);
    isArtist = true;
  } else if (item.type === 'playlist') {
    const p = item.data;
    id = p.id;
    title = decodeHtmlEntities(p.name || p.title || 'Playlist');
    subtitle = p.description ? decodeHtmlEntities(p.description) : 'Playlist';
    imageUrl = getBestImageUrl(p.image, title);
  }

  const handleCardClick = () => {
    if (item.type === 'song') {
      playSong(item.data);
    } else if (item.type === 'album') {
      navigateAlbum(id);
    } else if (item.type === 'artist') {
      navigateArtist(id);
    } else if (item.type === 'playlist') {
      navigatePlaylist(id, (item.data as Playlist).isCustom);
    }
  };

  const handlePlayButtonClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (item.type === 'song') {
      if (currentSong?.id === id) {
        togglePlayPause();
      } else {
        playSong(item.data);
      }
      return;
    }

    if (item.type === 'album') {
      try {
        const fullAlbum = await musicApi.getAlbumById(id);
        if (fullAlbum.songs && fullAlbum.songs.length > 0) {
          playSong(fullAlbum.songs[0], fullAlbum.songs, 0);
        }
      } catch (err) {
        console.error('Failed to play album:', err);
      }
      return;
    }

    if (item.type === 'playlist') {
      const pl = item.data as Playlist;
      if (pl.isCustom && pl.songs && pl.songs.length > 0) {
        playSong(pl.songs[0], pl.songs, 0);
      } else {
        try {
          const fullPl = await musicApi.getPlaylistById(id);
          if (fullPl.songs && fullPl.songs.length > 0) {
            playSong(fullPl.songs[0], fullPl.songs, 0);
          }
        } catch (err) {
          console.error('Failed to play playlist:', err);
        }
      }
      return;
    }

    if (item.type === 'artist') {
      try {
        const fullArtist = await musicApi.getArtistById(id);
        if (fullArtist.topSongs && fullArtist.topSongs.length > 0) {
          playSong(fullArtist.topSongs[0], fullArtist.topSongs, 0);
        }
      } catch (err) {
        console.error('Failed to play artist:', err);
      }
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-[#181818] hover:bg-[#282828] p-3.5 rounded-lg transition-all duration-300 cursor-pointer flex flex-col justify-between select-none shadow-md hover:shadow-xl"
    >
      {/* Artwork container */}
      <div className="relative w-full aspect-square mb-3 overflow-hidden rounded-md bg-neutral-900 shadow-md">
        <img
          src={imageUrl}
          alt={title}
          loading="lazy"
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            isArtist ? 'rounded-full' : 'rounded-md'
          }`}
        />

        {/* Floating Green Play Button with Slide-Up Hover Effect */}
        <button
          onClick={handlePlayButtonClick}
          className={`absolute bottom-2 right-2 w-11 h-11 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${
            isCurrentItemPlaying
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
          }`}
          title={isCurrentItemPlaying ? 'Pause' : 'Play'}
        >
          {isCurrentItemPlaying ? (
            <Pause size={20} fill="black" />
          ) : (
            <Play size={20} fill="black" className="ml-0.5" />
          )}
        </button>
      </div>

      {/* Info texts */}
      <div className="flex flex-col min-h-[48px]">
        <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-white transition leading-snug" title={title}>
          {title}
        </h3>
        <p className="text-xs text-neutral-400 line-clamp-2 mt-1 leading-relaxed" title={subtitle}>
          {subtitle}
        </p>
      </div>
    </div>
  );
};

