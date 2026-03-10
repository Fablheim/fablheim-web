import { useState } from 'react';
import {
  Users,
  Package,
  Hammer,
  UserCheck,
  Plus,
  Minus,
  Lock,
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  useDomainByLocation,
  useCreateDomain,
  useAdjustPopulation,
  useAdjustResource,
  useBuildUpgrade,
  useRecruitSpecialist,
  useDeleteDomain,
} from '@/hooks/useDomains';
import type {
  Domain,
  WorldEntity,
  PopulationTier,
  ResourcePool,
  UpgradeCategory,
  UpgradeTier,
  DomainSpecialist,
} from '@/types/campaign';

interface DomainPanelProps {
  campaignId: string;
  locationEntityId: string;
  canEdit: boolean;
  allEntities: WorldEntity[];
  onViewEntity: (entity: WorldEntity) => void;
}

type TabKey = 'overview' | 'resources' | 'upgrades' | 'specialists';

const TABS: { key: TabKey; label: string; icon: typeof Users }[] = [
  { key: 'overview', label: 'Overview', icon: Building2 },
  { key: 'resources', label: 'Resources', icon: Package },
  { key: 'upgrades', label: 'Upgrades', icon: Hammer },
  { key: 'specialists', label: 'Specialists', icon: UserCheck },
];

const DEFAULT_TIERS: PopulationTier[] = [
  { name: 'Outpost', threshold: 0 },
  { name: 'Settlement', threshold: 50 },
  { name: 'Village', threshold: 200 },
  { name: 'Town', threshold: 500 },
];

const TIER_COLORS: Record<string, { text: string; bg: string }> = {
  Outpost: { text: 'text-muted-foreground', bg: 'bg-muted' },
  Settlement: { text: 'text-brass', bg: 'bg-brass/15' },
  Village: { text: 'text-gold', bg: 'bg-gold/15' },
  Town: { text: 'text-[hsl(150,50%,55%)]', bg: 'bg-forest/15' },
};

function getResourceBarColor(current: number, max: number | undefined): string {
  if (!max || max <= 0) return 'bg-gold';
  const pct = current / max;
  if (pct < 0.25) return 'bg-blood';
  if (pct <= 0.75) return 'bg-[hsl(45,80%,55%)]';
  return 'bg-[hsl(150,50%,55%)]';
}

// ─── Create Domain Form ──────────────────────────────────────────────

