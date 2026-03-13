import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Eye, EyeOff, Shield, Heart, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { useRevealSecret, useAddAttitudeEvent, useUpdateWorldEntity } from '@/hooks/useWorldEntities';
import { DISPOSITION_CONFIG } from './world-constants';
import type { WorldEntity, FactionDisposition } from '@/types/campaign';

interface NPCSecretsPanelProps {
  entity: WorldEntity;
  canEdit: boolean;
  allEntities: WorldEntity[];
}

export function NPCSecretsPanel({ entity, canEdit, allEntities }: NPCSecretsPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [attDesc, setAttDesc] = useState('');
  const [newDisp, setNewDisp] = useState('');
  const [editingMotivationIdx, setEditingMotivationIdx] = useState<number | null>(null);
  const [editingMotivationText, setEditingMotivationText] = useState('');
  const revealSecret = useRevealSecret();
  const addAttitude = useAddAttitudeEvent();
  const updateEntity = useUpdateWorldEntity();

  // Scroll overflow detection for attitude history
  const historyRef = useRef<HTMLDivElement>(null);
  const [historyOverflows, setHistoryOverflows] = useState(false);
  const attitudeHistory = entity.attitudeHistory ?? [];

  useEffect(() => {
    const el = historyRef.current;
    if (el) setHistoryOverflows(el.scrollHeight > el.clientHeight);
  }, [attitudeHistory.length, expanded]);

  const isNpc = entity.type === 'npc' || entity.type === 'npc_minor';
  if (!isNpc) return null;

  const disposition = entity.npcDisposition as FactionDisposition | undefined;
  const dispConfig = disposition ? DISPOSITION_CONFIG[disposition] : null;
  const secrets = entity.secrets ?? [];
  const motivations = entity.motivations ?? [];
  const loyalties = entity.loyalties ?? [];

  const hasContent = secrets.length > 0 || motivations.length > 0 || loyalties.length > 0 || attitudeHistory.length > 0 || disposition;
  if (!hasContent && !canEdit) return null;

  function handleReveal(secretIdx: number) {
    const secret = secrets[secretIdx];
    if (!secret) return;
    revealSecret.mutate(
      { campaignId: entity.campaignId, entityId: entity._id, secretId: String(secretIdx) },
      {
        onSuccess: () => toast.success('Secret revealed to players'),
        onError: () => toast.error('Failed to reveal secret'),
      },
    );
  }

  function handleAddAttitude() {
    if (!attDesc.trim()) return;
    addAttitude.mutate(
      {
        campaignId: entity.campaignId,
        entityId: entity._id,
        data: {
          description: attDesc.trim(),
          newDisposition: newDisp || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Attitude event logged');
          setAttDesc('');
          setNewDisp('');
        },
        onError: () => toast.error('Failed to log attitude event'),
      },
    );
  }

  function handleSaveMotivation(idx: number) {
    const trimmed = editingMotivationText.trim();
    if (!trimmed) return;
    const updated = [...motivations];
    updated[idx] = trimmed;
    updateEntity.mutate(
      { campaignId: entity.campaignId, id: entity._id, data: { motivations: updated } },
      {
        onSuccess: () => {
          setEditingMotivationIdx(null);
          setEditingMotivationText('');
        },
        onError: () => toast.error('Failed to update motivation'),
      },
    );
  }

  return (
    <>
      <div className="divider-ornate mt-5 mb-4" />
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 text-left"
      >
        {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        <span className="font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground">
          NPC Details
        </span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {renderDisposition()}
          {renderMotivations()}
          {renderLoyalties()}
          {renderSecrets()}
          {renderAttitudeHistory()}
          {renderAttitudeForm()}
        </div>
      )}
    </>
  );

  function renderDisposition() {
    if (!dispConfig) return null;
    return (
      <div className="flex items-center gap-2">
        <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Disposition:</span>
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-[Cinzel] ${dispConfig.bg} ${dispConfig.color}`}>
          {dispConfig.label}
        </span>
      </div>
    );
  }

  function renderMotivations() {
    if (motivations.length === 0) return null;
    return (
      <div>
        <p className="mb-1 font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
          <Heart className="inline h-3 w-3 mr-1" />Motivations
        </p>
        <ul className="space-y-0.5">
          {motivations.map((m, i) => (
            <li key={i} className="group/mot flex items-center gap-1 pl-4 text-xs">
              {editingMotivationIdx === i ? (
                <input
                  type="text"
                  value={editingMotivationText}
                  onChange={(e) => setEditingMotivationText(e.target.value)}
                  onBlur={() => handleSaveMotivation(i)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveMotivation(i);
                    if (e.key === 'Escape') { setEditingMotivationIdx(null); setEditingMotivationText(''); }
                  }}
                  autoFocus
                  className="flex-1 rounded-sm border border-input bg-input px-1.5 py-0.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary/40"
                />
              ) : (
                <>
                  <span className="flex-1 text-foreground">- {m}</span>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => { setEditingMotivationIdx(i); setEditingMotivationText(m); }}
                      className="shrink-0 rounded p-0.5 text-muted-foreground/0 transition-colors group-hover/mot:text-muted-foreground hover:!text-foreground"
                    >
                      <Pencil className="h-2.5 w-2.5" />
                    </button>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  function renderLoyalties() {
    if (loyalties.length === 0) return null;
    return (
      <div>
        <p className="mb-1 font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
          <Shield className="inline h-3 w-3 mr-1" />Loyalties
        </p>
        <div className="space-y-1">
          {loyalties.map((loy) => {
            const faction = allEntities.find((e) => e._id === loy.factionEntityId);
            return (
              <div key={loy.factionEntityId} className="flex items-center gap-2 text-xs">
                <span className="text-foreground">{faction?.name ?? 'Unknown'}</span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-20">
                  <div
                    className="h-full rounded-full bg-gold"
                    style={{ width: `${loy.strength}%` }}
                  />
                </div>
                <span className="text-muted-foreground text-[10px]">{loy.strength}%</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderSecrets() {
    if (secrets.length === 0) return null;
    return (
      <div className="rounded-md border border-arcane/30 bg-arcane/5 p-2">
        <p className="mb-1.5 font-[Cinzel] text-[10px] uppercase tracking-wider text-arcane">
          Secrets
        </p>
        <div className="space-y-1.5">
          {secrets.map((secret, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              {secret.revealed ? (
                <Eye className="h-3.5 w-3.5 shrink-0 text-[hsl(150,50%,55%)] mt-0.5" />
              ) : (
                <EyeOff className="h-3.5 w-3.5 shrink-0 text-arcane mt-0.5" />
              )}
              <span className={secret.revealed ? 'text-muted-foreground line-through' : 'text-foreground'}>
                {secret.description}
              </span>
              {canEdit && !secret.revealed && (
                <button
                  onClick={() => handleReveal(i)}
                  className="ml-auto shrink-0 rounded px-1.5 py-0.5 text-[10px] text-arcane hover:bg-arcane/15 font-[Cinzel]"
                  disabled={revealSecret.isPending}
                >
                  Reveal
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderAttitudeHistory() {
    if (attitudeHistory.length === 0) return null;
    return (
      <div>
        <p className="mb-1.5 font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
          Attitude History
        </p>
        <div className="relative">
          <div ref={historyRef} className="space-y-1 max-h-28 overflow-y-auto">
            {attitudeHistory.slice().reverse().map((evt, i) => (
              <div key={i} className="text-xs text-muted-foreground">
                {evt.description}
              </div>
            ))}
          </div>
          {historyOverflows && (
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-card to-transparent" />
          )}
        </div>
      </div>
    );
  }

  function renderAttitudeForm() {
    if (!canEdit) return null;
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={attDesc}
          onChange={(e) => setAttDesc(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAddAttitude(); }}
          placeholder="Log attitude change..."
          className="min-w-0 flex-1 rounded-sm border border-input bg-input px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground input-carved outline-none focus:ring-1 focus:ring-primary/40"
        />
        <select
          value={newDisp}
          onChange={(e) => setNewDisp(e.target.value)}
          className="w-28 shrink-0 rounded-sm border border-input bg-input px-1.5 py-1 text-xs text-foreground input-carved font-[Cinzel]"
        >
          <option value="">No change</option>
          <option value="hostile">Hostile</option>
          <option value="unfriendly">Unfriendly</option>
          <option value="neutral">Neutral</option>
          <option value="friendly">Friendly</option>
          <option value="allied">Allied</option>
        </select>
        <Button size="sm" disabled={!attDesc.trim() || addAttitude.isPending} onClick={handleAddAttitude}>
          {addAttitude.isPending ? '...' : 'Log'}
        </Button>
      </div>
    );
  }
}
