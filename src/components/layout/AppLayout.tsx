import React, { useState, useRef } from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { useLibrary } from '../../context/LibraryContext';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';
import { AudioPlayer } from '../player/AudioPlayer';
import { MiniPlayer } from '../player/MiniPlayer';
import { QueueModal } from '../player/QueueModal';
import { AddToPlaylistModal } from '../common/AddToPlaylistModal';
import { LanguagePreferenceModal } from '../common/LanguagePreferenceModal';
import { HomePage } from '../../pages/HomePage';
import { SearchPage } from '../../pages/SearchPage';
import { LibraryPage } from '../../pages/LibraryPage';
import { LikedSongsPage } from '../../pages/LikedSongsPage';
import { PlaylistPage } from '../../pages/PlaylistPage';
import { AlbumPage } from '../../pages/AlbumPage';
import { ArtistPage } from '../../pages/ArtistPage';
import { Song } from '../../types';

export const AppLayout: React.FC = () => {
  const { currentPage } = useNavigation();
  const { isLanguageModalOpen, closeLanguageModal } = useLibrary();

  const [scrolled, setScrolled] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [playlistModalSong, setPlaylistModalSong] = useState<Song | null>(null);

  const mainScrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrolled(e.currentTarget.scrollTop > 40);
  };

  const handleOpenAddToPlaylist = (song: Song) => {
    setPlaylistModalSong(song);
  };

  const renderActivePage = () => {
    switch (currentPage.type) {
      case 'home':
        return <HomePage onOpenAddToPlaylist={handleOpenAddToPlaylist} />;
      case 'search':
        return (
          <SearchPage
            initialQuery={currentPage.initialQuery}
            onOpenAddToPlaylist={handleOpenAddToPlaylist}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        );
      case 'library':
        return <LibraryPage />;
      case 'liked-songs':
        return <LikedSongsPage onOpenAddToPlaylist={handleOpenAddToPlaylist} />;
      case 'playlist':
        return (
          <PlaylistPage
            id={currentPage.id}
            isCustom={currentPage.isCustom}
            onOpenAddToPlaylist={handleOpenAddToPlaylist}
          />
        );
      case 'album':
        return (
          <AlbumPage
            id={currentPage.id}
            onOpenAddToPlaylist={handleOpenAddToPlaylist}
          />
        );
      case 'artist':
        return (
          <ArtistPage
            id={currentPage.id}
            onOpenAddToPlaylist={handleOpenAddToPlaylist}
          />
        );
      default:
        return <HomePage onOpenAddToPlaylist={handleOpenAddToPlaylist} />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-black text-white overflow-hidden font-sans select-none">
      {/* Upper Area: Sidebar + Main Content */}
      <div className="flex flex-1 min-h-0 overflow-hidden p-0 md:p-2 md:gap-2">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content Pane */}
        <div 
          ref={mainScrollRef}
          onScroll={handleScroll}
          className="flex-1 bg-[#121212] md:rounded-lg overflow-y-auto overflow-x-hidden relative flex flex-col scrollbar-thin scrollbar-thumb-neutral-700"
        >
          {/* Top Navbar */}
          <TopNav
            scrolled={scrolled}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* Active Page Component */}
          <main className="flex-1">
            {renderActivePage()}
          </main>
        </div>
      </div>

      {/* Floating Overlays */}
      <MiniPlayer />
      <QueueModal />
      <AddToPlaylistModal
        song={playlistModalSong}
        isOpen={!!playlistModalSong}
        onClose={() => setPlaylistModalSong(null)}
      />
      <LanguagePreferenceModal
        isOpen={isLanguageModalOpen}
        onClose={closeLanguageModal}
      />

      {/* Persistent Audio Player Footer Bar */}
      <AudioPlayer />

      {/* Mobile Bottom Navigation Dock */}
      <BottomNav />
    </div>
  );
};
