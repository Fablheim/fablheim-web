import { useCallback } from 'react';
import { useNavigate as useRouterNavigate } from 'react-router-dom';

export function useNavigation() {
  const navigate = useRouterNavigate();

  const goBack = useCallback(() => navigate(-1), [navigate]);
  const goHome = useCallback(() => navigate('/app'), [navigate]);

  return { navigate, goBack, goHome };
}
