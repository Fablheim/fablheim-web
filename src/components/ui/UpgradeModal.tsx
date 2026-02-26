import { useState } from 'react';
import { X, CheckCircle, Crown, Sparkles, Shield } from 'lucide-react';
import { Button } from './Button';
import { stripeApi } from '@/api/stripe';

interface UpgradeModalProps {
  currentTier: 'free' | 'hobbyist' | 'pro' | 'professional';
  onClose: () => void;
}

const tiers = [
  {
    id: 'hobbyist' as const,
    name: 'Hobbyist',
    price: '$4.99',
    period: '/month',
    credits: 100,
    icon: Sparkles,
    features: [
      '100 AI credits per month',
      'Credits expire after 90 days',
      'All campaign management features',
      'Community support',
    ],
  },
  {
    id: 'pro' as const,
    name: 'Game Master',
    price: '$9.99',
    period: '/month',
    credits: 300,
    icon: Crown,
    badge: 'BEST VALUE',
    features: [
      '300 AI credits per month',
      'Credits expire after 90 days',
      'Priority access to new features',
      'Purchased credits never expire',
    ],
  },
  {
    id: 'professional' as const,
    name: 'Professional',
    price: '$19.99',
    period: '/month',
    credits: 500,
    icon: Shield,
    features: [
      '500 AI credits per month',
      'Credits expire after 90 days',
      'Priority access to new features',
      'Purchased credits never expire',
    ],
  },
];

export function UpgradeModal({ currentTier, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async (tier: 'hobbyist' | 'pro' | 'professional') => {
    setLoading(tier);
    setError(null);

    try {
      const { url } = await stripeApi.createSubscriptionCheckout(tier);
      window.location.href = url;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start checkout. Please try again.');
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="mx-4 w-full max-w-4xl rounded-lg border border-border bg-card p-6 texture-parchment">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-['IM_Fell_English'] text-2xl font-bold text-primary">
            Upgrade Your Plan
          </h2>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-600 bg-red-900/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            const isCurrent = currentTier === tier.id;

            return (
              <div
                key={tier.id}
                className={`relative rounded-lg border p-5 ${
                  tier.badge
                    ? 'border-primary/50 shadow-[0_0_20px_hsla(38,90%,50%,0.1)]'
                    : 'border-border'
                } bg-background/60`}
              >
                {tier.badge && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 font-[Cinzel] text-[10px] font-bold tracking-widest text-primary-foreground">
                    {tier.badge}
                  </span>
                )}

                <div className="mb-3 flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="font-['IM_Fell_English'] text-lg font-semibold text-foreground">
                    {tier.name}
                  </h3>
                </div>

                <div className="mb-4">
                  <span className="font-['Cinzel'] text-3xl font-bold text-foreground">{tier.price}</span>
                  <span className="text-sm text-muted-foreground">{tier.period}</span>
                </div>

                <ul className="mb-5 space-y-2">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleUpgrade(tier.id)}
                  disabled={loading !== null || isCurrent}
                  variant={tier.badge ? 'primary' : 'outline'}
                  className="w-full"
                >
                  {loading === tier.id
                    ? 'Loading...'
                    : isCurrent
                      ? 'Current Plan'
                      : `Upgrade to ${tier.name}`}
                </Button>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Subscriptions can be cancelled anytime. Credits renew monthly and expire 90 days after grant.
        </p>
      </div>
    </div>
  );
}
