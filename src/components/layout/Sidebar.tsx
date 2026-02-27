import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Book,
  ScrollText,
  Users,
  Map,
  BookOpen,
  Sparkles,
  Skull,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  HelpCircle,
  Coins,
  Library,
  MessageSquare,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTabs } from '@/context/TabContext';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useCreditBalance } from '@/hooks/useCredits';
import { ItemContextMenu } from '@/components/ui/ItemContextMenu';
import { LayoutManager } from '@/components/layouts/LayoutManager';
import { resolveRouteContent } from '@/routes';

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    openTab,
    leftTabs,
    activeLeftTabId,
    rightTabs,
    activeRightTabId,
    focusedPanel,
  } = useTabs();
  const { data: dmCampaigns } = useCampaigns();
  const { data: creditBalance } = useCreditBalance();
  const [collapsed, setCollapsed] = useState(false);
  const [layoutsOpen, setLayoutsOpen] = useState(false);

  // Show DM-only items while loading (undefined) or if user has DM campaigns
  const showDMItems = dmCampaigns === undefined || dmCampaigns.length > 0;
  const isPaidUser = user && user.subscriptionTier !== 'free';

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/app' },
    { icon: Book, label: 'Campaigns', path: '/app/campaigns' },
    { icon: ScrollText, label: 'Sessions', path: '/app/sessions' },
    { icon: Users, label: 'Characters', path: '/app/characters' },
    ...(showDMItems
      ? [
          { icon: Map, label: 'World', path: '/app/world' },
          { icon: BookOpen, label: 'Notebook', path: '/app/notebook' },
          ...(isPaidUser
            ? [{ icon: Sparkles, label: 'AI Tools', path: '/app/tools' }]
            : []),
          { icon: Skull, label: 'Enemy Library', path: '/app/enemies' },
        ]
      : []),
    { icon: MessageSquare, label: 'Feedback', path: '/app/feedback' },
  ];

  // Derive the "current path" from the active tab in the focused panel,
  // falling back to the URL when no tabs are open.
  const activePath = (() => {
    const focusedTabs = focusedPanel === 'right' ? rightTabs : leftTabs;
    const focusedId = focusedPanel === 'right' ? activeRightTabId : activeLeftTabId;
    const focusedTab = focusedTabs.find((t) => t.id === focusedId);
    if (focusedTab) return focusedTab.path;

    // Fallback: check the other panel
    const otherTabs = focusedPanel === 'right' ? leftTabs : rightTabs;
    const otherId = focusedPanel === 'right' ? activeLeftTabId : activeRightTabId;
    const otherTab = otherTabs.find((t) => t.id === otherId);
    if (otherTab) return otherTab.path;

    return location.pathname;
  })();

  function isActive(path: string) {
    if (path === '/app') return activePath === '/app';
    return activePath.startsWith(path);
  }

  function handleNavClick(path: string, label: string) {
    openTab({
      title: label,
      path,
      content: resolveRouteContent(path, label),
    });
  }

  return (
    <div
      className={`flex flex-col border-r border-[hsla(38,50%,30%,0.15)] bg-[hsl(24,20%,8%)] texture-wood transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[hsla(38,40%,30%,0.12)] p-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img src="/fablheim-logo.png" alt="Fablheim" className="h-8 w-8 rounded-md shadow-glow-sm animate-candle" />
            <span className="font-bold text-foreground font-['Cinzel_Decorative'] text-glow-gold">Fablheim</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1.5 transition-colors hover:bg-muted"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Ornate divider below header */}
      <div className="divider-ornate" />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-2" aria-label="Main navigation">
        {!collapsed && (
          <p className="px-3 pt-2 pb-1 font-[Cinzel] text-muted-foreground text-[10px] tracking-widest uppercase">Navigation</p>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <ItemContextMenu
              key={item.path}
              item={{ title: item.label, path: item.path }}
            >
              <button
                type="button"
                onClick={() => handleNavClick(item.path, item.label)}
                aria-current={active ? 'page' : undefined}
                aria-label={collapsed ? item.label : undefined}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                  active
                    ? 'border-l-2 border-primary bg-primary/8 text-primary shadow-[inset_0_0_25px_hsla(38,90%,50%,0.08)]'
                    : 'text-muted-foreground hover:bg-[hsla(38,30%,30%,0.08)] hover:text-foreground'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`h-5 w-5 shrink-0 ${!active ? 'text-[hsla(38,30%,60%,0.6)]' : ''}`} />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            </ItemContextMenu>
          );
        })}
      </nav>

      {/* Credit Balance (paid users only) */}
      {isPaidUser && creditBalance && (
        <div className={`px-3 py-2 ${collapsed ? 'text-center' : ''}`}>
          <button
            type="button"
            onClick={() => handleNavClick('/app/credits', 'Credits')}
            className={`flex w-full items-center gap-2 rounded-md px-3 py-2 transition-colors cursor-pointer ${
              creditBalance.total < 10
                ? 'bg-[hsla(30,80%,50%,0.1)] text-[hsl(30,80%,60%)] hover:bg-[hsla(30,80%,50%,0.15)]'
                : 'bg-brass/10 text-brass hover:bg-brass/15'
            }`}
            title={collapsed ? `${creditBalance.total} credits` : undefined}
          >
            <Coins className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <div className="flex-1 text-left">
                <p className="font-[Cinzel] text-xs font-semibold tracking-wider">
                  {creditBalance.total} Credits
                </p>
                {creditBalance.total < 10 && (
                  <p className="text-[10px] opacity-75">Low balance</p>
                )}
              </div>
            )}
          </button>
        </div>
      )}

      {/* Ornate divider above user section */}
      <div className="divider-ornate" />

      {/* User Section */}
      <div className="space-y-1 border-t border-[hsla(38,40%,30%,0.12)] p-2">
        <button
          onClick={() => setLayoutsOpen(true)}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-[hsla(38,30%,30%,0.08)] hover:text-foreground"
          title={collapsed ? 'Layouts' : undefined}
        >
          <LayoutGrid className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Layouts</span>}
        </button>

        <button
          onClick={() => navigate('/srd')}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-[hsla(38,30%,30%,0.08)] hover:text-foreground"
          title={collapsed ? 'SRD Reference' : undefined}
        >
          <Library className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="text-sm font-medium">SRD Reference</span>}
        </button>

        <button
          onClick={() => navigate('/how-it-works')}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-[hsla(38,30%,30%,0.08)] hover:text-foreground"
          title={collapsed ? 'How It Works' : undefined}
        >
          <HelpCircle className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="text-sm font-medium">How It Works</span>}
        </button>

        {user?.role === 'admin' && (
          <button
            type="button"
            onClick={() => handleNavClick('/app/admin', 'Admin')}
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2 transition-colors ${
              isActive('/app/admin')
                ? 'bg-primary/8 text-primary shadow-[inset_0_0_25px_hsla(38,90%,50%,0.08)]'
                : 'text-muted-foreground hover:bg-[hsla(38,30%,30%,0.08)] hover:text-foreground'
            }`}
            title={collapsed ? 'Admin' : undefined}
          >
            <Shield className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Admin</span>}
          </button>
        )}

        <button
          type="button"
          onClick={() => handleNavClick('/app/settings', 'Settings')}
          className={`flex w-full items-center gap-3 rounded-md px-3 py-2 transition-colors ${
            isActive('/app/settings')
              ? 'bg-primary/8 text-primary shadow-[inset_0_0_25px_hsla(38,90%,50%,0.08)]'
              : 'text-muted-foreground hover:bg-[hsla(38,30%,30%,0.08)] hover:text-foreground'
          }`}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Settings</span>}
        </button>

        {!collapsed && (
          <div className="rounded-md bg-accent/80 texture-leather px-3 py-2 bg-[hsla(24,20%,12%,0.8)]">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-foreground">{user?.username}</p>
              {isPaidUser && (
                <span className="shrink-0 rounded bg-primary/20 px-1.5 py-0.5 font-[Cinzel] text-[9px] font-bold tracking-wider text-primary">
                  {user?.subscriptionTier === 'professional'
                    ? 'PRO+'
                    : user?.subscriptionTier === 'pro'
                      ? 'GM'
                      : 'HOB'}
                </span>
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        )}

        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-blood/15 hover:text-[hsl(0,60%,55%)]"
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>

      <LayoutManager open={layoutsOpen} onClose={() => setLayoutsOpen(false)} />
    </div>
  );
}
