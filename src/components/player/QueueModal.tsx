import React from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { X, Play, Music } from 'lucide-react';
import { decodeHtmlEntities, formatDuration, getArtistNames, getBestImageUrl } from '../../utils/formatters';

export const QueueModal: React.FC = () => {
  const { 
    isQueueOpen, 
    toggleQueue, 
    currentSong, 
    queue, 
    queueIndex, 
    playQueueAtIndex 
  } = usePlayer();

  if (!isQueueOpen) return null;

  const upcomingSongs = queue.slice(queueIndex + 1);

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-[#181818] border-l border-neutral-800 shadow-2xl flex flex-col animate-fade-in select-none">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-800">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Music size={18} className="text-[#1ed760]" />
          Queue
        </h2>
        <button
          onClick={toggleQueue}
          className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Now Playing */}
        {currentSong && (
          <div>
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Now Playing
            </h3>
            <div className="flex items-center gap-3 p-2 rounded-lg bg-neutral-800/60 border border-neutral-700/60">
              <img
                src={getBestImageUrl(currentSong.image, currentSong.name)}
                alt={currentSong.name}
                className="w-12 h-12 rounded object-cover flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#1ed760] truncate">
                  {decodeHtmlEntities(currentSong.name || currentSong.title)}
                </p>
                <p className="text-xs text-neutral-400 truncate">
                  {getArtistNames(currentSong)}
                </p>
              </div>
              <span className="text-xs font-mono text-neutral-400 mr-1">
                {formatDuration(currentSong.duration)}
              </span>
            </div>
          </div>
        )}

        {/* Next in Queue */}
        <div>
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
            Next In Queue ({upcomingSongs.length})
          </h3>

          {upcomingSongs.length === 0 ? (
            <div className="py-6 px-3 bg-[#202020] rounded-xl border border-neutral-800 text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1ed760]/10 text-[#1ed760] rounded-full text-xs font-bold">
                <Music size={14} />
                <span>Endless Smart Radio</span>
              </div>
              <p className="text-xs text-neutral-300 font-medium">
                Tailored Auto-Play will dynamically score and queue the next matching track when this song finishes.
              </p>
              <p className="text-[11px] text-neutral-500">
                Match Score = (Genre × 0.6) + (Artist × 0.4) with fatigue prevention.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {upcomingSongs.map((song, idx) => {
                const targetIndex = queueIndex + 1 + idx;
                const title = decodeHtmlEntities(song.name || song.title);
                const artists = getArtistNames(song);
                const img = getBestImageUrl(song.image, title);

                return (
                  <div
                    key={`${song.id}-${idx}`}
                    onClick={() => playQueueAtIndex(targetIndex)}
                    className="group flex items-center justify-between p-2 rounded hover:bg-neutral-800/80 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-neutral-800">
                        <img
                          src={img}
                          alt={title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <Play size={14} fill="white" className="text-white ml-0.5" />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate group-hover:text-[#1ed760] transition">
                          {title}
                        </p>
                        <p className="text-xs text-neutral-400 truncate">
                          {artists}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-mono text-neutral-400 ml-2">
                      {formatDuration(song.duration)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

