import type { LocationType, WorldEntity, WorldEntityType } from '@/types/campaign';

export interface WorldCreateDraft {
  defaultType?: WorldEntityType;
  parentEntityId?: string;
  linkedEntityId?: string;
  linkedRelationshipType?: string;
  sourceEntityId?: string;
  title?: string;
  subtitle?: string;
}

export interface WorldCreateAction {
  key: string;
  label: string;
  draft: WorldCreateDraft;
}

export const CREATABLE_WORLD_TYPES: WorldEntityType[] = [
  'location',
  'npc',
  'faction',
  'quest',
  'item',
  'lore',
  'event',
];

export const LOCATION_TYPE_OPTIONS: Array<{ value: LocationType; label: string }> = [
  { value: 'continent', label: 'Continent' },
  { value: 'region', label: 'Region' },
  { value: 'kingdom', label: 'Kingdom' },
  { value: 'city', label: 'City' },
  { value: 'town', label: 'Town' },
  { value: 'village', label: 'Village' },
  { value: 'district', label: 'District' },
  { value: 'building', label: 'Building' },
  { value: 'landmark', label: 'Landmark' },
  { value: 'dungeon', label: 'Dungeon' },
  { value: 'room', label: 'Room' },
  { value: 'wilderness', label: 'Wilderness' },
  { value: 'other', label: 'Other' },
];

export function buildContextualCreateActions(entity: WorldEntity): WorldCreateAction[] {
  const actions: WorldCreateAction[] = [];
  const title = `Add from ${entity.name}`;

  if (entity.type === 'location' || entity.type === 'location_detail') {
    actions.push(
      {
        key: 'child-location',
        label: 'Add child location',
        draft: {
          defaultType: 'location',
          parentEntityId: entity._id,
          sourceEntityId: entity._id,
          title,
          subtitle: `Create something directly inside ${entity.name}. Placement is prefilled, but you can leave it loose instead.`,
        },
      },
      {
        key: 'npc-here',
        label: 'Add NPC here',
        draft: {
          defaultType: 'npc',
          parentEntityId: entity._id,
          sourceEntityId: entity._id,
          title,
          subtitle: `Start an NPC in ${entity.name} with placement already set. You can still remove placement before saving.`,
        },
      },
      {
        key: 'quest-here',
        label: 'Add quest here',
        draft: {
          defaultType: 'quest',
          parentEntityId: entity._id,
          linkedEntityId: entity._id,
          linkedRelationshipType: 'set_in',
          sourceEntityId: entity._id,
          title,
          subtitle: `Create a quest tied to ${entity.name}, with location context already connected.`,
        },
      },
    );
  }

  if (entity.type === 'faction') {
    actions.push(
      {
        key: 'linked-npc',
        label: 'Add linked NPC',
        draft: {
          defaultType: 'npc',
          linkedEntityId: entity._id,
          linkedRelationshipType: 'member_of',
          sourceEntityId: entity._id,
          title,
          subtitle: `Start an NPC already connected to ${entity.name}. You can refine the relationship later from detail view.`,
        },
      },
      {
        key: 'faction-quest',
        label: 'Add tied quest',
        draft: {
          defaultType: 'quest',
          linkedEntityId: entity._id,
          linkedRelationshipType: 'backed_by',
          sourceEntityId: entity._id,
          title,
          subtitle: `Create a quest already tied into ${entity.name}'s campaign role.`,
        },
      },
    );
  }

  if (entity.type === 'quest') {
    actions.push(
      {
        key: 'quest-npc',
        label: 'Add linked NPC',
        draft: {
          defaultType: 'npc',
          linkedEntityId: entity._id,
          linkedRelationshipType: 'involved_in',
          sourceEntityId: entity._id,
          title,
          subtitle: `Create someone already involved in ${entity.name}.`,
        },
      },
      {
        key: 'quest-location',
        label: 'Add linked location',
        draft: {
          defaultType: 'location',
          linkedEntityId: entity._id,
          linkedRelationshipType: 'site_of',
          sourceEntityId: entity._id,
          title,
          subtitle: `Create a place connected to ${entity.name} without forcing full hierarchy placement yet.`,
        },
      },
    );
  }

  if (entity.type === 'npc' || entity.type === 'npc_minor') {
    actions.push(
      {
        key: 'npc-item',
        label: 'Add linked item',
        draft: {
          defaultType: 'item',
          linkedEntityId: entity._id,
          linkedRelationshipType: 'owned_by',
          sourceEntityId: entity._id,
          title,
          subtitle: `Create an item already tied to ${entity.name}.`,
        },
      },
      {
        key: 'npc-quest',
        label: 'Add tied quest',
        draft: {
          defaultType: 'quest',
          linkedEntityId: entity._id,
          linkedRelationshipType: 'involves',
          sourceEntityId: entity._id,
          title,
          subtitle: `Start a quest hook connected to ${entity.name}.`,
        },
      },
    );
  }

  return actions;
}

export function getDefaultCreateTitle(draft?: WorldCreateDraft) {
  return draft?.title ?? 'Create world entity';
}

export function getDefaultCreateSubtitle(draft?: WorldCreateDraft) {
  return (
    draft?.subtitle ??
    'Capture the minimum now, then continue refining from the detail view. Leaving placement empty saves it as unassigned.'
  );
}
