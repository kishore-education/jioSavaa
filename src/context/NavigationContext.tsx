import React, { createContext, useContext, useState, useCallback } from 'react';
import { ActivePage } from '../types';

interface NavigationContextType {
  currentPage: ActivePage;
  history: ActivePage[];
  historyIndex: number;
  canGoBack: boolean;
  canGoForward: boolean;
  navigateTo: (page: ActivePage) => void;
  goBack: () => void;
  goForward: () => void;
  navigateHome: () => void;
  navigateSearch: (initialQuery?: string) => void;
  navigateLibrary: () => void;
  navigateLikedSongs: () => void;
  navigatePlaylist: (id: string, isCustom?: boolean) => void;
  navigateAlbum: (id: string) => void;
  navigateArtist: (id: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<ActivePage[]>([{ type: 'home' }]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const currentPage = history[historyIndex] || { type: 'home' };
  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  const navigateTo = useCallback((page: ActivePage) => {
    setHistory((prev) => {
      // Slice off any forward history if we are in the middle of history
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, page];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const goBack = useCallback(() => {
    if (canGoBack) {
      setHistoryIndex((prev) => prev - 1);
    }
  }, [canGoBack]);

  const goForward = useCallback(() => {
    if (canGoForward) {
      setHistoryIndex((prev) => prev + 1);
    }
  }, [canGoForward]);

  const navigateHome = () => navigateTo({ type: 'home' });
  const navigateSearch = (initialQuery?: string) => navigateTo({ type: 'search', initialQuery });
  const navigateLibrary = () => navigateTo({ type: 'library' });
  const navigateLikedSongs = () => navigateTo({ type: 'liked-songs' });
  const navigatePlaylist = (id: string, isCustom?: boolean) => navigateTo({ type: 'playlist', id, isCustom });
  const navigateAlbum = (id: string) => navigateTo({ type: 'album', id });
  const navigateArtist = (id: string) => navigateTo({ type: 'artist', id });

  return (
    <NavigationContext.Provider
      value={{
        currentPage,
        history,
        historyIndex,
        canGoBack,
        canGoForward,
        navigateTo,
        goBack,
        goForward,
        navigateHome,
        navigateSearch,
        navigateLibrary,
        navigateLikedSongs,
        navigatePlaylist,
        navigateAlbum,
        navigateArtist,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

