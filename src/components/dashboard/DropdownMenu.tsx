import { useEffect, useRef, type ReactNode } from 'react';

interface DropdownMenuProps {
  trigger: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  align?: 'left' | 'right';
  width?: string;
}

export function DropdownMenu({
  trigger,
  open,
  onOpenChange,
  children,
  align = 'left',
  width = 'w-72',
}: DropdownMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onOpenChange(false);
    }

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={ref} className="relative">
      {trigger}
      {open && (
        <div
          className={`absolute top-full z-50 mt-2 ${width} ${align === 'right' ? 'right-0' : 'left-0'} animate-unfurl`}
        >
          <div className="mkt-card rounded-lg border border-[color:var(--mkt-border)] py-1 shadow-[0_10px_30px_hsla(24,35%,5%,0.45)]">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

interface DropdownMenuItemProps {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  description?: string;
  onClick: () => void;
  active?: boolean;
  badge?: ReactNode;
  className?: string;
}

export function DropdownMenuItem({
  icon: Icon,
  label,
  description,
  onClick,
  active,
  badge,
  className = '',
}: DropdownMenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-[hsla(38,30%,30%,0.08)] ${
        active
          ? 'border-l-2 border-primary bg-primary/8 text-primary'
          : 'text-[color:var(--mkt-text)]'
      } ${className}`}
    >
      {Icon && <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-primary' : 'text-[color:var(--mkt-muted)]'}`} />}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{label}</p>
        {description && (
          <p className="truncate text-xs text-[color:var(--mkt-muted)]">{description}</p>
        )}
      </div>
      {badge}
    </button>
  );
}

export function DropdownMenuDivider() {
  return <div className="my-1 h-px bg-[color:var(--mkt-border)]" />;
}

export function DropdownMenuLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-3 py-1.5 font-[Cinzel] text-[10px] font-semibold uppercase tracking-widest text-[color:var(--mkt-muted)]">
      {children}
    </p>
  );
}
