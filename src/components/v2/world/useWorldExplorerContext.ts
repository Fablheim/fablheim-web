import { useContext } from 'react';
import { WorldExplorerContext } from './WorldExplorerContext';

export function useWorldExplorerContext() {
  const context = useContext(WorldExplorerContext);
  if (!context) {
    throw new Error('useWorldExplorerContext must be used within WorldExplorerProvider');
  }
  return context;
}
