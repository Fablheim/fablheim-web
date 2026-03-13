import type { WorldEntity, WorldEntityType } from '@/types/campaign';
import { ENTITY_TYPE_CONFIG } from './world-config';

export function formatWorldEntityContext(entity: Pick<WorldEntity, 'type'> & Partial<Pick<WorldEntity, 'locationType' | 'questStatus' | 'disposition' | 'npcDisposition' | 'tags'>>) {
  const parts: string[] = [ENTITY_TYPE_CONFIG[entity.type].label];

  if (entity.locationType) {
    parts.push(startCase(entity.locationType));
  }

  const status = getEntityStatusLabel(entity);
  if (status) {
    parts.push(status);
  }

  if (entity.tags?.length) {
    parts.push(entity.tags.slice(0, 2).join(', '));
  }

  return parts.join(' · ');
}

export function getEntityStatusLabel(
  entity: Pick<WorldEntity, 'type' | 'questStatus' | 'disposition' | 'npcDisposition'>,
) {
  if (entity.type === 'quest' && entity.questStatus) {
    return startCase(entity.questStatus);
  }

  if (entity.type === 'faction' && entity.disposition) {
    return startCase(entity.disposition);
  }

  if ((entity.type === 'npc' || entity.type === 'npc_minor') && entity.npcDisposition) {
    return startCase(entity.npcDisposition);
  }

  return null;
}

export function resolveWorldParentId(
  parentEntityId?: string | { _id: string; name: string; type: string },
) {
  if (!parentEntityId) return null;
  return typeof parentEntityId === 'string' ? parentEntityId : parentEntityId._id;
}

export function normalizeEntityType(type: string): WorldEntityType {
  return type as WorldEntityType;
}

export function startCase(value: string) {
  return value
    .split(/[_-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
