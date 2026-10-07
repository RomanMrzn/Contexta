import React, { createContext, useContext } from 'react';
import { PlatformAdapter } from '@openanything/platform';

const PlatformContext = createContext<PlatformAdapter | null>(null);

export function PlatformProvider({ adapter, children }: { adapter: PlatformAdapter, children: React.ReactNode }) {
  return (
    <PlatformContext.Provider value={adapter}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return context;
}
