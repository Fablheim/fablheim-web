import { Heart, Sword, Wand2, Crosshair } from 'lucide-react';
import type { ReactNode } from 'react';

interface TokenHUDProps {
  x: number;
  y: number;
  viewportWidth: number;
  viewportHeight: number;
  onDamage: () => void;
  onHeal: () => void;
  onConditions: () => void;
  onAttack: () => void;
}

const HUD_WIDTH = 280;
const HUD_HEIGHT = 36;
const HUD_MARGIN = 10;

export function TokenHUD({
  x,
  y,
  viewportWidth,
  viewportHeight,
  onDamage,
  onHeal,
  onConditions,
  onAttack,
}: TokenHUDProps) {
  const preferredLeft = x + 18;
  const preferredTop = y - 46;

  const clampedLeft = clamp(preferredLeft, HUD_MARGIN, viewportWidth - HUD_WIDTH - HUD_MARGIN);
  const needsBottomFlip = preferredTop < HUD_MARGIN;
  const top = needsBottomFlip ? y + 22 : preferredTop;
  const clampedTop = clamp(top, HUD_MARGIN, viewportHeight - HUD_HEIGHT - HUD_MARGIN);

  return (
    <div
      className="absolute z-40"
      style={{
        left: clampedLeft,
        top: clampedTop,
        width: HUD_WIDTH,
      }}
    >
      <div className="flex items-center gap-1 rounded-full border border-border/70 bg-card/95 px-2 py-1 shadow-warm-lg backdrop-blur-sm">
        <HudButton label="Damage" onClick={onDamage} icon={<Sword className="h-3.5 w-3.5" />} tone="danger" />
        <HudButton label="Heal" onClick={onHeal} icon={<Heart className="h-3.5 w-3.5" />} tone="safe" />
        <HudButton label="Conditions" onClick={onConditions} icon={<Wand2 className="h-3.5 w-3.5" />} tone="neutral" />
        <HudButton label="Attack" onClick={onAttack} icon={<Crosshair className="h-3.5 w-3.5" />} tone="neutral" />
      </div>
    </div>
  );
}

function HudButton({
  label,
  icon,
  onClick,
  tone,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  tone: 'danger' | 'safe' | 'neutral';
}) {
  const toneClass =
    tone === 'danger'
      ? 'border-destructive/35 bg-destructive/10 text-destructive hover:bg-destructive/20'
      : tone === 'safe'
        ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
        : 'border-border/60 bg-accent/40 text-foreground hover:bg-accent';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-8 min-w-[62px] flex-1 items-center justify-center gap-1 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wider transition-colors ${toneClass}`}
      title={label}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
