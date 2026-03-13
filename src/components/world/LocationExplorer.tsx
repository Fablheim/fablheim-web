import { useMemo } from 'react';
import {
  ChevronRight,
  MapPin,
  User,
  Home,
  ArrowRight,
} from 'lucide-react';
import type { WorldEntity, WorldEntityType, LocationType } from '@/types/campaign';
import { LOCATION_TYPE_LABELS, TYPE_ICONS, TYPE_LABELS } from './world-constants';
import { ExplorerSection } from './ExplorerSection';
import { EntityRow } from './EntityRow';

interface LocationExplorerProps {
  /** All entities in the campaign (already visibility-filtered). */
  entities: WorldEntity[];
  /** The currently selected location ID (null = world root). */
  locationId: string | null;
  /** Navigate into a location. Pass null to go to root. */
  onNavigate: (locationId: string | null) => void;
  /** Open an entity's full detail modal (for NPCs, items, etc.). */
  onViewEntity: (entity: WorldEntity) => void;
  /** Whether user can edit (DM). */
  canEdit: boolean;
}

/** Groups child entities by category for display. */
interface GroupedChildren {
  subLocations: WorldEntity[];
  npcs: WorldEntity[];
  otherByType: Map<WorldEntityType, WorldEntity[]>;
}

const TYPE_GROUP_ORDER: Record<WorldEntityType, 'sub' | 'npc' | 'other'> = {
  location: 'sub',
  location_detail: 'sub',
  npc: 'npc',
  npc_minor: 'npc',
  faction: 'other',
  item: 'other',
  quest: 'other',
  event: 'other',
  lore: 'other',
  trap: 'other',
};

function getParentId(entity: WorldEntity): string | null {
  if (!entity.parentEntityId) return null;
  if (typeof entity.parentEntityId === 'string') return entity.parentEntityId;
  return entity.parentEntityId._id;
}

function buildBreadcrumbs(
  locationId: string | null,
  entityMap: Map<string, WorldEntity>,
): WorldEntity[] {
  const crumbs: WorldEntity[] = [];
  let current = locationId;
  while (current) {
    const entity = entityMap.get(current);
    if (!entity) break;
    crumbs.unshift(entity);
    current = getParentId(entity);
  }
  return crumbs;
}

