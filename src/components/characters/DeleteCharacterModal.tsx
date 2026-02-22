import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DeleteCharacterModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  itemName: string;
  itemType: 'character' | 'NPC';
}

export function DeleteCharacterModal({
  open,
  onClose,
  onConfirm,
  isPending,
  itemName,
  itemType,
}: DeleteCharacterModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-lg border border-border border-t-2 border-t-blood/50 bg-card p-6 shadow-warm-lg tavern-card iron-brackets texture-parchment">
        <div className="flex items-center justify-between">
          <h2 className="font-['IM_Fell_English'] text-xl text-card-foreground">
            Delete {itemType}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          Are you sure you want to delete{' '}
          <span className="font-[Cinzel] font-semibold text-foreground">{itemName}</span>?
          This action cannot be undone.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
}
