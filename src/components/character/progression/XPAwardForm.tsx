import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface XPAwardFormProps {
  onSubmit: (amount: number, reason?: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function XPAwardForm({ onSubmit, onCancel, isLoading }: XPAwardFormProps) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseInt(amount);
    if (isNaN(parsed) || parsed <= 0) return;
    onSubmit(parsed, reason || undefined);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="XP amount"
          min="1"
          className="w-24 rounded-sm border border-border bg-muted/50 px-2 py-1.5 text-center text-sm text-foreground placeholder:text-muted-foreground focus:border-amber-500 focus:outline-none"
          autoFocus
        />
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional)"
          className="flex-1 rounded-sm border border-border bg-muted/50 px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-amber-500 focus:outline-none"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!amount || isLoading}
        >
          {isLoading ? 'Awarding...' : 'Award XP'}
        </Button>
      </div>
    </form>
  );
}
