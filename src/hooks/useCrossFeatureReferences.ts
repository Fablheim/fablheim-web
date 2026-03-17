import { useMemo } from 'react';
import { useSessions } from './useSessions';
import { useEncounters } from './useEncounters';
import { useArcs, useCampaign } from './useCampaigns';
import { useDowntimeActivities } from './useDowntime';
import { useHandouts } from './useHandouts';
import type { Session, CampaignArc, CalendarEvent, Handout } from '@/types/campaign';
import type { Encounter } from '@/types/encounter';
import type { DowntimeActivity } from '@/types/downtime';

export interface CrossFeatureRef {
  id: string;
  name: string;
  detail?: string;
}

export interface CrossFeatureGroup {
  key: string;
  label: string;
  icon: string;
  items: CrossFeatureRef[];
}

export function useCrossFeatureReferences(campaignId: string, entityId: string) {
  const { data: sessions } = useSessions(campaignId);
  const { data: encounters } = useEncounters(campaignId);
  const { data: arcs } = useArcs(campaignId);
  const { data: campaign } = useCampaign(campaignId);
  const { data: downtimeActivities } = useDowntimeActivities(campaignId);
  const { data: handouts } = useHandouts(campaignId);

  const groups = useMemo(() => {
    const result: CrossFeatureGroup[] = [];

    // Sessions: check npcIds, locationIds, questIds
    if (sessions) {
      const matched: CrossFeatureRef[] = [];
      for (const session of sessions as Session[]) {
        const referenced =
          session.npcIds?.includes(entityId) ||
          session.locationIds?.includes(entityId) ||
          session.questIds?.includes(entityId);
        if (referenced) {
          matched.push({
            id: session._id,
            name: session.title || `Session ${session.sessionNumber}`,
            detail: session.status,
          });
        }
      }
      if (matched.length > 0) {
        result.push({ key: 'sessions', label: 'Sessions', icon: 'scroll', items: matched });
      }
    }

    // Encounters: check locationEntityId and participant entityId
    if (encounters) {
      const matched: CrossFeatureRef[] = [];
      for (const encounter of encounters as Encounter[]) {
        const locationMatch = encounter.locationEntityId === entityId;
        const participantMatch = encounter.participants?.some(
          (p) => p.entityId === entityId,
        );
        if (locationMatch || participantMatch) {
          matched.push({
            id: encounter._id,
            name: encounter.name,
            detail: encounter.difficulty,
          });
        }
      }
      if (matched.length > 0) {
        result.push({ key: 'encounters', label: 'Encounters', icon: 'swords', items: matched });
      }
    }

    // Story Arcs: check links.entityIds and development linkedEntityIds
    if (arcs) {
      const matched: CrossFeatureRef[] = [];
      for (const arc of arcs as CampaignArc[]) {
        const linkMatch = arc.links?.entityIds?.includes(entityId);
        const devMatch = arc.developments?.some(
          (d) => d.linkedEntityIds?.includes(entityId),
        );
        if (linkMatch || devMatch) {
          matched.push({
            id: arc._id,
            name: arc.name,
            detail: arc.status,
          });
        }
      }
      if (matched.length > 0) {
        result.push({ key: 'arcs', label: 'Story Arcs', icon: 'book-open', items: matched });
      }
    }

    // Calendar Events: check entityId
    if (campaign?.calendar?.events) {
      const matched: CrossFeatureRef[] = [];
      for (const event of campaign.calendar.events as CalendarEvent[]) {
        if (event.entityId === entityId) {
          matched.push({
            id: event.id,
            name: event.name,
            detail: event.eventType,
          });
        }
      }
      if (matched.length > 0) {
        result.push({ key: 'events', label: 'Calendar Events', icon: 'calendar', items: matched });
      }
    }

    // Downtime: check links.locationId, npcId, factionId, questId
    if (downtimeActivities) {
      const matched: CrossFeatureRef[] = [];
      for (const activity of downtimeActivities as DowntimeActivity[]) {
        const linkMatch =
          activity.links?.locationId === entityId ||
          activity.links?.npcId === entityId ||
          activity.links?.factionId === entityId ||
          activity.links?.questId === entityId;
        if (linkMatch) {
          matched.push({
            id: activity._id,
            name: activity.name,
            detail: activity.status,
          });
        }
      }
      if (matched.length > 0) {
        result.push({ key: 'downtime', label: 'Downtime', icon: 'moon', items: matched });
      }
    }

    // Handouts: check linkedEntityIds
    if (handouts) {
      const matched: CrossFeatureRef[] = [];
      for (const handout of handouts as Handout[]) {
        if (handout.linkedEntityIds?.includes(entityId)) {
          matched.push({
            id: handout._id,
            name: handout.title,
            detail: handout.type,
          });
        }
      }
      if (matched.length > 0) {
        result.push({ key: 'handouts', label: 'Handouts', icon: 'file-text', items: matched });
      }
    }

    return result;
  }, [sessions, encounters, arcs, campaign, downtimeActivities, handouts, entityId]);

  const totalCount = useMemo(
    () => groups.reduce((sum, g) => sum + g.items.length, 0),
    [groups],
  );

  return { groups, totalCount };
}
