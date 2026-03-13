import { useState, useCallback } from 'react';
import { Coins, Plus, Minus, Loader2, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { useTreasury, useAddTreasuryTransaction } from '@/hooks/useTreasury';
import { useCampaignModuleEnabled } from '@/hooks/useModuleEnabled';

interface TreasuryPanelProps {
  campaignId: string;
}

type Currency = 'cp' | 'sp' | 'ep' | 'gp' | 'pp';

const CURRENCY_ORDER: Currency[] = ['pp', 'gp', 'ep', 'sp', 'cp'];

const CURRENCY_STYLES: Record<Currency, { label: string; color: string }> = {
  pp: { label: 'PP', color: 'text-blue-300' },
  gp: { label: 'GP', color: 'text-yellow-400' },
  ep: { label: 'EP', color: 'text-gray-300' },
  sp: { label: 'SP', color: 'text-gray-400' },
  cp: { label: 'CP', color: 'text-amber-600' },
};

export function TreasuryPanel({ campaignId }: TreasuryPanelProps) {
  const enabled = useCampaignModuleEnabled(campaignId, 'party-treasury');
  const { data: treasury, isLoading } = useTreasury(campaignId);
  const addTransaction = useAddTreasuryTransaction(campaignId);

  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('gp');
  const [description, setDescription] = useState('');
  const [showLedger, setShowLedger] = useState(false);

  const handleSubmit = useCallback(() => {
    const parsedAmount = parseInt(amount, 10);
    if (isNaN(parsedAmount) || parsedAmount < 1) {
      toast.error('Enter a valid amount');
      return;
    }
    if (!description.trim()) {
      toast.error('Enter a description');
      return;
    }
    addTransaction.mutate(
      {
        amount: parsedAmount,
        currency,
        type: formType,
        description: description.trim(),
      },
      {
        onSuccess: () => {
          setAmount('');
          setDescription('');
          setShowForm(false);
          toast.success(`${formType === 'deposit' ? 'Deposited' : 'Withdrew'} ${parsedAmount} ${currency.toUpperCase()}`);
        },
        onError: (err: Error) => toast.error(err.message || 'Transaction failed'),
      },
    );
  }, [amount, currency, formType, description, addTransaction]);

  if (!enabled) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Coins className="h-4 w-4 text-yellow-400" />
          <h3 className="font-[Cinzel] text-xs font-semibold uppercase tracking-wider text-foreground">
            Party Treasury
          </h3>
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setFormType('deposit'); setShowForm(!showForm); }}
            title="Deposit"
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setFormType('withdrawal'); setShowForm(!showForm); }}
            title="Withdraw"
          >
            <Minus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Balance Display */}
      <div className="grid grid-cols-5 gap-1">
        {CURRENCY_ORDER.map((c) => (
          <div
            key={c}
            className="flex flex-col items-center rounded-sm border border-border/40 bg-card/50 px-2 py-1.5"
          >
            <span className={`font-[Cinzel] text-sm font-bold ${CURRENCY_STYLES[c].color}`}>
              {treasury?.[c] ?? 0}
            </span>
            <span className="font-[Cinzel] text-[9px] uppercase tracking-wider text-muted-foreground">
              {CURRENCY_STYLES[c].label}
            </span>
          </div>
        ))}
      </div>

      {/* Transaction Form */}
      {showForm && (
        <div className="rounded-md border border-border bg-card/50 p-3 space-y-2">
          <p className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
            {formType === 'deposit' ? 'Deposit' : 'Withdraw'}
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className="w-20 rounded border border-border bg-background px-2 py-1 text-sm"
            />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="rounded border border-border bg-background px-2 py-1 text-sm"
            >
              {CURRENCY_ORDER.map((c) => (
                <option key={c} value={c}>{c.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (e.g. Dragon hoard loot)"
            maxLength={200}
            className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
          />
          <div className="flex justify-end gap-1.5">
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={addTransaction.isPending}>
              {addTransaction.isPending ? 'Saving...' : formType === 'deposit' ? 'Deposit' : 'Withdraw'}
            </Button>
          </div>
        </div>
      )}

      {/* Ledger Toggle */}
      <button
        type="button"
        onClick={() => setShowLedger(!showLedger)}
        className="flex w-full items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowUpDown className="h-3 w-3" />
        <span className="font-[Cinzel] uppercase tracking-wider">
          {showLedger ? 'Hide' : 'Show'} Transaction Log
        </span>
      </button>

      {/* Ledger */}
      {showLedger && treasury?.ledger && (
        <div className="max-h-48 overflow-y-auto space-y-1">
          {[...treasury.ledger]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 30)
            .map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-sm border border-border/30 bg-background/30 px-2 py-1"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-foreground">{entry.description}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleDateString()}
                    {entry.characterName ? ` · ${entry.characterName}` : ''}
                  </p>
                </div>
                <span
                  className={`shrink-0 font-[Cinzel] text-xs font-medium ${
                    entry.type === 'deposit' ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {entry.type === 'deposit' ? '+' : '-'}{entry.amount} {entry.currency.toUpperCase()}
                </span>
              </div>
            ))}
          {treasury.ledger.length === 0 && (
            <p className="py-3 text-center text-xs text-muted-foreground italic">No transactions yet</p>
          )}
        </div>
      )}
    </div>
  );
}
