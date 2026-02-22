import { useState } from 'react';
import { Copy, Check, RefreshCw, Mail, Loader2, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  useGenerateInviteCode,
  useRegenerateInviteCode,
  useToggleInvites,
  useSendEmailInvites,
  usePendingInvitations,
} from '@/hooks/useInvitations';
import type { Campaign } from '@/types/campaign';

interface InvitePanelProps {
  campaign: Campaign;
}

type TabId = 'link' | 'email';

export function InvitePanel({ campaign }: InvitePanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('link');

  return (
    <div className="rounded-lg border border-border bg-card tavern-card texture-parchment">
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('link')}
          className={`flex items-center gap-2 px-4 py-3 font-[Cinzel] text-xs uppercase tracking-wider font-medium transition-colors ${
            activeTab === 'link'
              ? 'border-b-2 border-primary text-foreground shadow-[0_1px_0_hsla(38,80%,50%,0.15)]'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Link2 className="h-4 w-4" />
          Share Link
        </button>
        <button
          onClick={() => setActiveTab('email')}
          className={`flex items-center gap-2 px-4 py-3 font-[Cinzel] text-xs uppercase tracking-wider font-medium transition-colors ${
            activeTab === 'email'
              ? 'border-b-2 border-primary text-foreground shadow-[0_1px_0_hsla(38,80%,50%,0.15)]'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Mail className="h-4 w-4" />
          Email Invite
        </button>
      </div>

      <div className="p-4">
        {activeTab === 'link' && <ShareLinkTab campaign={campaign} />}
        {activeTab === 'email' && <EmailInviteTab campaign={campaign} />}
      </div>
    </div>
  );
}

function ShareLinkTab({ campaign }: { campaign: Campaign }) {
  const [copied, setCopied] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const generateCode = useGenerateInviteCode();
  const regenerateCode = useRegenerateInviteCode();
  const toggleInvites = useToggleInvites();

  const shareLink = campaign.inviteCode
    ? `${window.location.origin}/join/${campaign.inviteCode}`
    : null;

  function handleCopy() {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleRegenerate() {
    if (!confirmRegen) {
      setConfirmRegen(true);
      return;
    }
    regenerateCode.mutate(campaign._id, {
      onSuccess: () => setConfirmRegen(false),
    });
  }

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Accept Invites</p>
          <p className="text-xs text-muted-foreground">
            {campaign.inviteEnabled ? 'Players can join using invite links' : 'Invites are currently disabled'}
          </p>
        </div>
        <button
          onClick={() => toggleInvites.mutate({ campaignId: campaign._id, enabled: !campaign.inviteEnabled })}
          disabled={toggleInvites.isPending}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
            campaign.inviteEnabled ? 'bg-primary shadow-glow-sm' : 'bg-muted'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
              campaign.inviteEnabled ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Link display / generate */}
      {!campaign.inviteCode ? (
        <Button
          onClick={() => generateCode.mutate(campaign._id)}
          disabled={generateCode.isPending}
          className="w-full"
        >
          {generateCode.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Link2 className="mr-2 h-4 w-4" />
          )}
          Generate Invite Link
        </Button>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={shareLink ?? ''}
              className="flex-1 rounded-sm border border-input bg-background px-3 py-2 text-sm text-foreground input-carved"
            />
            <Button variant="secondary" onClick={handleCopy} className="shrink-0">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={handleRegenerate}
              disabled={regenerateCode.isPending}
              className="text-xs"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              {confirmRegen ? 'Confirm? Old link will stop working' : 'Regenerate'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function EmailInviteTab({ campaign }: { campaign: Campaign }) {
  const [emailInput, setEmailInput] = useState('');
  const sendInvites = useSendEmailInvites();
  const { data: pendingInvitations, isLoading } = usePendingInvitations(campaign._id);

  function handleSend() {
    const emails = emailInput
      .split(/[,\n]/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    if (emails.length === 0) return;

    sendInvites.mutate(
      { campaignId: campaign._id, emails },
      { onSuccess: () => setEmailInput('') },
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground">
          Email Addresses
        </label>
        <textarea
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          placeholder="player1@example.com, player2@example.com"
          rows={3}
          className="mt-1 block w-full rounded-sm border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring input-carved"
        />
        <p className="mt-1 text-xs text-muted-foreground">Separate multiple emails with commas or new lines</p>
      </div>

      <Button
        onClick={handleSend}
        disabled={sendInvites.isPending || !emailInput.trim()}
        className="w-full"
      >
        {sendInvites.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Mail className="mr-2 h-4 w-4" />
        )}
        Send Invitations
      </Button>

      {sendInvites.isSuccess && (
        <p className="text-sm text-green-400">
          Sent {sendInvites.data.count} invitation{sendInvites.data.count !== 1 ? 's' : ''}
        </p>
      )}

      {/* Pending invitations list */}
      <div>
        <h4 className="text-sm font-medium text-foreground">Pending Invitations</h4>

        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {pendingInvitations && pendingInvitations.length === 0 && (
          <p className="py-4 text-sm text-muted-foreground">No pending invitations</p>
        )}

        {pendingInvitations && pendingInvitations.length > 0 && (
          <div className="mt-2 space-y-2">
            {pendingInvitations.map((inv) => (
              <div
                key={inv._id}
                className="flex items-center justify-between rounded-md border border-gold/30 bg-background px-3 py-2 texture-leather"
              >
                <span className="text-sm text-foreground">{inv.email}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(inv.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
