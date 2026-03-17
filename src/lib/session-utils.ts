/**
 * Shared session utility functions for v2 campaign surfaces.
 *
 * These were extracted from duplicate implementations in:
 *   OverviewCenterStage.tsx  (as extractSessionSnippet — different name, slightly different impl)
 *   PlayersCenterStage.tsx
 *   CampaignBrainPanelV2.tsx
 *
 * Variant differences found:
 *   - OverviewCenterStage used the name `extractSessionSnippet`, reversed the priority
 *     order of `summary` vs `aiSummary.summary`, applied `.trim()` on each field,
 *     included `session.statistics.keyMoments[0]` as an extra fallback, but omitted
 *     `session.notes`.
 *   - PlayersCenterStage and CampaignBrainPanelV2 used the name `extractSessionMoment`,
 *     included `session.notes`, and differed only in the final fallback string
 *     ('This session has no summary yet.' vs 'Referenced in campaign memory.').
 *   - dedupeStrings in CampaignBrainPanelV2 did NOT filter falsy values;
 *     PlayersCenterStage did. The canonical version filters falsy.
 *
 * Canonical versions below follow PlayersCenterStage/BrainPanel ordering and
 * include `statistics.keyMoments[0]` from OverviewCenterStage as an extra fallback.
 */

import type { Character, Session, WorldEntity } from '@/types/campaign';

export function extractSessionMoment(session: Session): string {
  return (
    session.aiSummary?.summary ||
    session.summary ||
    session.aiRecap ||
    session.notes ||
    session.statistics?.keyMoments?.[0] ||
    'This session has no summary yet.'
  );
}

export function sessionMentionsCharacter(session: Session, character: Character): boolean {
  const haystack = [
    session.title ?? '',
    session.summary ?? '',
    session.notes ?? '',
    session.aiRecap ?? '',
    session.aiSummary?.summary ?? '',
    ...(session.aiSummary?.keyEvents ?? []),
    ...(session.aiSummary?.unresolvedHooks ?? []),
    ...(session.statistics.keyMoments ?? []),
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(character.name.toLowerCase());
}

export function sessionMentionsEntity(session: Session, entity: WorldEntity): boolean {
  const haystack = [
    session.title ?? '',
    session.summary ?? '',
    session.notes ?? '',
    session.aiRecap ?? '',
    session.aiSummary?.summary ?? '',
    ...(session.aiSummary?.keyEvents ?? []),
    ...(session.aiSummary?.unresolvedHooks ?? []),
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(entity.name.toLowerCase());
}

export function dedupeEntities(entities: WorldEntity[]): WorldEntity[] {
  const seen = new Set<string>();
  return entities.filter((entity) => {
    if (seen.has(entity._id)) return false;
    seen.add(entity._id);
    return true;
  });
}

export function dedupeStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
