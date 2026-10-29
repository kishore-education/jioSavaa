import React, { useState } from 'react';
import { Playlist } from '../../types';
import { useLibrary } from '../../context/LibraryContext';
import { X, Image as ImageIcon } from 'lucide-react';
import { getBestImageUrl } from '../../utils/formatters';

interface EditPlaylistModalProps {
  playlist: Playlist;
  isOpen: boolean;
  onClose: () => void;
}

export const EditPlaylistModal: React.FC<EditPlaylistModalProps> = ({ playlist, isOpen, onClose }) => {
  const { updatePlaylist } = useLibrary();
  const [name, setName] = useState(playlist.name);
  const [description, setDescription] = useState(playlist.description || '');
  const [image, setImage] = useState(typeof playlist.image === 'string' ? playlist.image : '');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePlaylist(playlist.id, {
      name: name.trim() || 'My Playlist',
      description: description.trim(),
      image: image.trim() || getBestImageUrl(playlist.image),
    });
    onClose();
  };

  const previewImage = image.trim() || getBestImageUrl(playlist.image, playlist.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div 
        className="w-full max-w-lg bg-[#282828] rounded-xl border border-neutral-700 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-neutral-700">
          <h2 className="text-xl font-bold text-white">Edit details</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Cover art preview & url */}
            <div className="flex flex-col items-center">
              <div className="w-36 h-36 rounded shadow-lg overflow-hidden bg-neutral-900 border border-neutral-700 relative group">
                <img
                  src={previewImage}
                  alt="Playlist Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[11px] text-neutral-400 mt-2 text-center">
                Paste image URL below to update
              </span>
            </div>

            {/* Form Fields */}
            <div className="sm:col-span-2 space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#3e3e3e] text-white px-3 py-2 rounded text-sm focus:outline-none focus:ring-1 focus:ring-white border border-neutral-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Cover Image URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    placeholder="https://..."
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full bg-[#3e3e3e] text-white pl-8 pr-3 py-2 rounded text-xs focus:outline-none focus:ring-1 focus:ring-white border border-neutral-600 truncate"
                  />
                  <ImageIcon size={14} className="absolute left-2.5 top-2.5 text-neutral-400" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add an optional description"
                  className="w-full bg-[#3e3e3e] text-white px-3 py-2 rounded text-sm focus:outline-none focus:ring-1 focus:ring-white border border-neutral-600 resize-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end items-center gap-3 pt-3 border-t border-neutral-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-neutral-300 hover:text-white hover:underline transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-white text-black font-bold text-sm rounded-full hover:scale-105 active:scale-95 transition"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

