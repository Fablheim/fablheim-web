import { useEffect, useRef, useState } from 'react';
import { useCampaign } from '@/hooks/useCampaigns';

/**
 * Detects when a live session ends (stage transitions from 'live' to non-live)
 * and manages a 10-second countdown. The consuming component handles redirect.
 */
export function useSessionLifecycle(campaignId: string) {
  const { data: campaign } = useCampaign(campaignId);
  const [sessionEndedCountdown, setSessionEndedCountdown] = useState<number | null>(null);
  const prevStageRef = useRef(campaign?.stage);

  // Detect stage transition: live → non-live
  useEffect(() => {
    const prev = prevStageRef.current;
    prevStageRef.current = campaign?.stage;
    if (prev === 'live' && campaign?.stage && campaign.stage !== 'live') {
      setSessionEndedCountdown(10);
    }
  }, [campaign?.stage]);

  // Tick countdown
  useEffect(() => {
    if (sessionEndedCountdown === null || sessionEndedCountdown <= 0) return;
    const timer = setTimeout(() => {
      setSessionEndedCountdown((v) => (v !== null ? v - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [sessionEndedCountdown]);

  return {
    sessionEndedCountdown,
    isSessionEnded: sessionEndedCountdown !== null,
    shouldRedirect: sessionEndedCountdown === 0,
  };
}
