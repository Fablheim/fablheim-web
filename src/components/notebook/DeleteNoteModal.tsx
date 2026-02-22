import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DeleteNoteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  noteTitle: string;
}

export function DeleteNoteModal({
  open,
  onClose,
  onConfirm,
  isPending,
  noteTitle,
}: DeleteNoteModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 w-full max-w-md rounded-lg border border-border p-6 tavern-card iron-brackets texture-parchment">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground font-['IM_Fell_English']">Delete Note</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <p className="mb-6 text-sm text-muted-foreground">
          Are you sure you want to delete{' '}
          <span className="font-medium text-foreground">"{noteTitle}"</span>?
          This action cannot be undone.
        </p>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
}
