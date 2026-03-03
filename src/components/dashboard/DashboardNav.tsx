import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Coins,
  Flame,
  LogOut,
  Menu,
  Plus,
  Settings,
  Shield,
  Swords,
  Users,
  X,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useMyCampaignMemberships } from '@/hooks/useCampaignMembers';
import { useCreditBalance } from '@/hooks/useCredits';
import { stageConfig } from '@/config/stage-config';
import { systemLabels } from '@/types/campaign';
import { DropdownMenu, DropdownMenuItem, DropdownMenuDivider, DropdownMenuLabel } from './DropdownMenu';
import type { Campaign } from '@/types/campaign';

function tierLabel(tier: string): string {
  if (tier === 'professional') return 'PRO+';
  if (tier === 'pro') return 'GM';
  if (tier === 'hobbyist') return 'HOB';
  return '';
}

export function DashboardNav() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { data: dmCampaigns } = useCampaigns();
  const { data: memberships } = useMyCampaignMemberships();
  const { data: creditBalance } = useCreditBalance();

  const [campaignsOpen, setCampaignsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isPaidUser = user && user.subscriptionTier !== 'free';

  const dmCampaignIds = new Set(dmCampaigns?.map((c) => c._id) ?? []);
  const playerMemberships = memberships?.filter((m) => !dmCampaignIds.has(m.campaignId._id)) ?? [];

  function nav(path: string) {
    navigate(path);
    setCampaignsOpen(false);
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  }


  function renderCampaignItem(campaign: Campaign, role: 'dm' | 'player' | 'co_dm') {
    const stage = stageConfig[campaign.stage];
    const StageIcon = stage.Icon;
    const isLive = campaign.stage === 'live';

    return (
      <DropdownMenuItem
        key={campaign._id}
        icon={StageIcon}
        label={campaign.name}
        description={`${role === 'dm' ? 'DM' : role === 'co_dm' ? 'Co-DM' : 'Player'} · ${systemLabels[campaign.system] ?? 'Custom'}`}
        onClick={() => nav(`/app/campaigns/${campaign._id}`)}
        badge={
          isLive ? (
            <span className="flex items-center gap-1 rounded-full bg-[hsl(5,84%,58%)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[hsl(5,84%,58%)]">
              <Flame className="h-3 w-3 animate-pulse" />
              Live
            </span>
          ) : (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${stage.bg} ${stage.color}`}>
              {stage.label}
            </span>
          )
        }
      />
    );
  }

  // ── Desktop Nav ──────────────────────────────────────────

  function renderDesktopNav() {
    return (
      <div className="hidden items-center gap-1 md:flex">
        {/* Campaigns dropdown */}
        <DropdownMenu
          open={campaignsOpen}
          onOpenChange={setCampaignsOpen}
          width="w-80"
          trigger={
            <button
              type="button"
              onClick={() => { setCampaignsOpen(!campaignsOpen); setUserMenuOpen(false); }}
              className="app-focus-ring flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-[color:var(--mkt-text)] transition-colors hover:bg-[hsla(38,30%,30%,0.08)]"
            >
              <Swords className="h-4 w-4 text-[color:var(--mkt-muted)]" />
              Campaigns
              <ChevronDown className={`h-3.5 w-3.5 text-[color:var(--mkt-muted)] transition-transform ${campaignsOpen ? 'rotate-180' : ''}`} />
            </button>
          }
        >
          {renderCampaignsDropdown()}
        </DropdownMenu>

        {/* Enemy Library link */}
        <button
          type="button"
          onClick={() => nav('/app/enemies')}
          className="app-focus-ring flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-[color:var(--mkt-text)] transition-colors hover:bg-[hsla(38,30%,30%,0.08)]"
        >
          <Swords className="h-4 w-4 text-[color:var(--mkt-muted)]" />
          Enemies
        </button>
      </div>
    );
  }

  function renderCampaignsDropdown() {
    const sorted = [...(dmCampaigns ?? [])].sort((a, b) => {
      const stageWeight = { live: 0, prep: 1, recap: 2 } as const;
      const diff = (stageWeight[a.stage] ?? 1) - (stageWeight[b.stage] ?? 1);
      if (diff !== 0) return diff;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return (
      <>
        {sorted.length > 0 && <DropdownMenuLabel>Your Campaigns</DropdownMenuLabel>}
        {sorted.map((c) => renderCampaignItem(c, 'dm'))}

        {playerMemberships.length > 0 && (
          <>
            <DropdownMenuDivider />
            <DropdownMenuLabel>Playing In</DropdownMenuLabel>
          </>
        )}
        {playerMemberships.map((m) => (
          <DropdownMenuItem
            key={m._id}
            icon={Users}
            label={m.campaignId.name}
            description={m.role === 'co_dm' ? 'Co-DM' : 'Player'}
            onClick={() => nav(`/app/campaigns/${m.campaignId._id}`)}
          />
        ))}

        {(!dmCampaigns || dmCampaigns.length === 0) && playerMemberships.length === 0 && (
          <p className="px-3 py-4 text-center text-sm text-[color:var(--mkt-muted)]">No campaigns yet</p>
        )}

        <DropdownMenuDivider />
        <div className="flex items-center gap-2 px-3 py-2">
          <button
            type="button"
            onClick={() => nav('/app/campaigns')}
            className="flex-1 text-xs font-medium text-[color:var(--mkt-muted)] transition-colors hover:text-[color:var(--mkt-text)]"
          >
            View All
          </button>
          <button
            type="button"
            onClick={() => nav('/app/campaigns')}
            className="flex items-center gap-1 rounded-md bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/25"
          >
            <Plus className="h-3 w-3" />
            New Campaign
          </button>
        </div>
      </>
    );
  }


  // ── Right section ────────────────────────────────────────

  function renderRightSection() {
    return (
      <div className="flex items-center gap-2">
        {/* Credits badge */}
        {creditBalance && (
          <button
            type="button"
            onClick={() => nav('/app/credits')}
            className={`hidden items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors sm:flex ${
              creditBalance.total < 10
                ? 'bg-[hsla(30,80%,50%,0.1)] text-[hsl(30,80%,60%)] hover:bg-[hsla(30,80%,50%,0.15)]'
                : 'bg-brass/10 text-brass hover:bg-brass/15'
            }`}
          >
            <Coins className="h-3.5 w-3.5" />
            {creditBalance.total}
          </button>
        )}

        {/* User menu */}
        <DropdownMenu
          open={userMenuOpen}
          onOpenChange={setUserMenuOpen}
          align="right"
          width="w-56"
          trigger={
            <button
              type="button"
              aria-label="User menu"
              onClick={() => { setUserMenuOpen(!userMenuOpen); setCampaignsOpen(false); }}
              className="app-focus-ring flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-[hsla(38,30%,30%,0.08)]"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--mkt-border)] bg-primary/15 text-xs font-bold text-primary">
                {user?.username?.charAt(0).toUpperCase() ?? '?'}
              </div>
              <span className="hidden text-sm font-medium text-[color:var(--mkt-text)] md:inline">{user?.username}</span>
              {isPaidUser && (
                <span className="hidden rounded bg-primary/20 px-1.5 py-0.5 font-[Cinzel] text-[9px] font-bold tracking-wider text-primary md:inline">
                  {tierLabel(user!.subscriptionTier)}
                </span>
              )}
            </button>
          }
        >
          {renderUserMenu()}
        </DropdownMenu>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="app-focus-ring rounded-md p-2 text-[color:var(--mkt-muted)] transition-colors hover:text-[color:var(--mkt-text)] md:hidden"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
    );
  }

  function renderUserMenu() {
    return (
      <>
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-[color:var(--mkt-text)]">{user?.username}</p>
          <p className="text-xs text-[color:var(--mkt-muted)]">{user?.email}</p>
        </div>
        <DropdownMenuDivider />
        <DropdownMenuItem icon={Settings} label="Settings" onClick={() => nav('/app/settings')} />
        <DropdownMenuItem icon={Coins} label="Credits" onClick={() => nav('/app/credits')} />
        <DropdownMenuItem icon={MessageSquare} label="Feedback" onClick={() => nav('/app/feedback')} />
        {user?.role === 'admin' && (
          <>
            <DropdownMenuDivider />
            <DropdownMenuItem icon={Shield} label="Admin" onClick={() => nav('/app/admin')} />
          </>
        )}
        <DropdownMenuDivider />
        <DropdownMenuItem
          icon={LogOut}
          label="Sign Out"
          onClick={() => { logout(); navigate('/login'); }}
          className="text-[color:var(--mkt-danger)] hover:bg-[hsla(0,65%,38%,0.08)]"
        />
      </>
    );
  }

  // ── Mobile menu ──────────────────────────────────────────

  function renderMobileMenu() {
    if (!mobileMenuOpen) return null;

    const sortedCampaigns = [...(dmCampaigns ?? [])].sort((a, b) => {
      const w = { live: 0, prep: 1, recap: 2 } as const;
      return (w[a.stage] ?? 1) - (w[b.stage] ?? 1);
    });

    return (
      <div className="absolute inset-x-0 top-full z-40 border-b border-[color:var(--mkt-border)] bg-[color:var(--mkt-surface-2)] md:hidden">
        <div className="max-h-[70vh] overflow-auto p-3 space-y-1">
          <DropdownMenuLabel>Campaigns</DropdownMenuLabel>
          {sortedCampaigns.map((c) => renderCampaignItem(c, 'dm'))}
          {playerMemberships.map((m) => (
            <DropdownMenuItem
              key={m._id}
              icon={Users}
              label={m.campaignId.name}
              description={m.role === 'co_dm' ? 'Co-DM' : 'Player'}
              onClick={() => nav(`/app/campaigns/${m.campaignId._id}`)}
            />
          ))}
          {(!sortedCampaigns.length && !playerMemberships.length) && (
            <p className="px-3 py-3 text-center text-sm text-[color:var(--mkt-muted)]">No campaigns yet</p>
          )}

          <DropdownMenuDivider />
          <DropdownMenuItem
            icon={Swords}
            label="Enemy Library"
            onClick={() => nav('/app/enemies')}
          />

          <DropdownMenuDivider />
          <DropdownMenuItem icon={Settings} label="Settings" onClick={() => nav('/app/settings')} />
          {creditBalance && (
            <DropdownMenuItem icon={Coins} label={`Credits (${creditBalance.total})`} onClick={() => nav('/app/credits')} />
          )}
          <DropdownMenuItem
            icon={LogOut}
            label="Sign Out"
            onClick={() => { logout(); navigate('/login'); }}
            className="text-[color:var(--mkt-danger)]"
          />
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────

  return (
    <header className="mkt-nav relative z-40 flex h-14 shrink-0 items-center justify-between px-4">
      <div className="flex items-center gap-4">
        {/* Logo */}
        <button
          type="button"
          onClick={() => nav('/app')}
          className="app-focus-ring flex items-center gap-2.5 rounded-md pr-2 transition-colors"
        >
          <img
            src="/fablheim-logo.png"
            alt="Fablheim"
            className="h-8 w-8 rounded-md shadow-glow-sm"
          />
          <span className="hidden font-['Cinzel_Decorative'] text-base font-bold tracking-wide text-glow-gold sm:inline">
            Fablheim
          </span>
        </button>

        {renderDesktopNav()}
      </div>

      {renderRightSection()}
      {renderMobileMenu()}
    </header>
  );
}