function CreateDomainForm({
  campaignId,
  locationEntityId,
}: {
  campaignId: string;
  locationEntityId: string;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [population, setPopulation] = useState(0);
  const [visibility, setVisibility] = useState<'public' | 'dm-only'>('public');
  const createDomain = useCreateDomain();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createDomain.mutate(
      {
        campaignId,
        data: {
          locationEntityId,
          name: name.trim(),
          description: description.trim() || undefined,
          population,
          populationTiers: DEFAULT_TIERS,
          visibility,
        },
      },
      {
        onSuccess: () => toast.success('Domain created'),
        onError: () => toast.error('Failed to create domain'),
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-gold" />
        <h3 className="font-[Cinzel] text-sm font-semibold uppercase tracking-wider text-foreground">
          Create Domain
        </h3>
      </div>

      {renderCreateFields(name, setName, description, setDescription, population, setPopulation)}
      {renderCreateActions(visibility, setVisibility, createDomain.isPending)}
    </form>
  );
}

function renderCreateFields(
  name: string,
  setName: (v: string) => void,
  description: string,
  setDescription: (v: string) => void,
  population: number,
  setPopulation: (v: number) => void,
) {
  return (
    <>
      <div>
        <label className="mb-1 block font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
          Name <span className="text-blood">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. Thornhaven"
          className="block w-full rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground input-carved font-[Cinzel]"
        />
      </div>
      <div>
        <label className="mb-1 block font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="A brief description of the domain..."
          className="block w-full rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground input-carved font-['IM_Fell_English']"
        />
      </div>
      <div>
        <label className="mb-1 block font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
          Initial Population
        </label>
        <input
          type="number"
          value={population}
          onChange={(e) => setPopulation(Number(e.target.value))}
          min={0}
          className="block w-32 rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground input-carved font-[Cinzel]"
        />
      </div>
    </>
  );
}

function renderCreateActions(
  visibility: 'public' | 'dm-only',
  setVisibility: (v: 'public' | 'dm-only') => void,
  isPending: boolean,
) {
  return (
    <>
      <div className="flex items-center gap-3">
        <label className="font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
          Visibility
        </label>
        <button
          type="button"
          onClick={() => setVisibility(visibility === 'public' ? 'dm-only' : 'public')}
          className="flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent/50"
        >
          {visibility === 'public' ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          <span className="font-[Cinzel] uppercase tracking-wider">
            {visibility === 'public' ? 'Public' : 'DM Only'}
          </span>
        </button>
      </div>
      <Button type="submit" variant="primary" size="default" disabled={isPending}>
        <Plus className="mr-1.5 h-4 w-4" />
        Create Domain
      </Button>
    </>
  );
}

// ─── Tab Navigation ──────────────────────────────────────────────────

function TabNav({ activeTab, onTabChange }: { activeTab: TabKey; onTabChange: (t: TabKey) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1.5 font-[Cinzel] text-xs uppercase tracking-wider transition-colors ${
              isActive
                ? 'bg-primary/15 text-primary border-primary/40'
                : 'border-transparent text-muted-foreground hover:bg-accent/50'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────

function OverviewTab({
  domain,
  campaignId,
  canEdit,
}: {
  domain: Domain;
  campaignId: string;
  canEdit: boolean;
}) {
  const [popDelta, setPopDelta] = useState('');
  const adjustPop = useAdjustPopulation();
  const deleteDomain = useDeleteDomain();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const currentTier = domain.populationTiers[domain.currentTierIndex];
  const nextTier = domain.populationTiers[domain.currentTierIndex + 1];
  const tierName = currentTier?.name ?? 'Unknown';
  const tierStyle = TIER_COLORS[tierName] ?? TIER_COLORS.Outpost;

  function getProgressPct(): number {
    if (!nextTier) return 100;
    const prevThreshold = currentTier?.threshold ?? 0;
    const range = nextTier.threshold - prevThreshold;
    if (range <= 0) return 100;
    return Math.min(100, Math.round(((domain.population - prevThreshold) / range) * 100));
  }

  function handleAdjustPop() {
    const delta = parseInt(popDelta, 10);
    if (isNaN(delta) || delta === 0) return;
    adjustPop.mutate(
      { campaignId, domainId: domain._id, delta },
      {
        onSuccess: () => {
          setPopDelta('');
          toast.success(`Population adjusted by ${delta > 0 ? '+' : ''}${delta}`);
        },
        onError: () => toast.error('Failed to adjust population'),
      },
    );
  }

  function handleDeleteDomain() {
    deleteDomain.mutate(
      { campaignId, domainId: domain._id },
      {
        onSuccess: () => toast.success('Domain deleted'),
        onError: () => toast.error('Failed to delete domain'),
      },
    );
  }

  return (
    <div className="space-y-5">
      {renderOverviewHeader(domain, tierName, tierStyle)}
      {renderOverviewPopulation(domain, nextTier, getProgressPct())}
      {canEdit && renderOverviewControls(
        popDelta,
        setPopDelta,
        adjustPop.isPending,
        handleAdjustPop,
        domain,
        showDeleteConfirm,
        setShowDeleteConfirm,
        deleteDomain.isPending,
        handleDeleteDomain,
      )}
    </div>
  );
}

function renderOverviewHeader(
  domain: Domain,
  tierName: string,
  tierStyle: { text: string; bg: string },
) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <h3 className="font-[Cinzel] text-lg font-semibold text-foreground">{domain.name}</h3>
        <span className={`rounded-md px-2 py-0.5 text-[10px] font-[Cinzel] uppercase tracking-wider ${tierStyle.bg} ${tierStyle.text}`}>
          {tierName}
        </span>
      </div>
      {domain.description && (
        <p className="mt-1 font-['IM_Fell_English'] text-sm italic text-muted-foreground">
          {domain.description}
        </p>
      )}
    </div>
  );
}

function renderOverviewPopulation(
  domain: Domain,
  nextTier: PopulationTier | undefined,
  progressPct: number,
) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-center justify-between">
        <span className="font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
          Population
        </span>
        <span className="font-[Cinzel] text-lg font-semibold text-foreground">
          {domain.population.toLocaleString()}
        </span>
      </div>
      {nextTier && (
        <div className="mt-2">
          <div className="mb-1 flex justify-between text-[10px] text-muted-foreground font-[Cinzel] uppercase tracking-wider">
            <span>Progress to {nextTier.name}</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gold transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-1 text-right text-[10px] text-muted-foreground">
            {nextTier.threshold.toLocaleString()} needed
          </p>
        </div>
      )}
    </div>
  );
}

function renderOverviewControls(
  popDelta: string,
  setPopDelta: (v: string) => void,
  isPending: boolean,
  handleAdjustPop: () => void,
  domain: Domain,
  showDeleteConfirm: boolean,
  setShowDeleteConfirm: (v: boolean) => void,
  isDeleting: boolean,
  handleDeleteDomain: () => void,
) {
  return (
    <>
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <label className="mb-2 block font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
          Adjust Population
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={popDelta}
            onChange={(e) => setPopDelta(e.target.value)}
            placeholder="+/- delta"
            className="block w-28 rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground input-carved font-[Cinzel]"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAdjustPop}
            disabled={isPending || !popDelta}
          >
            Apply
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-center gap-2">
          <span className="font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
            Visibility
          </span>
          <span className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-foreground font-[Cinzel] uppercase tracking-wider">
            {domain.visibility === 'public' ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" />
            )}
            {domain.visibility === 'public' ? 'Public' : 'DM Only'}
          </span>
        </div>
        <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
          Delete Domain
        </Button>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Domain"
        description="This will permanently destroy this domain and all its data. This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        isPending={isDeleting}
        onConfirm={handleDeleteDomain}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}

// ─── Resources Tab ───────────────────────────────────────────────────

function ResourcesTab({
  domain,
  campaignId,
  canEdit,
}: {
  domain: Domain;
  campaignId: string;
  canEdit: boolean;
}) {
  const [adjustingResource, setAdjustingResource] = useState<string | null>(null);
  const [resourceDelta, setResourceDelta] = useState('');
  const adjustResource = useAdjustResource();

  function handleAdjust(resourceName: string) {
    const delta = parseInt(resourceDelta, 10);
    if (isNaN(delta) || delta === 0) return;
    adjustResource.mutate(
      { campaignId, domainId: domain._id, data: { resourceName, delta } },
      {
        onSuccess: () => {
          setAdjustingResource(null);
          setResourceDelta('');
          toast.success(`${resourceName} adjusted by ${delta > 0 ? '+' : ''}${delta}`);
        },
        onError: () => toast.error(`Failed to adjust ${resourceName}`),
      },
    );
  }

  if (domain.resources.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gold/30 bg-card/30 p-8 text-center">
        <Package className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="mt-2 font-['IM_Fell_English'] text-muted-foreground">No resources configured</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {domain.resources.map((res) => renderResourceCard(
        res,
        canEdit,
        adjustingResource,
        setAdjustingResource,
        resourceDelta,
        setResourceDelta,
        adjustResource.isPending,
        handleAdjust,
      ))}
    </div>
  );
}

function renderResourceCard(
  res: ResourcePool,
  canEdit: boolean,
  adjustingResource: string | null,
  setAdjustingResource: (v: string | null) => void,
  resourceDelta: string,
  setResourceDelta: (v: string) => void,
  isPending: boolean,
  handleAdjust: (name: string) => void,
) {
  const pct = res.max && res.max > 0 ? Math.min(100, Math.round((res.current / res.max) * 100)) : 100;
  const barColor = getResourceBarColor(res.current, res.max);
  const isAdjusting = adjustingResource === res.name;

  return (
    <div key={res.name} className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="font-[Cinzel] text-xs font-semibold uppercase tracking-wider text-foreground">
          {res.name}
        </span>
        <span className="font-[Cinzel] text-sm text-foreground">
          {res.current}{res.max != null ? ` / ${res.max}` : ''}
        </span>
      </div>
      {renderResourceBar(pct, barColor)}
      {canEdit && renderResourceAdjust(
        res.name,
        isAdjusting,
        setAdjustingResource,
        resourceDelta,
        setResourceDelta,
        isPending,
        handleAdjust,
      )}
    </div>
  );
}

function renderResourceBar(pct: number, barColor: string) {
  return (
    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full transition-all ${barColor}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function renderResourceAdjust(
  resourceName: string,
  isAdjusting: boolean,
  setAdjustingResource: (v: string | null) => void,
  resourceDelta: string,
  setResourceDelta: (v: string) => void,
  isPending: boolean,
  handleAdjust: (name: string) => void,
) {
  if (!isAdjusting) {
    return (
      <div className="mt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setAdjustingResource(resourceName);
            setResourceDelta('');
          }}
        >
          Adjust
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        type="number"
        value={resourceDelta}
        onChange={(e) => setResourceDelta(e.target.value)}
        placeholder="+/-"
        className="block w-20 rounded-sm border border-input bg-input px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground input-carved font-[Cinzel]"
        autoFocus
      />
      <Button
        variant="secondary"
        size="sm"
        onClick={() => handleAdjust(resourceName)}
        disabled={isPending || !resourceDelta}
      >
        <Check className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setAdjustingResource(null)}
      >
        <Minus className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ─── Upgrades Tab ────────────────────────────────────────────────────

function UpgradesTab({
  domain,
  campaignId,
  canEdit,
}: {
  domain: Domain;
  campaignId: string;
  canEdit: boolean;
}) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(domain.upgradeCategories.map((c) => c._id ?? c.name)),
  );
  const buildUpgrade = useBuildUpgrade();

  function toggleCategory(id: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBuild(categoryId: string, tier: number) {
    buildUpgrade.mutate(
      { campaignId, domainId: domain._id, data: { categoryId, tier } },
      {
        onSuccess: () => toast.success('Upgrade built!'),
        onError: () => toast.error('Failed to build upgrade'),
      },
    );
  }

  function canAfford(cost: Record<string, number>): boolean {
    return Object.entries(cost).every(([name, amount]) => {
      const pool = domain.resources.find((r) => r.name === name);
      return pool && pool.current >= amount;
    });
  }

  if (domain.upgradeCategories.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gold/30 bg-card/30 p-8 text-center">
        <Hammer className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="mt-2 font-['IM_Fell_English'] text-muted-foreground">No upgrade categories configured</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {domain.upgradeCategories.map((cat) => {
        const catId = cat._id ?? cat.name;
        const isExpanded = expandedCategories.has(catId);
        return (
          <div key={catId} className="rounded-lg border border-border bg-card">
            {renderCategoryHeader(cat, isExpanded, () => toggleCategory(catId))}
            {isExpanded && renderCategoryTiers(cat, domain, canEdit, canAfford, buildUpgrade.isPending, handleBuild)}
          </div>
        );
      })}
    </div>
  );
}

function renderCategoryHeader(
  cat: UpgradeCategory,
  isExpanded: boolean,
  onToggle: () => void,
) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center gap-2 p-4 text-left transition-colors hover:bg-accent/30"
    >
      {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      <Hammer className="h-4 w-4 text-gold" />
      <span className="font-[Cinzel] text-sm font-semibold uppercase tracking-wider text-foreground">
        {cat.name}
      </span>
      {cat.description && (
        <span className="ml-2 text-xs text-muted-foreground font-['IM_Fell_English'] italic">
          {cat.description}
        </span>
      )}
    </button>
  );
}

function renderCategoryTiers(
  cat: UpgradeCategory,
  domain: Domain,
  canEdit: boolean,
  canAfford: (cost: Record<string, number>) => boolean,
  isPending: boolean,
  handleBuild: (categoryId: string, tier: number) => void,
) {
  const catId = cat._id ?? cat.name;
  const firstUnbuiltIndex = cat.tiers.findIndex((t) => !t.built);

  return (
    <div className="border-t border-border/50 px-4 py-3 space-y-2">
      {cat.tiers.map((tier, idx) => {
        const isBuilt = tier.built;
        const isNext = idx === firstUnbuiltIndex;
        const isFuture = idx > firstUnbuiltIndex && firstUnbuiltIndex !== -1;
        const affordable = canAfford(tier.cost);

        return renderUpgradeTier(
          tier,
          idx,
          isBuilt,
          isNext,
          isFuture,
          affordable,
          canEdit,
          isPending,
          domain,
          catId,
          handleBuild,
        );
      })}
    </div>
  );
}

function renderUpgradeTier(
  tier: UpgradeTier,
  _idx: number,
  isBuilt: boolean,
  isNext: boolean,
  isFuture: boolean,
  affordable: boolean,
  canEdit: boolean,
  isPending: boolean,
  domain: Domain,
  catId: string,
  handleBuild: (categoryId: string, tierNum: number) => void,
) {
  const borderClass = isNext
    ? 'border-gold/50'
    : isBuilt
      ? 'border-border/30'
      : 'border-border/20';

  return (
    <div
      key={tier.tier}
      className={`rounded-md border ${borderClass} p-3 ${isFuture ? 'opacity-50' : ''} ${isBuilt ? 'bg-muted/20' : isNext ? 'bg-gold/5' : ''}`}
    >
      <div className="flex items-center justify-between">
        {renderTierLabel(tier, isBuilt, isFuture)}
        {renderTierActions(tier, isBuilt, isNext, isFuture, affordable, canEdit, isPending, catId, handleBuild)}
      </div>
      {tier.description && (
        <p className="mt-1 text-xs text-muted-foreground font-['IM_Fell_English'] italic">
          {tier.description}
        </p>
      )}
      {(isNext || isBuilt) && Object.keys(tier.cost).length > 0 && renderCostBreakdown(tier.cost, domain, isBuilt)}
    </div>
  );
}

function renderTierLabel(tier: UpgradeTier, isBuilt: boolean, isFuture: boolean) {
  return (
    <div className="flex items-center gap-2">
      {isBuilt && <Check className="h-4 w-4 text-[hsl(150,50%,55%)]" />}
      {isFuture && <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />}
      <span className={`font-[Cinzel] text-xs uppercase tracking-wider ${isBuilt ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
        T{tier.tier}: {tier.name}
      </span>
      {isBuilt && (
        <span className="text-[10px] text-[hsl(150,50%,55%)] font-[Cinzel] uppercase tracking-wider">
          (Built)
        </span>
      )}
    </div>
  );
}

function renderTierActions(
  tier: UpgradeTier,
  isBuilt: boolean,
  isNext: boolean,
  isFuture: boolean,
  affordable: boolean,
  canEdit: boolean,
  isPending: boolean,
  catId: string,
  handleBuild: (categoryId: string, tierNum: number) => void,
) {
  if (isBuilt || isFuture || !isNext || !canEdit) return null;

  return (
    <Button
      variant="primary"
      size="sm"
      disabled={!affordable || isPending}
      onClick={() => handleBuild(catId, tier.tier)}
    >
      <Hammer className="mr-1 h-3 w-3" />
      Build
    </Button>
  );
}

function renderCostBreakdown(cost: Record<string, number>, domain: Domain, isBuilt: boolean) {
  const entries = Object.entries(cost);
  if (entries.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {entries.map(([name, amount]) => {
        const pool = domain.resources.find((r) => r.name === name);
        const has = pool?.current ?? 0;
        const insufficient = !isBuilt && has < amount;
        return (
          <span
            key={name}
            className={`rounded bg-muted px-2 py-0.5 text-[10px] font-[Cinzel] uppercase tracking-wider ${insufficient ? 'text-blood' : 'text-muted-foreground'}`}
          >
            {name}: {amount}{!isBuilt && ` (${has})`}
          </span>
        );
      })}
    </div>
  );
}

// ─── Specialists Tab ─────────────────────────────────────────────────

function SpecialistsTab({
  domain,
  campaignId,
  canEdit,
  allEntities,
  onViewEntity,
}: {
  domain: Domain;
  campaignId: string;
  canEdit: boolean;
  allEntities: WorldEntity[];
  onViewEntity: (entity: WorldEntity) => void;
}) {
  const [recruitingId, setRecruitingId] = useState<string | null>(null);
  const [npcSearch, setNpcSearch] = useState('');
  const recruitSpecialist = useRecruitSpecialist();

  const npcEntities = allEntities.filter(
    (e) => e.type === 'npc' || e.type === 'npc_minor',
  );

  function filteredNpcs() {
    if (!npcSearch.trim()) return npcEntities.slice(0, 10);
    const q = npcSearch.toLowerCase();
    return npcEntities.filter((e) => e.name.toLowerCase().includes(q)).slice(0, 10);
  }

  function handleRecruit(specialistId: string, npc?: WorldEntity) {
    recruitSpecialist.mutate(
      {
        campaignId,
        domainId: domain._id,
        data: {
          specialistId,
          name: npc?.name,
          npcEntityId: npc?._id,
        },
      },
      {
        onSuccess: () => {
          setRecruitingId(null);
          setNpcSearch('');
          toast.success('Specialist recruited');
        },
        onError: () => toast.error('Failed to recruit specialist'),
      },
    );
  }

  if (domain.specialists.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gold/30 bg-card/30 p-8 text-center">
        <UserCheck className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="mt-2 font-['IM_Fell_English'] text-muted-foreground">No specialists configured</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {domain.specialists.map((spec) => {
        const specId = spec._id ?? spec.role;
        const isRecruiting = recruitingId === specId;
        return (
          <div key={specId} className="rounded-lg border border-border bg-card p-4">
            {renderSpecialistInfo(spec, allEntities, onViewEntity)}
            {renderSpecialistActions(
              spec,
              specId,
              canEdit,
              isRecruiting,
              setRecruitingId,
              npcSearch,
              setNpcSearch,
              filteredNpcs(),
              recruitSpecialist.isPending,
              handleRecruit,
            )}
          </div>
        );
      })}
    </div>
  );
}

function renderSpecialistInfo(
  spec: DomainSpecialist,
  allEntities: WorldEntity[],
  onViewEntity: (entity: WorldEntity) => void,
) {
  const linkedEntity = spec.npcEntityId
    ? allEntities.find((e) => e._id === spec.npcEntityId)
    : undefined;

  return (
    <div>
      <div className="flex items-center gap-2">
        <UserCheck className={`h-4 w-4 ${spec.recruited ? 'text-[hsl(150,50%,55%)]' : 'text-muted-foreground/50'}`} />
        <span className="font-[Cinzel] text-xs font-semibold uppercase tracking-wider text-foreground">
          {spec.role}
        </span>
        {spec.recruited && (
          <span className="rounded bg-forest/15 px-2 py-0.5 text-[10px] font-[Cinzel] uppercase tracking-wider text-[hsl(150,50%,55%)]">
            Recruited
          </span>
        )}
      </div>
      {spec.recruited && spec.name && (
        <p className="mt-1 text-sm text-foreground">
          {linkedEntity ? (
            <button
              onClick={() => onViewEntity(linkedEntity)}
              className="text-gold underline decoration-gold/30 hover:decoration-gold/60 transition-colors"
            >
              {spec.name}
            </button>
          ) : (
            spec.name
          )}
        </p>
      )}
      {spec.bonus && (
        <p className="mt-1 font-['IM_Fell_English'] text-xs italic text-muted-foreground">
          {spec.bonus}
        </p>
      )}
    </div>
  );
}

function renderSpecialistActions(
  spec: DomainSpecialist,
  specId: string,
  canEdit: boolean,
  isRecruiting: boolean,
  setRecruitingId: (v: string | null) => void,
  npcSearch: string,
  setNpcSearch: (v: string) => void,
  filteredNpcs: WorldEntity[],
  isPending: boolean,
  handleRecruit: (specialistId: string, npc?: WorldEntity) => void,
) {
  if (spec.recruited || !canEdit) return null;

  if (!isRecruiting) {
    return (
      <div className="mt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setRecruitingId(specId);
            setNpcSearch('');
          }}
        >
          <Plus className="mr-1 h-3 w-3" />
          Recruit
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {renderNpcSearchInput(npcSearch, setNpcSearch)}
      {renderNpcDropdown(filteredNpcs, specId, isPending, handleRecruit)}
      {renderRecruitCancel(setRecruitingId)}
    </div>
  );
}

function renderNpcSearchInput(
  npcSearch: string,
  setNpcSearch: (v: string) => void,
) {
  return (
    <input
      type="text"
      value={npcSearch}
      onChange={(e) => setNpcSearch(e.target.value)}
      placeholder="Search NPCs..."
      autoFocus
      className="block w-full rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground input-carved font-[Cinzel]"
    />
  );
}

function renderNpcDropdown(
  filteredNpcs: WorldEntity[],
  specId: string,
  isPending: boolean,
  handleRecruit: (specialistId: string, npc?: WorldEntity) => void,
) {
  if (filteredNpcs.length === 0) {
    return (
      <p className="text-xs text-muted-foreground font-['IM_Fell_English'] italic">
        No matching NPCs found
      </p>
    );
  }

  return (
    <div className="max-h-40 overflow-y-auto rounded-md border border-border bg-muted/50">
      {filteredNpcs.map((npc) => (
        <button
          key={npc._id}
          onClick={() => handleRecruit(specId, npc)}
          disabled={isPending}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-accent/50 transition-colors disabled:opacity-50"
        >
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-[Cinzel] text-xs">{npc.name}</span>
          <span className="ml-auto text-[10px] text-muted-foreground uppercase font-[Cinzel]">
            {npc.type === 'npc_minor' ? 'Minor' : 'NPC'}
          </span>
        </button>
      ))}
    </div>
  );
}

function renderRecruitCancel(setRecruitingId: (v: string | null) => void) {
  return (
    <Button variant="ghost" size="sm" onClick={() => setRecruitingId(null)}>
      Cancel
    </Button>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export function DomainPanel({
  campaignId,
  locationEntityId,
  canEdit,
  allEntities,
  onViewEntity,
}: DomainPanelProps) {
  const { data: domain, isLoading } = useDomainByLocation(campaignId, locationEntityId);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );
  }

  if (!domain && !canEdit) return null;

  if (!domain) {
    return <CreateDomainForm campaignId={campaignId} locationEntityId={locationEntityId} />;
  }

  return (
    <div className="space-y-4">
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
      {renderActiveTab(activeTab, domain, campaignId, canEdit, allEntities, onViewEntity)}
    </div>
  );
}

function renderActiveTab(
  activeTab: TabKey,
  domain: Domain,
  campaignId: string,
  canEdit: boolean,
  allEntities: WorldEntity[],
  onViewEntity: (entity: WorldEntity) => void,
) {
  switch (activeTab) {
    case 'overview':
      return <OverviewTab domain={domain} campaignId={campaignId} canEdit={canEdit} />;
    case 'resources':
      return <ResourcesTab domain={domain} campaignId={campaignId} canEdit={canEdit} />;
    case 'upgrades':
      return <UpgradesTab domain={domain} campaignId={campaignId} canEdit={canEdit} />;
    case 'specialists':
      return (
        <SpecialistsTab
          domain={domain}
          campaignId={campaignId}
          canEdit={canEdit}
          allEntities={allEntities}
          onViewEntity={onViewEntity}
        />
      );
  }
}
