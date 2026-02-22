import { useState, useRef, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface EditableTextSectionProps {
  label: string;
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  canEdit: boolean;
}

export function EditableTextSection({
  label,
  value,
  onSave,
  placeholder = 'Click to add...',
  maxLength = 5000,
  canEdit,
}: EditableTextSectionProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [editing]);

  function handleEdit() {
    setDraft(value);
    setEditing(true);
  }

  function handleSave() {
    const trimmed = draft.trim();
    if (trimmed !== value) {
      onSave(trimmed);
    }
    setEditing(false);
  }

  function handleCancel() {
    setDraft(value);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      handleCancel();
    }
  }

  if (editing) {
    return (
      <div>
        <p className="mb-2 font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={maxLength}
          rows={6}
          placeholder={placeholder}
          className="w-full rounded-sm border border-input bg-input px-3 py-2 font-['IM_Fell_English'] text-sm italic leading-relaxed text-foreground placeholder:text-muted-foreground input-carved"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {draft.length}/{maxLength}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              <X className="mr-1 h-3.5 w-3.5" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Check className="mr-1 h-3.5 w-3.5" />
              Save
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const hasContent = value.trim().length > 0;

  return (
    <div className="group">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {canEdit && (
          <button
            type="button"
            onClick={handleEdit}
            className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted/80 hover:text-foreground group-hover:opacity-100"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {hasContent ? (
        <p
          className={`whitespace-pre-wrap font-['IM_Fell_English'] text-sm italic leading-relaxed text-muted-foreground ${canEdit ? 'cursor-pointer rounded-md transition-colors hover:bg-background/40' : ''}`}
          onClick={canEdit ? handleEdit : undefined}
        >
          {value}
        </p>
      ) : canEdit ? (
        <button
          type="button"
          onClick={handleEdit}
          className="w-full rounded-md border-2 border-dashed border-gold/20 px-4 py-3 text-left font-['IM_Fell_English'] text-sm italic text-muted-foreground/60 transition-colors hover:border-gold/40 hover:bg-background/30"
        >
          {placeholder}
        </button>
      ) : null}
    </div>
  );
}
