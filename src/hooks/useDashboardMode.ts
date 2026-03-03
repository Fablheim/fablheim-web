import { useLocation } from 'react-router-dom';

export function useDashboardMode() {
  const location = useLocation();

  const isSession =
    /\/campaigns\/[^/]+\/session$/.test(location.pathname);

  return {
    isDashboard: !isSession,
    isSession,
  } as const;
}
