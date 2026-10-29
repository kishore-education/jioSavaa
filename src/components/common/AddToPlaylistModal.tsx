import React, { useState } from 'react';
import { Song } from '../../types';
import { useLibrary } from '../../context/LibraryContext';
import { Plus, Check, X, Music } from 'lucide-react';
import { getBestImageUrl } from '../../utils/formatters';

interface AddToPlaylistModalProps {
  song: Song | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({ song, isOpen, onClose }) => {
  const { customPlaylists, addSongToPlaylist, removeSongFromPlaylist, createPlaylist } = useLibrary();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen || !song) return null;

  const handleToggle = (playlistId: string, isAlreadyIn: boolean) => {
    if (isAlreadyIn) {
      removeSongFromPlaylist(playlistId, song.id);
    } else {
      addSongToPlaylist(playlistId, song);
    }
  };

  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const pl = createPlaylist(newPlaylistName.trim());
    addSongToPlaylist(pl.id, song);
    setNewPlaylistName('');
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div 
        className="w-full max-w-md bg-[#242424] rounded-xl border border-[#333333] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#333333]">
          <div>
            <h2 className="text-xl font-bold text-white">Add to playlist</h2>
            <p className="text-xs text-neutral-400 mt-1 line-clamp-1">
              {song.name || song.title}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Playlist List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {/* Create new option */}
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#2a2a2a] text-neutral-300 hover:text-white transition group border border-dashed border-neutral-700 hover:border-neutral-500"
            >
              <div className="w-10 h-10 rounded bg-[#333333] group-hover:bg-[#1ed760] group-hover:text-black flex items-center justify-center text-white transition">
                <Plus size={20} />
              </div>
              <span className="font-semibold text-sm">New playlist</span>
            </button>
          ) : (
            <form onSubmit={handleCreateAndAdd} className="p-3 bg-[#1e1e1e] rounded-lg border border-neutral-700 mb-2">
              <label className="text-xs font-semibold text-neutral-300 mb-1.5 block">
                Playlist Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  placeholder="My awesome playlist"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="flex-1 bg-[#2b2b2b] text-white px-3 py-2 rounded text-sm focus:outline-none focus:ring-1 focus:ring-white border border-neutral-700"
                />
                <button
                  type="submit"
                  disabled={!newPlaylistName.trim()}
                  className="px-4 py-2 bg-[#1ed760] disabled:opacity-50 text-black font-semibold text-sm rounded hover:scale-105 active:scale-95 transition"
                >
                  Create
                </button>
              </div>
            </form>
          )}

          {/* Existing Custom Playlists */}
          {customPlaylists.length === 0 && !isCreating && (
            <div className="text-center py-6 text-neutral-400 text-sm">
              <Music className="mx-auto mb-2 opacity-50" size={32} />
              No playlists found. Create your first one above!
            </div>
          )}

          {customPlaylists.map((pl) => {
            const isAlreadyIn = (pl.songs || []).some((s) => s.id === song.id);
            const coverUrl = getBestImageUrl(pl.image, pl.name);

            return (
              <div
                key={pl.id}
                onClick={() => handleToggle(pl.id, isAlreadyIn)}
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#2e2e2e] cursor-pointer transition select-none group"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <img
                    src={coverUrl}
                    alt={pl.name}
                    className="w-11 h-11 rounded object-cover flex-shrink-0 bg-neutral-800"
                  />
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-white truncate">{pl.name}</p>
                    <p className="text-xs text-neutral-400">
                      {pl.songs?.length || 0} songs
                    </p>
                  </div>
                </div>

                <div className={`w-7 h-7 rounded-full flex items-center justify-center border transition ${
                  isAlreadyIn 
                    ? 'bg-[#1ed760] border-[#1ed760] text-black' 
                    : 'border-neutral-600 group-hover:border-white text-transparent'
                }`}>
                  <Check size={16} strokeWidth={3} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#333333] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white text-black font-semibold text-sm rounded-full hover:scale-105 transition active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

