import { type FormEvent, useState, useEffect } from 'react';
import { X, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCreateCampaign, useUpdateCampaign } from '@/hooks/useCampaigns';
import { systemLabels, statusLabels } from '@/types/campaign';
import type { Campaign, CampaignSystem, CampaignStatus } from '@/types/campaign';

interface CampaignFormModalProps {
  open: boolean;
  onClose: () => void;
  campaign?: Campaign | null;
}

const systemOptions = Object.entries(systemLabels) as [CampaignSystem, string][];
const statusOptions = Object.entries(statusLabels) as [CampaignStatus, string][];

const inputClass =
  'mt-1 block w-full rounded-sm border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground input-carved font-[Cinzel]';

export function CampaignFormModal({ open, onClose, campaign }: CampaignFormModalProps) {
  const isEdit = !!campaign;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [setting, setSetting] = useState('');
  const [system, setSystem] = useState<CampaignSystem>('dnd5e');
  const [status, setStatus] = useState<CampaignStatus>('active');
  // Advanced settings
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [visibility, setVisibility] = useState('private');
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [levelingSystem, setLevelingSystem] = useState('milestone');
  const [startingLevel, setStartingLevel] = useState(1);
  const [sessionFrequency, setSessionFrequency] = useState('');

  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();

  // Populate form when editing
  useEffect(() => {
    if (campaign) {
      setName(campaign.name);
      setDescription(campaign.description);
      setSetting(campaign.setting);
      setSystem(campaign.system);
      setStatus(campaign.status);
      setVisibility(campaign.visibility ?? 'private');
      setMaxPlayers(campaign.maxPlayers ?? 6);
      setLevelingSystem(campaign.levelingSystem ?? 'milestone');
      setStartingLevel(campaign.startingLevel ?? 1);
      setSessionFrequency(campaign.sessionFrequency ?? '');
      if (campaign.visibility || campaign.maxPlayers || campaign.levelingSystem || campaign.sessionFrequency) {
        setShowAdvanced(true);
      }
    } else {
      setName('');
      setDescription('');
      setSetting('');
      setSystem('dnd5e');
      setStatus('active');
      setShowAdvanced(false);
      setVisibility('private');
      setMaxPlayers(6);
      setLevelingSystem('milestone');
      setStartingLevel(1);
      setSessionFrequency('');
    }
  }, [campaign]);

  if (!open) return null;

  function handleClose() {
    setName('');
    setDescription('');
    setSetting('');
    setSystem('dnd5e');
    setStatus('active');
    setShowAdvanced(false);
    setVisibility('private');
    setMaxPlayers(6);
    setLevelingSystem('milestone');
    setStartingLevel(1);
    setSessionFrequency('');
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const payload = {
      name,
      description: description || undefined,
      setting: setting || undefined,
      system,
      status,
      visibility,
      maxPlayers,
      levelingSystem,
      startingLevel,
      sessionFrequency: sessionFrequency || undefined,
    };

    if (isEdit && campaign) {
      await updateCampaign.mutateAsync({ id: campaign._id, data: payload });
    } else {
      await createCampaign.mutateAsync(payload);
    }
    handleClose();
  }

  const isPending = createCampaign.isPending || updateCampaign.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border border-t-2 border-t-brass/50 bg-card p-6 shadow-warm-lg tavern-card iron-brackets texture-parchment">
        <div className="flex items-center justify-between">
          <h2 className="font-['IM_Fell_English'] text-xl text-card-foreground">
            {isEdit ? 'Edit Campaign' : 'Create Campaign'}
          </h2>
          <button
            onClick={handleClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="campaign-name" className="block font-[Cinzel] text-xs uppercase tracking-wider text-foreground">
              Name
            </label>
            <input
              id="campaign-name"
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="The Lost Mines of Phandelver"
              className={inputClass}
            />
          </div>

          {/* System + Status row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="campaign-system" className="block font-[Cinzel] text-xs uppercase tracking-wider text-foreground">
                System
              </label>
              <select
                id="campaign-system"
                value={system}
                onChange={(e) => setSystem(e.target.value as CampaignSystem)}
                className={inputClass}
              >
                {systemOptions.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="campaign-status" className="block font-[Cinzel] text-xs uppercase tracking-wider text-foreground">
                Status
              </label>
              <select
                id="campaign-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as CampaignStatus)}
                className={inputClass}
              >
                {statusOptions.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Setting */}
          <div>
            <label htmlFor="campaign-setting" className="block font-[Cinzel] text-xs uppercase tracking-wider text-foreground">
              Setting
            </label>
            <input
              id="campaign-setting"
              type="text"
              maxLength={200}
              value={setting}
              onChange={(e) => setSetting(e.target.value)}
              placeholder="Forgotten Realms, Eberron, Homebrew..."
              className={inputClass}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="campaign-description" className="block font-[Cinzel] text-xs uppercase tracking-wider text-foreground">
              Description
            </label>
            <textarea
              id="campaign-description"
              rows={3}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief overview of your campaign..."
              className={inputClass}
            />
          </div>

          {/* Advanced Settings */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 font-[Cinzel] text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              {showAdvanced ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              Advanced Settings
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-4 rounded-md border border-border/50 bg-background/30 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="campaign-visibility" className="block font-[Cinzel] text-xs uppercase tracking-wider text-foreground">
                      Visibility
                    </label>
                    <select
                      id="campaign-visibility"
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value)}
                      className={inputClass}
                    >
                      <option value="private">Private</option>
                      <option value="unlisted">Unlisted</option>
                      <option value="public">Public</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="campaign-max-players" className="block font-[Cinzel] text-xs uppercase tracking-wider text-foreground">
                      Max Players
                    </label>
                    <input
                      id="campaign-max-players"
                      type="number"
                      min={1}
                      max={20}
                      value={maxPlayers}
                      onChange={(e) => setMaxPlayers(Number(e.target.value))}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="campaign-leveling" className="block font-[Cinzel] text-xs uppercase tracking-wider text-foreground">
                      Leveling System
                    </label>
                    <select
                      id="campaign-leveling"
                      value={levelingSystem}
                      onChange={(e) => setLevelingSystem(e.target.value)}
                      className={inputClass}
                    >
                      <option value="milestone">Milestone</option>
                      <option value="xp">Experience Points</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="campaign-starting-level" className="block font-[Cinzel] text-xs uppercase tracking-wider text-foreground">
                      Starting Level
                    </label>
                    <input
                      id="campaign-starting-level"
                      type="number"
                      min={1}
                      max={20}
                      value={startingLevel}
                      onChange={(e) => setStartingLevel(Number(e.target.value))}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="campaign-frequency" className="block font-[Cinzel] text-xs uppercase tracking-wider text-foreground">
                    Session Frequency
                  </label>
                  <input
                    id="campaign-frequency"
                    type="text"
                    maxLength={100}
                    value={sessionFrequency}
                    onChange={(e) => setSessionFrequency(e.target.value)}
                    placeholder="Weekly, biweekly, monthly..."
                    className={inputClass}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEdit ? 'Saving...' : 'Creating...'
                : isEdit ? 'Save Changes' : 'Create Campaign'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
