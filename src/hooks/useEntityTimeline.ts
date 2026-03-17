import { useMemo } from 'react';
import type { CampaignArc, Session } from '@/types/campaign';
import type { Encounter } from '@/types/encounter';
import { useSessions } from './useSessions';
import { useEncounters } from './useEncounters';
import { useArcs } from './useCampaigns';
import { sessionMentionsEntity, extractSessionMoment } from '@/lib/session-utils';
import { useWorldEntities } from './useWorldEntities';

// ── Types ────────────────────────────────────────────────────────────────────

export type TimelineSourceType =
  | 'session'
  | 'encounter'
  | 'arc_development'
  | 'discovery'
  | 'secret_reveal'
  | 'objective_complete'
  | 'reputation_change';

export interface TimelineEntry {
  sourceType: TimelineSourceType;
  sourceId: string;
  label: string;
  excerpt: string;
  sortKey: number;
  sessionNumber?: number;
}

export interface EntityTimeline {
  entries: TimelineEntry[];
  totalCount: number;
}

const EMPTY: EntityTimeline = { entries: [], totalCount: 0 };
const MAX_ENTRIES = 20;

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useEntityTimeline(campaignId: string, entityId: string): EntityTimeline {
  const { data: sessionsData } = useSessions(campaignId);
  const { data: encountersData } = useEncounters(campaignId);
  const { data: arcsData } = useArcs(campaignId);
  const { data: entitiesData } = useWorldEntities(campaignId);

  return useMemo(() => {
    if (!entityId) return EMPTY;

    const entity = (entitiesData ?? []).find((e) => e._id === entityId);
    const entries: TimelineEntry[] = [];

    // ── Sessions: explicit ID match OR name mention ──
    if (sessionsData) {
      for (const session of sessionsData as Session[]) {
        const idMatch =
          session.npcIds?.includes(entityId) ||
          session.locationIds?.includes(entityId) ||
          session.questIds?.includes(entityId);
        const nameMatch = entity ? sessionMentionsEntity(session, entity) : false;

        if (idMatch || nameMatch) {
          entries.push({
            sourceType: 'session',
            sourceId: session._id,
            label: `Session ${session.sessionNumber}${session.title ? ` — ${session.title}` : ''}`,
            excerpt: truncate(extractSessionMoment(session), 100),
            sortKey: toUnixSeconds(session.completedAt ?? session.startedAt ?? session.scheduledDate ?? session.createdAt),
            sessionNumber: session.sessionNumber,
          });
        }
      }
    }

    // ── Encounters: location or participant match ──
    if (encountersData) {
      for (const encounter of encountersData as Encounter[]) {
        const locationMatch = encounter.locationEntityId === entityId;
        const participantMatch = encounter.participants?.some(
          (p) => p.entityId === entityId,
        );
        if (locationMatch || participantMatch) {
          entries.push({
            sourceType: 'encounter',
            sourceId: encounter._id,
            label: `Encounter: ${encounter.name}`,
            excerpt: truncate(encounter.description ?? encounter.difficulty ?? '', 100),
            sortKey: toUnixSeconds(encounter.createdAt ?? encounter.updatedAt),
          });
        }
      }
    }

    // ── Arc developments: entity linked in a development ──
    if (arcsData) {
      for (const arc of arcsData as CampaignArc[]) {
        if (!arc.developments?.length) continue;
        for (const dev of arc.developments) {
          if (!dev.linkedEntityIds?.includes(entityId)) continue;
          entries.push({
            sourceType: 'arc_development',
            sourceId: arc._id,
            label: `${arc.name}: ${dev.title}`,
            excerpt: truncate(dev.description ?? '', 100),
            sortKey: toUnixSeconds(dev.createdAt),
          });
        }
      }
    }

    // ── Entity-sourced events ──
    if (entity) {
      // Discovery
      if (entity.discoveredByParty && entity.discoveredAt) {
        entries.push({
          sourceType: 'discovery',
          sourceId: entityId,
          label: 'Discovered by party',
          excerpt: '',
          sortKey: toUnixSeconds(entity.discoveredAt),
        });
      }

      // Secret reveals
      if (entity.secrets) {
        for (const secret of entity.secrets) {
          if (secret.revealed && secret.revealedAt) {
            entries.push({
              sourceType: 'secret_reveal',
              sourceId: entityId,
              label: 'Secret revealed',
              excerpt: truncate(secret.description ?? '', 100),
              sortKey: toUnixSeconds(secret.revealedAt),
            });
          }
        }
      }

      // Quest objective completions
      if (entity.objectives) {
        for (const objective of entity.objectives) {
          if (objective.completed && objective.completedAt) {
            entries.push({
              sourceType: 'objective_complete',
              sourceId: entityId,
              label: 'Objective completed',
              excerpt: truncate(objective.description ?? '', 100),
              sortKey: toUnixSeconds(objective.completedAt),
            });
          }
        }
      }

      // Reputation changes
      if (entity.reputationHistory) {
        for (const event of entity.reputationHistory) {
          if (!event.date) continue;
          const delta = event.delta;
          entries.push({
            sourceType: 'reputation_change',
            sourceId: entityId,
            label: `Reputation ${delta > 0 ? '+' : ''}${delta}`,
            excerpt: truncate(event.description ?? '', 100),
            sortKey: toUnixSeconds(event.date),
          });
        }
      }
    }

    // Sort newest first so truncation keeps recent events
    entries.sort((a, b) => b.sortKey - a.sortKey);

    const totalCount = entries.length;
    return {
      entries: entries.slice(0, MAX_ENTRIES),
      totalCount,
    };
  }, [entityId, sessionsData, encountersData, arcsData, entitiesData]);
}

function toUnixSeconds(dateStr?: string | null): number {
  if (!dateStr) return 0;
  const ms = new Date(dateStr).getTime();
  return Number.isNaN(ms) ? 0 : ms / 1000;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + '…';
}
