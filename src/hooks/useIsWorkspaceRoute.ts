import { useLocation } from 'react-router-dom';

/**
 * Returns true when the current route is a campaign workspace
 * (e.g. /campaigns/abc123) but NOT a session route (/live, /play).
 */
export function useIsWorkspaceRoute(): boolean {
  const { pathname } = useLocation();
  return /^\/campaigns\/[a-f0-9]+$/.test(pathname);
}
