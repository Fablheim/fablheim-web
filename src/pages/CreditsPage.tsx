import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Coins, TrendingDown, Gift, Clock, Sparkles, ShoppingCart, ReceiptText, WandSparkles, ShieldCheck } from 'lucide-react';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { useCreditBalance, useCreditHistory, useCreditCosts } from '@/hooks/useCredits';
import { stripeApi } from '@/api/stripe';
import type { CreditTransaction } from '@/types/credits';
import { BILLING_CONFIG } from '@/config/billingConfig';

const creditsCardClass =
  'app-card rounded-xl border border-[color:var(--mkt-border)]/80 bg-[linear-gradient(180deg,hsla(32,26%,15%,0.28)_0%,hsla(24,16%,8%,0.5)_100%)] p-6';

function CreditBalanceCard() {
  const { data: balance, isLoading } = useCreditBalance();
  const [buyLoading, setBuyLoading] = useState(false);

  const handleBuyCredits = async () => {
    setBuyLoading(true);
    try {
      const { url } = await stripeApi.createCreditPurchaseCheckout();
      window.location.href = url;
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        toast.error(err.response?.data?.message || 'Failed to start checkout');
      } else {
        toast.error('Failed to start checkout');
      }
      setBuyLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`${creditsCardClass} animate-pulse`}>
        <div className="h-20 bg-muted rounded" />
      </div>
    );
  }

  if (!balance) return null;

  return (
    <section className={creditsCardClass}>
      <header className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[color:var(--mkt-border)] bg-black/20 text-primary">
          <Coins className="h-4.5 w-4.5" />
        </span>
        <div>
          <h2 className="font-[Cinzel] text-lg font-semibold text-foreground">Credit Balance</h2>
          <p className="mt-1 text-sm text-muted-foreground">Track your available credits and purchase more instantly.</p>
        </div>
      </header>

      <div className="mb-6 mt-5 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[color:var(--mkt-border)] bg-primary/10">
          <Coins className="h-7 w-7 text-primary" />
        </div>
        <div>
          <p className="font-['Cinzel'] text-3xl font-bold text-foreground">{balance.total}</p>
          <p className="text-sm text-muted-foreground">Total credits available</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="rounded-md border border-border/70 bg-background/50 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Gift className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Subscription</span>
          </div>
          <p className="font-['Cinzel'] text-xl font-semibold text-foreground">{balance.subscription}</p>
        </div>
        <div className="rounded-md border border-border/70 bg-background/50 p-3">
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
        {buyLoading ? 'Loading...' : `Buy ${BILLING_CONFIG.creditPack.credits} Credits — ${BILLING_CONFIG.creditPack.price}`}
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">
        Subscriber bonus per pack: Hobbyist {BILLING_CONFIG.creditPack.bonusCreditsByTier.hobbyist}, Game Master {BILLING_CONFIG.creditPack.bonusCreditsByTier.gamemaster}, Pro {BILLING_CONFIG.creditPack.bonusCreditsByTier.pro}.
      </p>
    </section>
  );
}

function CreditCostsCard() {
  const { data: costs, isLoading } = useCreditCosts();

  if (isLoading) {
    return (
      <div className={`${creditsCardClass} animate-pulse`}>
        <div className="h-40 bg-muted rounded" />
      </div>
    );
  }

  if (!costs) return null;

  const sortedEntries = Object.entries(costs).sort(([, a], [, b]) => a - b);

  return (
    <section className={creditsCardClass}>
      <header className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[color:var(--mkt-border)] bg-black/20 text-primary">
          <WandSparkles className="h-4.5 w-4.5" />
        </span>
        <div>
          <h2 className="font-[Cinzel] text-lg font-semibold text-foreground">AI Credit Costs</h2>
          <p className="mt-1 text-sm text-muted-foreground">Per-action cost transparency across all generation tools.</p>
        </div>
      </header>

      <div className="space-y-2">
        {sortedEntries.map(([feature, cost]) => (
          <div key={feature} className="flex items-center justify-between rounded-md border border-border/65 bg-background/45 px-3 py-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary/60" />
              <span className="text-sm text-foreground">
                {BILLING_CONFIG.aiActionLabels[feature as keyof typeof BILLING_CONFIG.aiActionLabels] || feature}
              </span>
            </div>
            <span className="font-['Cinzel'] text-sm font-semibold text-primary">{cost} cr</span>
          </div>
        ))}
      </div>
    </section>
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
      <div className={`${creditsCardClass} animate-pulse`}>
        <div className="h-60 bg-muted rounded" />
      </div>
    );
  }

  return (
    <section className={creditsCardClass}>
      <header className="mb-4 flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[color:var(--mkt-border)] bg-black/20 text-primary">
          <ReceiptText className="h-4.5 w-4.5" />
        </span>
        <div>
          <h2 className="font-[Cinzel] text-lg font-semibold text-foreground">Transaction History</h2>
          <p className="mt-1 text-sm text-muted-foreground">Recent grants, consumption, and expiry events.</p>
        </div>
      </header>

      {!transactions?.length ? (
        <p className="rounded-md border border-border/65 bg-background/45 p-3 text-sm italic text-muted-foreground">
          No transactions yet.
        </p>
      ) : (
        <div className="space-y-1.5">
          {transactions.map((tx) => (
            <div key={tx._id} className="flex items-center gap-3 rounded-md border border-border/60 bg-background/40 px-3 py-2.5 hover:bg-background/55">
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
    </section>
  );
}

export function CreditsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: recentTransactions } = useCreditHistory(20);

  useEffect(() => {
    const purchase = searchParams.get('purchase');
    if (purchase === 'success') {
      if (!recentTransactions) return;
      const latestPackGrant = recentTransactions.find(
        (tx) =>
          tx.type === 'grant' &&
          tx.description.startsWith('Credits pack applied (includes subscriber bonus if eligible):'),
      );
      if (latestPackGrant) {
        toast.success(`Credits pack applied (includes subscriber bonus if eligible): +${latestPackGrant.amount} credits`);
      } else {
        toast.success('Credits pack applied (includes subscriber bonus if eligible)');
      }
      searchParams.delete('purchase');
      setSearchParams(searchParams, { replace: true });
    } else if (purchase === 'cancelled') {
      toast.info('Credit purchase was cancelled.');
      searchParams.delete('purchase');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, recentTransactions]);

  return (
    <PageContainer
      title="Credits"
      subtitle="Track usage, understand costs, and refill when needed"
    >
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <section className="app-card rounded-xl border border-[color:var(--mkt-border)]/85 bg-[linear-gradient(160deg,hsla(38,84%,56%,0.14)_0%,hsla(24,16%,11%,0.88)_46%,hsla(24,16%,7%,0.94)_100%)] px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Credit Command</p>
              <h2 className="mt-1 font-[Cinzel] text-2xl text-foreground">Transparent AI Usage</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Every generation spends credits based on tool complexity. Costs and history are always visible.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-[color:var(--mkt-border)]/75 bg-black/25 px-3 py-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">No hidden usage math</span>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <CreditBalanceCard />
          <CreditCostsCard />
        </div>

        <div>
          <CreditHistoryCard />
        </div>
      </div>

    </PageContainer>
  );
}
