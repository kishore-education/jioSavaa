import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { Check, Globe, Sparkles, X } from 'lucide-react';

interface LanguagePreferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_LANGUAGES = [
  { id: 'Hindi', label: 'Hindi', script: 'हिंदी', desc: 'Bollywood & Hindi Pop', color: 'from-orange-600 to-amber-700' },
  { id: 'Punjabi', label: 'Punjabi', script: 'ਪੰਜਾਬੀ', desc: 'Bhangra, Hip-Hop & Pop', color: 'from-amber-600 to-yellow-600' },
  { id: 'English', label: 'English', script: 'English', desc: 'Global Pop, Billboard & EDM', color: 'from-blue-600 to-indigo-700' },
  { id: 'Tamil', label: 'Tamil', script: 'தமிழ்', desc: 'Kollywood & Anirudh hits', color: 'from-rose-600 to-red-700' },
  { id: 'Telugu', label: 'Telugu', script: 'తెలుగు', desc: 'Tollywood & Mass hits', color: 'from-purple-600 to-indigo-800' },
  { id: 'Malayalam', label: 'Malayalam', script: 'മലയാളം', desc: 'Mollywood & Indie Melodies', color: 'from-emerald-600 to-teal-700' },
  { id: 'Kannada', label: 'Kannada', script: 'ಕನ್ನಡ', desc: 'Sandalwood & Melodies', color: 'from-cyan-600 to-blue-700' },
  { id: 'Bengali', label: 'Bengali', script: 'বাংলা', desc: 'Rabindra Sangeet & Modern Pop', color: 'from-fuchsia-600 to-pink-700' },
  { id: 'Bhojpuri', label: 'Bhojpuri', script: 'भोजपुरी', desc: 'High Energy Dance & Folk', color: 'from-lime-600 to-emerald-700' },
  { id: 'Gujarati', label: 'Gujarati', script: 'ગુજરાતી', desc: 'Garba & Folk Melodies', color: 'from-amber-500 to-orange-600' },
  { id: 'Haryanvi', label: 'Haryanvi', script: 'हरियाणवी', desc: 'Desi Bass & Ragni Beats', color: 'from-teal-600 to-cyan-700' },
  { id: 'Lo-Fi Chill', label: 'Lo-Fi & Chill', script: 'Chill', desc: 'Late night focus & soft beats', color: 'from-violet-600 to-purple-800' },
  { id: 'Hip-Hop', label: 'Hip-Hop & Rap', script: 'Desi Hip-Hop', desc: 'Hard hitting beats & lyrics', color: 'from-zinc-700 to-neutral-900' },
  { id: 'Romance', label: 'Romance & Acoustic', script: 'Love Songs', desc: 'Soulful acoustic & love tracks', color: 'from-pink-600 to-rose-700' },
];

export const LanguagePreferenceModal: React.FC<LanguagePreferenceModalProps> = ({ isOpen, onClose }) => {
  const { languagePreferences, updateLanguagePreferences } = useLibrary();

  const [selected, setSelected] = useState<string[]>(() => {
    return languagePreferences.length > 0 ? languagePreferences : ['Hindi', 'English', 'Punjabi'];
  });

  if (!isOpen) return null;

  const toggleLanguage = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev; // Keep at least one selected
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleApply = () => {
    updateLanguagePreferences(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in select-none">
      <div 
        className="w-full max-w-3xl bg-[#181818] rounded-2xl border border-neutral-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1ed760]/10 text-[#1ed760] rounded-full text-xs font-bold">
              <Globe size={14} />
              <span>Music Preferences</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              What music do you love?
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400">
              Select your favorite languages to personalize your Home recommendations, Daily Mixes, and Auto-Play radio.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Language Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {AVAILABLE_LANGUAGES.map((item) => {
            const isSelected = selected.includes(item.id);

            return (
              <div
                key={item.id}
                onClick={() => toggleLanguage(item.id)}
                className={`relative p-3.5 rounded-xl cursor-pointer transition-all duration-200 border flex flex-col justify-between h-28 group ${
                  isSelected
                    ? 'border-[#1ed760] bg-white/10 shadow-lg scale-[1.02]'
                    : 'border-neutral-800 bg-[#222222] hover:bg-[#282828] hover:border-neutral-700'
                }`}
              >
                {/* Header text */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-base font-bold text-white block leading-tight">
                      {item.label}
                    </span>
                    <span className="text-xs text-neutral-400 font-medium">
                      {item.script}
                    </span>
                  </div>

                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${
                    isSelected 
                      ? 'bg-[#1ed760] border-[#1ed760] text-black' 
                      : 'border-neutral-600 text-transparent'
                  }`}>
                    <Check size={13} strokeWidth={3} />
                  </div>
                </div>

                {/* Subtitle / Desc */}
                <p className="text-[11px] text-neutral-400 line-clamp-1">
                  {item.desc}
                </p>

                {/* Bottom active indicator glow */}
                {isSelected && (
                  <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#1ed760] rounded-full" />
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-neutral-800 bg-neutral-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <Sparkles size={16} className="text-[#1ed760]" />
            <span>{selected.length} languages selected</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-neutral-400 hover:text-white transition"
            >
              Skip
            </button>

            <button
              onClick={handleApply}
              disabled={selected.length === 0}
              className="px-6 py-2.5 bg-[#1ed760] text-black font-extrabold text-sm rounded-full hover:scale-105 active:scale-95 transition shadow-lg disabled:opacity-50"
            >
              Apply & Start Listening
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

