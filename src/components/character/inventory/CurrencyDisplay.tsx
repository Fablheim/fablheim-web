import { useState } from 'react';
import { Coins, Pencil, Check, X } from 'lucide-react';
import type { CharacterCurrency } from '@/types/item';

interface CurrencyDisplayProps {
  currency: CharacterCurrency | undefined;
  onUpdate: (data: Partial<CharacterCurrency>) => void;
  isPending?: boolean;
}

const DENOMINATIONS = [
  { key: 'pp' as const, label: 'PP', color: 'text-slate-300' },
  { key: 'gp' as const, label: 'GP', color: 'text-amber-400' },
  { key: 'ep' as const, label: 'EP', color: 'text-blue-300' },
  { key: 'sp' as const, label: 'SP', color: 'text-gray-300' },
  { key: 'cp' as const, label: 'CP', color: 'text-orange-400' },
] as const;

const inputClass =
  'w-16 rounded-sm border border-input bg-input px-2 py-1 text-center text-xs text-foreground input-carved';

export function CurrencyDisplay({ currency, onUpdate, isPending }: CurrencyDisplayProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 });

  function startEdit() {
    setDraft({
      cp: currency?.cp ?? 0,
      sp: currency?.sp ?? 0,
      ep: currency?.ep ?? 0,
      gp: currency?.gp ?? 0,
      pp: currency?.pp ?? 0,
    });
    setEditing(true);
  }

  function handleSave() {
    onUpdate(draft);
    setEditing(false);
  }

  function handleCancel() {
    setEditing(false);
  }

  function updateDenom(key: keyof typeof draft, value: string) {
    const num = parseInt(value) || 0;
    setDraft((prev) => ({ ...prev, [key]: Math.max(0, num) }));
  }

  return (
    <div className="rounded-md border border-border bg-card/50 p-3">
      {renderHeader(editing, isPending, startEdit, handleSave, handleCancel)}
      {renderDenominations(editing, currency, draft, updateDenom)}
    </div>
  );
}

function renderHeader(
  editing: boolean,
  isPending: boolean | undefined,
  startEdit: () => void,
  handleSave: () => void,
  handleCancel: () => void,
) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <Coins className="h-3.5 w-3.5 text-amber-400" />
        <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
          Currency
        </span>
      </div>
      {editing ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="rounded p-1 text-emerald-400 hover:bg-emerald-900/30"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded p-1 text-muted-foreground hover:bg-muted/50"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={startEdit}
          className="rounded p-1 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        >
          <Pencil className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function renderDenominations(
  editing: boolean,
  currency: CharacterCurrency | undefined,
  draft: { cp: number; sp: number; ep: number; gp: number; pp: number },
  updateDenom: (key: 'cp' | 'sp' | 'ep' | 'gp' | 'pp', value: string) => void,
) {
  return (
    <div className="flex items-center gap-3">
      {DENOMINATIONS.map((d) => (
        <div key={d.key} className="flex flex-col items-center gap-1">
          <span className={`text-[10px] font-bold ${d.color}`}>{d.label}</span>
          {editing ? (
            <input
              type="number"
              min={0}
              value={draft[d.key]}
              onChange={(e) => updateDenom(d.key, e.target.value)}
              className={inputClass}
            />
          ) : (
            <span className="text-sm font-medium text-foreground">
              {currency?.[d.key] ?? 0}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
