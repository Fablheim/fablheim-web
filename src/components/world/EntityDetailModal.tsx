import { useState, useMemo } from 'react';
import { X, Pencil, Trash2, Eye, EyeOff, MapPin, CheckCircle2, Circle, Target, Clock, CheckCheck, XCircle, Swords, Heart, Compass } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { TabbedSection, type TabItem } from '@/components/ui/TabbedSection';
import { useEncounters } from '@/hooks/useEncounters';
import { useAddAlly } from '@/hooks/useAllies';
import { useToggleDiscovery } from '@/hooks/useWorldEntities';
import { TYPE_LABELS, TYPE_ACCENTS, TYPE_ICONS, TYPE_DATA_FIELDS, LOCATION_TYPE_LABELS } from './world-constants';
import { EntityRelationships } from './EntityRelationships';
import { FactionReputationPanel } from './FactionReputationPanel';
import { NPCSecretsPanel } from './NPCSecretsPanel';
import { QuestOutcomesPanel } from './QuestOutcomesPanel';
import { DomainPanel } from './DomainPanel';
import type { WorldEntity, LocationType } from '@/types/campaign';

interface EntityDetailModalProps {
  open: boolean;
  onClose: () => void;
  entity: WorldEntity | null;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  allEntities: WorldEntity[];
  onViewEntity: (entity: WorldEntity) => void;
  onLinkEntity: () => void;
  domainFeatureEnabled?: boolean;
}

