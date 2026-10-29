import React from 'react';
import { NavigationProvider } from './context/NavigationContext';
import { LibraryProvider } from './context/LibraryContext';
import { PlayerProvider } from './context/PlayerContext';
import { AppLayout } from './components/layout/AppLayout';

export const App: React.FC = () => {
  return (
    <NavigationProvider>
      <LibraryProvider>
        <PlayerProvider>
          <AppLayout />
        </PlayerProvider>
      </LibraryProvider>
    </NavigationProvider>
  );
};

export default App;