export function LocationExplorer({
  entities,
  locationId,
  onNavigate,
  onViewEntity,
}: LocationExplorerProps) {
  const entityMap = useMemo(
    () => new Map(entities.map((e) => [e._id, e])),
    [entities],
  );

  const currentLocation = locationId ? entityMap.get(locationId) ?? null : null;
  const breadcrumbs = useMemo(
    () => buildBreadcrumbs(locationId, entityMap),
    [locationId, entityMap],
  );

  // Get direct children of the current location
  const children = useMemo(() => {
    return entities.filter((e) => {
      const pid = getParentId(e);
      if (locationId === null) return !pid; // root level
      return pid === locationId;
    });
  }, [entities, locationId]);

  // Group children by category
  const grouped = useMemo<GroupedChildren>(() => {
    const result: GroupedChildren = { subLocations: [], npcs: [], otherByType: new Map() };
    for (const child of children) {
      const group = TYPE_GROUP_ORDER[child.type];
      if (group === 'sub') result.subLocations.push(child);
      else if (group === 'npc') result.npcs.push(child);
      else {
        if (!result.otherByType.has(child.type)) result.otherByType.set(child.type, []);
        result.otherByType.get(child.type)!.push(child);
      }
    }
    // Sort sub-locations by location type scale
    const SCALE: LocationType[] = [
      'continent', 'region', 'kingdom', 'city', 'town', 'village',
      'district', 'building', 'landmark', 'dungeon', 'room', 'wilderness', 'other',
    ];
    result.subLocations.sort((a, b) => {
      const ai = SCALE.indexOf((a.locationType ?? 'other') as LocationType);
      const bi = SCALE.indexOf((b.locationType ?? 'other') as LocationType);
      if (ai !== bi) return ai - bi;
      return a.name.localeCompare(b.name);
    });
    result.npcs.sort((a, b) => a.name.localeCompare(b.name));
    for (const items of result.otherByType.values()) {
      items.sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [children]);

  const isEmpty = children.length === 0;

  return (
    <div className="flex h-full flex-col">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 border-b border-border/60 px-4 py-2.5">
        <button
          type="button"
          onClick={() => onNavigate(null)}
          className={`flex items-center gap-1 rounded px-1.5 py-0.5 font-[Cinzel] text-xs transition-colors ${
            !locationId
              ? 'text-brass'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Home className="h-3 w-3" />
          World
        </button>
        {breadcrumbs.map((crumb) => (
          <span key={crumb._id} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
            <button
              type="button"
              onClick={() => onNavigate(crumb._id)}
              className={`rounded px-1.5 py-0.5 font-[Cinzel] text-xs transition-colors ${
                crumb._id === locationId
                  ? 'text-brass'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {crumb.name}
            </button>
          </span>
        ))}
      </div>

      {/* Current location header */}
      {currentLocation && (
        <div className="border-b border-border/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[hsl(150,50%,55%)]" />
            <h2 className="font-[Cinzel] text-base font-semibold text-card-foreground">
              {currentLocation.name}
            </h2>
            {currentLocation.locationType && (
              <span className="rounded bg-forest/15 px-1.5 py-0.5 font-[Cinzel] text-[10px] uppercase tracking-wider text-[hsl(150,40%,50%)]">
                {LOCATION_TYPE_LABELS[currentLocation.locationType as LocationType] ?? currentLocation.locationType}
              </span>
            )}
          </div>
          {currentLocation.description && (
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {currentLocation.description}
            </p>
          )}
          {/* Type data summary (terrain, climate, population) */}
          {currentLocation.typeData && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {Object.entries(currentLocation.typeData as Record<string, string>)
                .filter(([, v]) => v && typeof v === 'string' && v.trim())
                .slice(0, 4)
                .map(([key, value]) => (
                  <span key={key} className="text-xs text-muted-foreground">
                    <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground/70">
                      {key}:
                    </span>{' '}
                    {value}
                  </span>
                ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => onViewEntity(currentLocation)}
            className="mt-2 inline-flex items-center gap-1 rounded border border-brass/30 bg-brass/10 px-2 py-0.5 font-[Cinzel] text-[10px] uppercase tracking-wider text-brass transition-colors hover:bg-brass/20"
          >
            Full Details
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Content area */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MapPin className="mb-2 h-6 w-6 text-muted-foreground/40" />
            <p className="font-['IM_Fell_English'] text-sm italic text-muted-foreground">
              {locationId
                ? 'Nothing here yet. Add sub-locations or place NPCs inside this location.'
                : 'No top-level locations. Create your first location to start building your world.'}
            </p>
          </div>
        )}

        {/* Sub-Locations */}
        {grouped.subLocations.length > 0 && (
          <ExplorerSection
            title="Locations"
            icon={MapPin}
            count={grouped.subLocations.length}
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {grouped.subLocations.map((loc) => (
                <LocationCard
                  key={loc._id}
                  entity={loc}
                  childCount={entities.filter((e) => getParentId(e) === loc._id).length}
                  onClick={() => onNavigate(loc._id)}
                />
              ))}
            </div>
          </ExplorerSection>
        )}

        {/* NPCs */}
        {grouped.npcs.length > 0 && (
          <ExplorerSection
            title="NPCs"
            icon={User}
            count={grouped.npcs.length}
          >
            <div className="space-y-1">
              {grouped.npcs.map((npc) => (
                <EntityRow
                  key={npc._id}
                  entity={npc}
                  onClick={() => onViewEntity(npc)}
                />
              ))}
            </div>
          </ExplorerSection>
        )}

        {/* Other entities by type */}
        {[...grouped.otherByType.entries()].map(([type, items]) => {
          const SectionIcon = TYPE_ICONS[type];
          return (
            <ExplorerSection
              key={type}
              title={TYPE_LABELS[type] + 's'}
              icon={SectionIcon}
              count={items.length}
            >
              <div className="space-y-1">
                {items.map((ent) => (
                  <EntityRow
                    key={ent._id}
                    entity={ent}
                    onClick={() => onViewEntity(ent)}
                  />
                ))}
              </div>
            </ExplorerSection>
          );
        })}
      </div>
    </div>
  );
}

// ── Sub-Components ──────────────────────────────────────────────────────

/** Clickable location card that navigates deeper into the hierarchy. */
function LocationCard({
  entity,
  childCount,
  onClick,
}: {
  entity: WorldEntity;
  childCount: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-lg border border-border/60 bg-card/50 px-3 py-2.5 text-left transition-all hover:border-forest/50 hover:bg-forest/5 hover:shadow-glow-sm"
    >
      <MapPin className="h-4 w-4 shrink-0 text-[hsl(150,50%,55%)]" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-[Cinzel] text-sm font-medium text-card-foreground">
            {entity.name}
          </span>
          {entity.locationType && (
            <span className="shrink-0 rounded bg-forest/10 px-1.5 py-0.5 font-[Cinzel] text-[9px] uppercase tracking-wider text-[hsl(150,40%,50%)]">
              {LOCATION_TYPE_LABELS[entity.locationType as LocationType] ?? entity.locationType}
            </span>
          )}
        </div>
        {entity.description && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            {entity.description}
          </p>
        )}
      </div>
      {childCount > 0 && (
        <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
          {childCount}
        </span>
      )}
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-forest" />
    </button>
  );
}

