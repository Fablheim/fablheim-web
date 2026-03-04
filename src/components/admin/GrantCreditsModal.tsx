import { useState } from 'react';
import { X, Coins, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useGrantCredits } from '@/hooks/useAdmin';

interface GrantCreditsModalProps {
  userId: string;
  username: string;
  onClose: () => void;
}

export function GrantCreditsModal({ userId, username, onClose }: GrantCreditsModalProps) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const grantCredits = useGrantCredits();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = parseInt(amount, 10);
    if (!parsedAmount || parsedAmount < 1) {
      toast.error('Amount must be at least 1');
      return;
    }
    if (!reason.trim()) {
      toast.error('Reason is required');
      return;
    }

    const idempotencyKey = `admin-grant-${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    grantCredits.mutate(
      { userId, dto: { amount: parsedAmount, reason: reason.trim(), idempotencyKey, sendEmail } },
      {
        onSuccess: (result) => {
          toast.success(`Granted ${result.amount} credits to ${username}`);
          onClose();
        },
        onError: () => toast.error('Failed to grant credits'),
      },
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl border border-border/60 bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Grant Credits</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <p className="text-sm text-muted-foreground">
            Granting credits to <span className="font-medium text-foreground">{username}</span>.
            Credits never expire and can be used for any AI feature.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Amount
            </label>
            <input
              type="number"
              min={1}
              max={10000}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 100"
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Compensation for service interruption"
              required
              rows={3}
              maxLength={500}
              className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-right text-[10px] text-muted-foreground">{reason.length}/500</p>
          </div>

          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="h-3.5 w-3.5 accent-primary"
            />
            <span className="text-sm text-muted-foreground">Send email notification to user</span>
          </label>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={grantCredits.isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {grantCredits.isPending ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Granting...</>
              ) : (
                <><Coins className="h-3.5 w-3.5" /> Grant Credits</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
