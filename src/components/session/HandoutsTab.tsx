import { HandoutsArchiveV2 } from '@/components/v2/handouts/HandoutsArchiveV2';

interface HandoutsTabProps {
  campaignId: string;
  isDM: boolean;
}

export function HandoutsTab({ campaignId, isDM }: HandoutsTabProps) {
  return <HandoutsArchiveV2 campaignId={campaignId} isDM={isDM} />;
}
