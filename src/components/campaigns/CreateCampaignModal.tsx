import { type FormEvent, useState, useEffect } from 'react';
import { X } from 'lucide-react';
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
    } else {
      setName('');
      setDescription('');
      setSetting('');
      setSystem('dnd5e');
      setStatus('active');
    }
  }, [campaign]);

  if (!open) return null;

  function handleClose() {
    setName('');
    setDescription('');
    setSetting('');
    setSystem('dnd5e');
    setStatus('active');
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
      <div className="relative w-full max-w-lg rounded-lg border border-border border-t-2 border-t-brass/50 bg-card p-6 shadow-warm-lg tavern-card iron-brackets texture-parchment">
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
