import { useState } from 'react';
import { Loader2, Copy, Check, BookmarkPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  useGenerateWorldNPC,
  useGenerateLocation,
  useGenerateTavern,
  useGenerateShop,
} from '@/hooks/useAITools';
import type { WorldEntity } from '@/types/campaign';
import type { WorldNPCRole, LocationType, TavernTone, ShopType } from '@/types/ai-tools';

interface QuickContentProps {
  campaignId: string;
}

type QuickTab = 'names' | 'locations' | 'items';

const tabDefs: { key: QuickTab; label: string }[] = [
  { key: 'names', label: 'NPCs' },
  { key: 'locations', label: 'Locations' },
  { key: 'items', label: 'Shops & Taverns' },
];

const NPC_ROLES: { value: WorldNPCRole; label: string }[] = [
  { value: 'quest_giver', label: 'Quest Giver' },
  { value: 'merchant', label: 'Merchant' },
  { value: 'information', label: 'Information' },
  { value: 'ally', label: 'Ally' },
  { value: 'villain', label: 'Villain' },
  { value: 'neutral', label: 'Neutral' },
];

const LOCATION_TYPES: { value: LocationType; label: string }[] = [
  { value: 'village', label: 'Village' },
  { value: 'town', label: 'Town' },
  { value: 'city', label: 'City' },
  { value: 'dungeon', label: 'Dungeon' },
  { value: 'wilderness', label: 'Wilderness' },
  { value: 'landmark', label: 'Landmark' },
];

const TAVERN_TONES: { value: TavernTone; label: string }[] = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'rough', label: 'Rough' },
  { value: 'mysterious', label: 'Mysterious' },
  { value: 'upscale', label: 'Upscale' },
  { value: 'seedy', label: 'Seedy' },
];

const SHOP_TYPES: { value: ShopType; label: string }[] = [
  { value: 'general', label: 'General Store' },
  { value: 'blacksmith', label: 'Blacksmith' },
  { value: 'alchemist', label: 'Alchemist' },
  { value: 'magic', label: 'Magic Shop' },
  { value: 'books', label: 'Bookshop' },
  { value: 'exotic', label: 'Exotic Goods' },
  { value: 'fence', label: 'Fence' },
];

const inputClass =
  'mt-1 block w-full rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground input-carved font-[Cinzel]';

const labelClass =
  'block font-[Cinzel] text-xs uppercase tracking-wider text-foreground';

