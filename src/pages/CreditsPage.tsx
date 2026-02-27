import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Coins, TrendingDown, Gift, Clock, Sparkles, ShoppingCart, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { UpgradeModal } from '@/components/ui/UpgradeModal';
import { useAuth } from '@/context/AuthContext';
import { useCreditBalance, useCreditHistory, useCreditCosts } from '@/hooks/useCredits';
import { stripeApi } from '@/api/stripe';
import type { CreditTransaction } from '@/types/credits';

const FEATURE_LABELS: Record<string, string> = {
  rule_questions: 'Rule Question',
  plot_hooks: 'Plot Hooks',
  npc_generation: 'NPC Generation',
  character_creation: 'Character Suggestions',
  backstory: 'Backstory',
  world_building: 'World Building',
  session_summary: 'Session Summary',
  encounter_building: 'Encounter Builder',
};

function CreditBalanceCard() {
  const { data: balance, isLoading } = useCreditBalance();
  const [buyLoading, setBuyLoading] = useState(false);

  const handleBuyCredits = async () => {
    setBuyLoading(true);
    try {
      const { url } = await stripeApi.createCreditPurchaseCheckout();
      window.location.href = url;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to start checkout');
      setBuyLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 animate-pulse">
        <div className="h-20 bg-muted rounded" />
      </div>
    );
  }

  if (!balance) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="mb-4 font-['IM_Fell_English'] text-lg font-semibold text-card-foreground">
        Credit Balance
      </h2>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Coins className="h-7 w-7 text-primary" />
        </div>
        <div>
          <p className="font-['Cinzel'] text-3xl font-bold text-foreground">{balance.total}</p>
          <p className="text-sm text-muted-foreground">Total credits available</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="rounded-md border border-border bg-background/50 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Gift className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Subscription</span>
          </div>
          <p className="font-['Cinzel'] text-xl font-semibold text-foreground">{balance.subscription}</p>
        </div>
        <div className="rounded-md border border-border bg-background/50 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Coins className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Purchased</span>
          </div>
          <p className="font-['Cinzel'] text-xl font-semibold text-foreground">{balance.purchased}</p>
        </div>
      </div>

      <Button
        onClick={handleBuyCredits}
        disabled={buyLoading}
        variant="outline"
        className="w-full"
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        {buyLoading ? 'Loading...' : 'Buy 150 Credits — $4.99'}
      </Button>
    </div>
  );
}

function CreditCostsCard() {
  const { data: costs, isLoading } = useCreditCosts();

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 animate-pulse">
        <div className="h-40 bg-muted rounded" />
      </div>
    );
  }

  if (!costs) return null;

  const sortedEntries = Object.entries(costs).sort(([, a], [, b]) => a - b);

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="mb-4 font-['IM_Fell_English'] text-lg font-semibold text-card-foreground">
        Credit Costs
      </h2>
      <div className="space-y-2">
        {sortedEntries.map(([feature, cost]) => (
          <div key={feature} className="flex items-center justify-between rounded-md bg-background/50 px-3 py-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary/60" />
              <span className="text-sm text-foreground">{FEATURE_LABELS[feature] || feature}</span>
            </div>
            <span className="font-['Cinzel'] text-sm font-semibold text-primary">{cost} cr</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TransactionIcon({ type }: { type: CreditTransaction['type'] }) {
  switch (type) {
    case 'consumption':
      return <TrendingDown className="h-4 w-4 text-red-400" />;
    case 'grant':
      return <Gift className="h-4 w-4 text-green-400" />;
    case 'expiry':
      return <Clock className="h-4 w-4 text-yellow-500" />;
  }
}

function CreditHistoryCard() {
  const { data: transactions, isLoading } = useCreditHistory(50);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 animate-pulse">
        <div className="h-60 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="mb-4 font-['IM_Fell_English'] text-lg font-semibold text-card-foreground">
        Transaction History
      </h2>

      {!transactions?.length ? (
        <p className="text-sm text-muted-foreground italic">No transactions yet.</p>
      ) : (
        <div className="space-y-1">
          {transactions.map((tx) => (
            <div key={tx._id} className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-background/50">
              <TransactionIcon type={tx.type} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{tx.description}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(tx.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-semibold ${tx.amount < 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount}
                </p>
                <p className="text-xs text-muted-foreground">{tx.balanceAfter} bal</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CreditsPage() {
  const { user } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const purchase = searchParams.get('purchase');
    if (purchase === 'success') {
      toast.success('Credits purchased successfully! They have been added to your balance.');
      searchParams.delete('purchase');
      setSearchParams(searchParams, { replace: true });
    } else if (purchase === 'cancelled') {
      toast.info('Credit purchase was cancelled.');
      searchParams.delete('purchase');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return (
    <PageContainer
      title="Credits"
      subtitle="Manage your arcane credit balance"
      actions={
        user?.subscriptionTier === 'free' ? (
          <Button onClick={() => setShowUpgrade(true)}>
            <Crown className="mr-2 h-4 w-4" />
            Upgrade Plan
          </Button>
        ) : undefined
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr] xl:grid-cols-[1fr_1fr_2fr]">
        <CreditBalanceCard />
        <CreditCostsCard />
        <div className="lg:col-span-2 xl:col-span-1">
          <CreditHistoryCard />
        </div>
      </div>

      {showUpgrade && (
        <UpgradeModal
          currentTier={user?.subscriptionTier ?? 'free'}
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </PageContainer>
  );
}
