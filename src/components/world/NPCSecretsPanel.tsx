import { useState } from 'react';
import { ChevronDown, ChevronRight, Eye, EyeOff, Shield, Heart, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { useRevealSecret, useAddAttitudeEvent } from '@/hooks/useWorldEntities';
import type { WorldEntity, FactionDisposition } from '@/types/campaign';

const DISPOSITION_CONFIG: Record<FactionDisposition, { label: string; color: string; bg: string }> = {
  hostile: { label: 'Hostile', color: 'text-blood', bg: 'bg-blood/15' },
  unfriendly: { label: 'Unfriendly', color: 'text-brass', bg: 'bg-brass/15' },
  neutral: { label: 'Neutral', color: 'text-muted-foreground', bg: 'bg-muted' },
  friendly: { label: 'Friendly', color: 'text-gold', bg: 'bg-gold/15' },
  allied: { label: 'Allied', color: 'text-[hsl(150,50%,55%)]', bg: 'bg-forest/15' },
};

interface NPCSecretsPanelProps {
  entity: WorldEntity;
  canEdit: boolean;
  allEntities: WorldEntity[];
}

export function NPCSecretsPanel({ entity, canEdit, allEntities }: NPCSecretsPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [showAttitudeForm, setShowAttitudeForm] = useState(false);
  const [attDesc, setAttDesc] = useState('');
  const [newDisp, setNewDisp] = useState('');
  const revealSecret = useRevealSecret();
  const addAttitude = useAddAttitudeEvent();

  const isNpc = entity.type === 'npc' || entity.type === 'npc_minor';
  if (!isNpc) return null;

  const disposition = entity.npcDisposition as FactionDisposition | undefined;
  const dispConfig = disposition ? DISPOSITION_CONFIG[disposition] : null;
  const secrets = entity.secrets ?? [];
  const motivations = entity.motivations ?? [];
  const loyalties = entity.loyalties ?? [];
  const attitudeHistory = entity.attitudeHistory ?? [];

  const hasContent = secrets.length > 0 || motivations.length > 0 || loyalties.length > 0 || attitudeHistory.length > 0 || disposition;
  if (!hasContent && !canEdit) return null;

  function handleReveal(secretIdx: number) {
    // Secrets don't have IDs in the schema — use index as identifier
    // The backend uses the secretId param to find by index or embedded _id
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
          setShowAttitudeForm(false);
        },
        onError: () => toast.error('Failed to log attitude event'),
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
          {/* Disposition */}
          {dispConfig && (
            <div className="flex items-center gap-2">
              <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">Disposition:</span>
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-[Cinzel] ${dispConfig.bg} ${dispConfig.color}`}>
                {dispConfig.label}
              </span>
            </div>
          )}

          {/* Motivations */}
          {motivations.length > 0 && (
            <div>
              <p className="mb-1 font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
                <Heart className="inline h-3 w-3 mr-1" />Motivations
              </p>
              <ul className="space-y-0.5">
                {motivations.map((m, i) => (
                  <li key={i} className="text-xs text-foreground pl-4">- {m}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Loyalties */}
          {loyalties.length > 0 && (
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
          )}

          {/* Secrets (DM only — these fields are stripped for players) */}
          {secrets.length > 0 && (
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
          )}

          {/* Attitude history */}
          {attitudeHistory.length > 0 && (
            <div>
              <p className="mb-1.5 font-[Cinzel] text-[10px] uppercase tracking-wider text-muted-foreground">
                Attitude History
              </p>
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {attitudeHistory.slice().reverse().map((evt, i) => (
                  <div key={i} className="text-xs text-muted-foreground">
                    {evt.description}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Log attitude event */}
          {canEdit && !showAttitudeForm && (
            <Button size="sm" variant="secondary" onClick={() => setShowAttitudeForm(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Log Attitude Event
            </Button>
          )}
          {canEdit && showAttitudeForm && (
            <div className="rounded-md border border-border bg-card/60 p-3 space-y-2">
              <div>
                <label className="block font-[Cinzel] text-[10px] uppercase tracking-wider text-foreground">What changed?</label>
                <input
                  type="text"
                  value={attDesc}
                  onChange={(e) => setAttDesc(e.target.value)}
                  placeholder="Helped the party escape..."
                  className="block w-full rounded-sm border border-input bg-input px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground input-carved"
                />
              </div>
              <div>
                <label className="block font-[Cinzel] text-[10px] uppercase tracking-wider text-foreground">New Disposition (optional)</label>
                <select
                  value={newDisp}
                  onChange={(e) => setNewDisp(e.target.value)}
                  className="block w-full rounded-sm border border-input bg-input px-2 py-1 text-sm text-foreground input-carved font-[Cinzel]"
                >
                  <option value="">No change</option>
                  <option value="hostile">Hostile</option>
                  <option value="unfriendly">Unfriendly</option>
                  <option value="neutral">Neutral</option>
                  <option value="friendly">Friendly</option>
                  <option value="allied">Allied</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setShowAttitudeForm(false)}>Cancel</Button>
                <Button size="sm" disabled={!attDesc.trim() || addAttitude.isPending} onClick={handleAddAttitude}>
                  {addAttitude.isPending ? 'Saving...' : 'Log'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