export function EntityDetailModal({
  open,
  onClose,
  entity,
  canEdit,
  onEdit,
  onDelete,
  allEntities,
  onViewEntity,
  onLinkEntity,
  domainFeatureEnabled,
}: EntityDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const isLocation = entity?.type === 'location' || entity?.type === 'location_detail';
  const isNPC = entity?.type === 'npc' || entity?.type === 'npc_minor';
  const isFaction = entity?.type === 'faction';
  const isQuest = entity?.type === 'quest';
  const { data: encounters } = useEncounters(isLocation ? entity?.campaignId : undefined);
  const addAlly = useAddAlly();
  const toggleDiscovery = useToggleDiscovery();
  const linkedEncounters = useMemo(() => {
    if (!encounters || !entity) return [];
    return encounters.filter((enc) => enc.locationEntityId === entity._id);
  }, [encounters, entity]);

  const tabs = useMemo<TabItem[]>(() => {
    if (!entity) return [];
    const t: TabItem[] = [{ id: 'overview', label: 'Overview' }];
    t.push({ id: 'relationships', label: 'Relationships' });
    if (isLocation && domainFeatureEnabled) {
      t.push({ id: 'domain', label: 'Domain' });
    }
    if (isFaction || isNPC || isQuest) {
      t.push({ id: 'history', label: isFaction ? 'Reputation' : isNPC ? 'Secrets' : 'Outcomes' });
    }
    return t;
  }, [entity, isLocation, domainFeatureEnabled, isFaction, isNPC, isQuest]);

  if (!open || !entity) return null;

  const accent = TYPE_ACCENTS[entity.type];
  const TypeIcon = TYPE_ICONS[entity.type];
  const typeLabel = TYPE_LABELS[entity.type];
  const isHidden = entity.visibility === 'dm-only';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-border border-t-2 border-t-brass/50 bg-card shadow-warm-lg tavern-card iron-brackets texture-parchment">
        {/* Fixed header area */}
        <div className="shrink-0 p-6 pb-0">
          {renderHeader()}
          {renderActions()}
          {renderBreadcrumb()}
        </div>

        {/* Tabbed content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-4">
          <TabbedSection tabs={tabs} activeTabId={activeTab} onChange={setActiveTab}>
            {renderTabContent()}
          </TabbedSection>
        </div>
      </div>
    </div>
  );

  function renderHeader() {
    return (
      <div className="pr-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <TypeIcon className={`h-5 w-5 ${accent.text}`} />
          <h2 className="font-['IM_Fell_English'] text-2xl text-card-foreground">{entity!.name}</h2>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className={`inline-flex items-center rounded-md ${accent.bg} px-2 py-0.5 font-[Cinzel] text-[10px] uppercase tracking-wider ${accent.text}`}>
            {typeLabel}
          </span>
          {isHidden ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-arcane/15 px-1.5 py-0.5 text-[10px] text-arcane">
              <EyeOff className="h-3 w-3" />
              GM Only
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md bg-forest/15 px-1.5 py-0.5 text-[10px] text-[hsl(150,50%,55%)]">
              <Eye className="h-3 w-3" />
              Public
            </span>
          )}
          {canEdit && entity!.discoveredByParty === false && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-400">
              <Compass className="h-3 w-3" />
              Undiscovered
            </span>
          )}
          {entity!.locationType && (
            <span className="inline-flex items-center rounded-md bg-background/40 px-2 py-0.5 font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
              {LOCATION_TYPE_LABELS[entity!.locationType as LocationType] ?? entity!.locationType}
            </span>
          )}
        </div>
      </div>
    );
  }

  function renderActions() {
    if (!canEdit) return null;
    return (
      <div className="mt-4 flex gap-2">
        <Button size="sm" variant="secondary" onClick={onEdit}>
          <Pencil className="mr-1.5 h-3.5 w-3.5" />
          Edit
        </Button>
        <Button size="sm" variant="destructive" onClick={onDelete}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Delete
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={toggleDiscovery.isPending}
          onClick={() => {
            const next = entity!.discoveredByParty === false;
            toggleDiscovery.mutate(
              { campaignId: entity!.campaignId, entityId: entity!._id, discovered: next },
              {
                onSuccess: () => toast.success(next ? `${entity!.name} discovered!` : `${entity!.name} hidden from party`),
                onError: () => toast.error('Failed to toggle discovery'),
              },
            );
          }}
        >
          <Compass className="mr-1.5 h-3.5 w-3.5" />
          {entity!.discoveredByParty === false ? 'Mark Discovered' : 'Mark Undiscovered'}
        </Button>
        {isNPC && (
          <Button
            size="sm"
            variant="secondary"
            disabled={addAlly.isPending}
            onClick={() => {
              addAlly.mutate(
                {
                  campaignId: entity!.campaignId,
                  data: { sourceType: 'world_entity', sourceId: entity!._id, kind: 'npc' },
                },
                {
                  onSuccess: () => toast.success(`${entity!.name} added as ally`),
                  onError: (err: Error) =>
                    toast.error(err.message || 'Failed to add ally'),
                },
              );
            }}
          >
            <Heart className="mr-1.5 h-3.5 w-3.5" />
            Recruit Ally
          </Button>
        )}
      </div>
    );
  }

  function renderBreadcrumb() {
    if (!entity!.parentEntityId || typeof entity!.parentEntityId !== 'object') return null;
    return (
      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" />
        <span className="font-[Cinzel] uppercase tracking-wider">Located in:</span>
        <button
          onClick={() => {
            const parentRef = entity!.parentEntityId as { _id: string; name: string };
            const parent = allEntities.find((e) => e._id === parentRef._id);
            if (parent) onViewEntity(parent);
          }}
          className="text-brass hover:underline"
        >
          {(entity!.parentEntityId as { _id: string; name: string }).name}
        </button>
      </div>
    );
  }

  function renderTabContent() {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'relationships':
        return (
          <EntityRelationships
            entity={entity!}
            allEntities={allEntities}
            onViewEntity={onViewEntity}
            canEdit={canEdit}
            onLinkEntity={onLinkEntity}
          />
        );
      case 'domain':
        return (
          <DomainPanel
            campaignId={entity!.campaignId}
            locationEntityId={entity!._id}
            canEdit={canEdit}
            allEntities={allEntities}
            onViewEntity={onViewEntity}
          />
        );
      case 'history':
        return renderHistoryTab();
      default:
        return null;
    }
  }

  function renderOverviewTab() {
    return (
      <div className="space-y-0">
        {renderDescription()}
        {renderQuestDetails()}
        {renderContainedEntities()}
        {renderLinkedEncounters()}
        {renderTypeFields()}
        {renderTags()}
      </div>
    );
  }

  function renderDescription() {
    if (!entity!.description) return null;
    return (
      <div className="pb-4">
        <p className="mb-2 font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
          Description
        </p>
        <p className="whitespace-pre-wrap font-['IM_Fell_English'] text-sm italic leading-relaxed text-muted-foreground">
          {entity!.description}
        </p>
      </div>
    );
  }

  function renderQuestDetails() {
    if (entity!.type !== 'quest') return null;
    return (
      <>
        <div className="divider-ornate mb-4" />
        <p className="mb-3 font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
          Quest Details
        </p>
        <div className="space-y-3 pb-4">
          {renderQuestStatus()}
          {renderQuestGiver()}
          {renderQuestRewards()}
          {renderQuestObjectives()}
        </div>
      </>
    );
  }

  function renderQuestStatus() {
    const s = entity!.questStatus ?? 'available';
    const config: Record<string, { icon: typeof Target; color: string; bg: string; label: string }> = {
      available: { icon: Target, color: 'text-gold', bg: 'bg-gold/20', label: 'Available' },
      in_progress: { icon: Clock, color: 'text-brass', bg: 'bg-brass/20', label: 'In Progress' },
      completed: { icon: CheckCheck, color: 'text-[hsl(150,50%,55%)]', bg: 'bg-forest/20', label: 'Completed' },
      failed: { icon: XCircle, color: 'text-blood', bg: 'bg-blood/20', label: 'Failed' },
    };
    const c = config[s] ?? config.available;
    const Icon = c.icon;
    return (
      <div className="flex items-center gap-2">
        <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Status:</span>
        <span className={`inline-flex items-center gap-1 rounded-md ${c.bg} px-2 py-0.5 text-xs ${c.color}`}>
          <Icon className="h-3 w-3" />
          {c.label}
        </span>
      </div>
    );
  }

  function renderQuestGiver() {
    if (!entity!.questGiver) return null;
    return (
      <div>
        <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Quest Giver: </span>
        {typeof entity!.questGiver === 'object' ? (
          <button
            onClick={() => {
              const npc = allEntities.find((e) => e._id === (entity!.questGiver as { _id: string; name: string })._id);
              if (npc) onViewEntity(npc);
            }}
            className="text-sm text-brass hover:underline"
          >
            {entity!.questGiver.name}
          </button>
        ) : (
          <span className="text-sm text-foreground">{entity!.questGiver}</span>
        )}
      </div>
    );
  }

  function renderQuestRewards() {
    if (!entity!.rewards) return null;
    return (
      <div>
        <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Rewards: </span>
        <span className="text-sm text-foreground">{entity!.rewards}</span>
      </div>
    );
  }

  function renderQuestObjectives() {
    if (!entity!.objectives || entity!.objectives.length === 0) return null;
    return (
      <div>
        <p className="mb-1.5 font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
          Objectives ({entity!.objectives.filter((o) => o.completed).length}/{entity!.objectives.length})
        </p>
        <ul className="space-y-1">
          {entity!.objectives.map((obj) => (
            <li key={obj.id} className="flex items-center gap-2 text-sm">
              {obj.completed ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[hsl(150,50%,55%)]" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className={obj.completed ? 'line-through text-muted-foreground/60' : 'text-foreground'}>
                {obj.description}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  function renderContainedEntities() {
    const children = allEntities.filter(
      (e) =>
        (typeof e.parentEntityId === 'string' && e.parentEntityId === entity!._id) ||
        (typeof e.parentEntityId === 'object' && e.parentEntityId?._id === entity!._id),
    );
    if (children.length === 0) return null;

    const locationChildren = children.filter((c) => c.type === 'location' || c.type === 'location_detail');
    const otherChildren = children.filter((c) => c.type !== 'location' && c.type !== 'location_detail');

    const groupedOther = new Map<string, typeof otherChildren>();
    for (const child of otherChildren) {
      if (!groupedOther.has(child.type)) groupedOther.set(child.type, []);
      groupedOther.get(child.type)!.push(child);
    }

    return (
      <>
        <div className="divider-ornate mb-4" />
        <p className="mb-2 font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
          Contains ({children.length})
        </p>
        <div className="space-y-1 pb-4">
          {locationChildren.map((child) => {
            const ChildIcon = TYPE_ICONS[child.type];
            const childAccent = TYPE_ACCENTS[child.type];
            return (
              <button
                key={child._id}
                onClick={() => onViewEntity(child)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent/50 transition-colors"
              >
                <ChildIcon className={`h-3.5 w-3.5 ${childAccent.text}`} />
                <span className="text-foreground">{child.name}</span>
                {child.locationType && (
                  <span className="rounded bg-background/40 px-1.5 py-0.5 font-[Cinzel] text-[9px] uppercase tracking-wider text-muted-foreground">
                    {LOCATION_TYPE_LABELS[child.locationType as LocationType] ?? child.locationType}
                  </span>
                )}
              </button>
            );
          })}
          {[...groupedOther.entries()].map(([type, items]) => {
            const GroupIcon = TYPE_ICONS[type as keyof typeof TYPE_ICONS];
            const groupAccent = TYPE_ACCENTS[type as keyof typeof TYPE_ACCENTS];
            return items.map((child) => (
              <button
                key={child._id}
                onClick={() => onViewEntity(child)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent/50 transition-colors"
              >
                <GroupIcon className={`h-3.5 w-3.5 ${groupAccent.text}`} />
                <span className="text-foreground">{child.name}</span>
                <span className={`rounded ${groupAccent.bg} px-1.5 py-0.5 font-[Cinzel] text-[9px] uppercase tracking-wider ${groupAccent.text}`}>
                  {TYPE_LABELS[child.type]}
                </span>
              </button>
            ));
          })}
        </div>
      </>
    );
  }

  function renderLinkedEncounters() {
    if (linkedEncounters.length === 0) return null;
    return (
      <>
        <div className="divider-ornate mb-4" />
        <p className="mb-2 font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
          Encounters ({linkedEncounters.length})
        </p>
        <div className="space-y-1 pb-4">
          {linkedEncounters.map((enc) => {
            const diffColors: Record<string, string> = {
              easy: 'text-[hsl(150,50%,55%)] bg-forest/15',
              medium: 'text-gold bg-gold/15',
              hard: 'text-brass bg-brass/15',
              deadly: 'text-blood bg-blood/15',
            };
            return (
              <div
                key={enc._id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/50 transition-colors"
              >
                <Swords className="h-3.5 w-3.5 text-gold" />
                <span className="text-foreground">{enc.name}</span>
                <span className={`rounded px-1.5 py-0.5 font-[Cinzel] text-[9px] uppercase tracking-wider ${diffColors[enc.difficulty] ?? 'text-muted-foreground bg-muted'}`}>
                  {enc.difficulty}
                </span>
                <span className={`rounded px-1.5 py-0.5 font-[Cinzel] text-[9px] uppercase tracking-wider ${
                  enc.status === 'ready' ? 'text-[hsl(150,50%,55%)] bg-forest/15' :
                  enc.status === 'used' ? 'text-muted-foreground bg-muted' :
                  'text-brass bg-brass/15'
                }`}>
                  {enc.status}
                </span>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  function renderTypeFields() {
    const fields = TYPE_DATA_FIELDS[entity!.type] ?? [];
    if (fields.length === 0 || !entity!.typeData || Object.keys(entity!.typeData).length === 0) return null;
    return (
      <>
        <div className="divider-ornate mb-4" />
        <p className="mb-3 font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
          {typeLabel} Details
        </p>
        <div className="space-y-3 pb-4">
          {fields.map((field) => {
            const value = entity!.typeData?.[field.key];
            if (!value) return null;
            return (
              <div key={field.key}>
                <p className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
                  {field.label}
                </p>
                <p className="mt-0.5 text-sm text-foreground">{String(value)}</p>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  function renderTags() {
    if (entity!.tags.length === 0) return null;
    return (
      <>
        <div className="divider-ornate mb-4" />
        <p className="mb-2 font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
          Tags
        </p>
        <div className="flex flex-wrap gap-2">
          {entity!.tags.map((tag) => (
            <span
              key={tag}
              className="rounded bg-background/40 px-2.5 py-1 font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      </>
    );
  }

  function renderHistoryTab() {
    if (isFaction) {
      return (
        <FactionReputationPanel
          entity={entity!}
          canEdit={canEdit}
          allEntities={allEntities}
          onViewEntity={onViewEntity}
        />
      );
    }
    if (isNPC) {
      return (
        <NPCSecretsPanel
          entity={entity!}
          canEdit={canEdit}
          allEntities={allEntities}
        />
      );
    }
    if (isQuest) {
      return (
        <QuestOutcomesPanel
          entity={entity!}
          canEdit={canEdit}
          allEntities={allEntities}
          onViewEntity={onViewEntity}
        />
      );
    }
    return null;
  }
}