export function QuickContent({ campaignId }: QuickContentProps) {
  const [tab, setTab] = useState<QuickTab>('names');
  const [result, setResult] = useState<WorldEntity | null>(null);
  const [copied, setCopied] = useState(false);

  // NPC state
  const [npcRole, setNpcRole] = useState<WorldNPCRole>('neutral');
  const [npcPrompt, setNpcPrompt] = useState('');

  // Location state
  const [locationType, setLocationType] = useState<LocationType>('village');
  const [locationPrompt, setLocationPrompt] = useState('');

  // Tavern/Shop state
  const [genType, setGenType] = useState<'tavern' | 'shop'>('tavern');
  const [tavernTone, setTavernTone] = useState<TavernTone>('friendly');
  const [shopType, setShopType] = useState<ShopType>('general');

  const genNPC = useGenerateWorldNPC();
  const genLocation = useGenerateLocation();
  const genTavern = useGenerateTavern();
  const genShop = useGenerateShop();

  const isPending = genNPC.isPending || genLocation.isPending || genTavern.isPending || genShop.isPending;
  const error = genNPC.error || genLocation.error || genTavern.error || genShop.error;

  async function handleGenerateNPC() {
    setResult(null);
    const data = await genNPC.mutateAsync({
      campaignId,
      role: npcRole,
      importance: 'minor',
      prompt: npcPrompt.trim() || undefined,
    });
    setResult(data);
  }

  async function handleGenerateLocation() {
    setResult(null);
    const data = await genLocation.mutateAsync({
      campaignId,
      locationType,
      prompt: locationPrompt.trim() || undefined,
    });
    setResult(data);
  }

  async function handleGenerateTavern() {
    setResult(null);
    const data = await genTavern.mutateAsync({
      campaignId,
      tone: tavernTone,
    });
    setResult(data);
  }

  async function handleGenerateShop() {
    setResult(null);
    const data = await genShop.mutateAsync({
      campaignId,
      shopType,
    });
    setResult(data);
  }

  function handleGenerate() {
    if (tab === 'names') handleGenerateNPC();
    else if (tab === 'locations') handleGenerateLocation();
    else if (genType === 'tavern') handleGenerateTavern();
    else handleGenerateShop();
  }

  async function handleCopy() {
    if (!result) return;
    const parts = [
      `Name: ${result.name}`,
      result.description ? `\n${result.description}` : '',
    ];
    if (result.typeData) {
      for (const [k, v] of Object.entries(result.typeData)) {
        if (v && typeof v === 'string') parts.push(`${k}: ${v}`);
      }
    }
    await navigator.clipboard.writeText(parts.filter(Boolean).join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabDefs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setResult(null); }}
            className={`border-b-2 px-3 py-1.5 font-[Cinzel] text-xs uppercase tracking-wider transition-colors ${
              tab === t.key
                ? 'border-brass text-brass'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* NPC tab */}
      {tab === 'names' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="qc-npc-role" className={labelClass}>Role</label>
              <select
                id="qc-npc-role"
                value={npcRole}
                onChange={(e) => setNpcRole(e.target.value as WorldNPCRole)}
                className={inputClass}
              >
                {NPC_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="qc-npc-prompt" className={labelClass}>Details (optional)</label>
              <input
                id="qc-npc-prompt"
                type="text"
                value={npcPrompt}
                onChange={(e) => setNpcPrompt(e.target.value)}
                placeholder="A scarred dwarf..."
                maxLength={500}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      )}

      {/* Location tab */}
      {tab === 'locations' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="qc-loc-type" className={labelClass}>Type</label>
              <select
                id="qc-loc-type"
                value={locationType}
                onChange={(e) => setLocationType(e.target.value as LocationType)}
                className={inputClass}
              >
                {LOCATION_TYPES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="qc-loc-prompt" className={labelClass}>Details (optional)</label>
              <input
                id="qc-loc-prompt"
                type="text"
                value={locationPrompt}
                onChange={(e) => setLocationPrompt(e.target.value)}
                placeholder="Near a cursed swamp..."
                maxLength={500}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      )}

      {/* Shops & Taverns tab */}
      {tab === 'items' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Generate</label>
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => setGenType('tavern')}
                  className={`flex-1 rounded-sm border px-3 py-2 font-[Cinzel] text-xs uppercase tracking-wider transition-colors ${
                    genType === 'tavern'
                      ? 'border-brass/40 bg-brass/10 text-brass'
                      : 'border-input bg-input text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Tavern
                </button>
                <button
                  type="button"
                  onClick={() => setGenType('shop')}
                  className={`flex-1 rounded-sm border px-3 py-2 font-[Cinzel] text-xs uppercase tracking-wider transition-colors ${
                    genType === 'shop'
                      ? 'border-brass/40 bg-brass/10 text-brass'
                      : 'border-input bg-input text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Shop
                </button>
              </div>
            </div>
            <div>
              {genType === 'tavern' ? (
                <>
                  <label htmlFor="qc-tavern-tone" className={labelClass}>Tone</label>
                  <select
                    id="qc-tavern-tone"
                    value={tavernTone}
                    onChange={(e) => setTavernTone(e.target.value as TavernTone)}
                    className={inputClass}
                  >
                    {TAVERN_TONES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <label htmlFor="qc-shop-type" className={labelClass}>Shop Type</label>
                  <select
                    id="qc-shop-type"
                    value={shopType}
                    onChange={(e) => setShopType(e.target.value as ShopType)}
                    className={inputClass}
                  >
                    {SHOP_TYPES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Generate button */}
      <Button
        onClick={handleGenerate}
        disabled={isPending}
        className="shadow-glow"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          `Generate ${tab === 'names' ? 'NPC' : tab === 'locations' ? 'Location' : genType === 'tavern' ? 'Tavern' : 'Shop'}`
        )}
      </Button>

      {error && (
        <p className="text-sm text-destructive">
          {(error as Error).message || 'Generation failed'}
        </p>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-3 rounded-md border border-border bg-background/40 p-4 texture-leather">
          <div className="flex items-start justify-between">
            <h4 className="font-['IM_Fell_English'] text-lg text-card-foreground">{result.name}</h4>
            <span className="rounded-md bg-forest/20 px-2 py-0.5 font-[Cinzel] text-[10px] uppercase tracking-wider text-[hsl(150,50%,55%)]">
              {result.type.replace('_', ' ')}
            </span>
          </div>

          {result.description && (
            <p className="text-sm leading-relaxed text-foreground">{result.description}</p>
          )}

          {/* Type-specific data */}
          {result.typeData && Object.keys(result.typeData).length > 0 && (
            <div className="space-y-2">
              {Object.entries(result.typeData).map(([key, value]) => {
                if (!value) return null;
                const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
                return (
                  <div key={key}>
                    <p className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
                    <p className="mt-0.5 text-sm text-foreground">{typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}</p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="secondary" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </Button>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-forest/15 px-2.5 py-1 text-xs text-[hsl(150,50%,55%)]">
              <BookmarkPlus className="h-3.5 w-3.5" />
              Auto-saved to World
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
