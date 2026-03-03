import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

const PanelContext = createContext(false);

export function PanelProvider({ children }: { children: ReactNode }) {
  return <PanelContext value={true}>{children}</PanelContext>;
}

export function useIsInsidePanel(): boolean {
  return useContext(PanelContext);
}
