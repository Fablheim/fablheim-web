import { type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Users, Receipt, Radio } from 'lucide-react';
import { useTabs } from '@/context/TabContext';
import { resolveRouteContent } from '@/routes';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/app/admin' },
  { icon: MessageSquare, label: 'Feedback', path: '/app/admin/feedback' },
  { icon: Users, label: 'Users', path: '/app/admin/users' },
  { icon: Receipt, label: 'Billing', path: '/app/admin/billing' },
  { icon: Radio, label: 'Sessions', path: '/app/admin/sessions' },
];

export function AdminLayout({ children, activePath: activePathProp }: { children: ReactNode; activePath?: string }) {
  const location = useLocation();
  const { openTab } = useTabs();
  const activePath = activePathProp ?? location.pathname;

  function handleNavClick(path: string, label: string) {
    openTab({
      title: `Admin: ${label}`,
      path,
      content: resolveRouteContent(path, `Admin: ${label}`),
    });
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Admin Header */}
      <div className="border-b-2 border-[hsla(38,50%,40%,0.2)] px-6 py-4 texture-parchment bg-card/30 shadow-[0_1px_0_hsla(38,60%,50%,0.1)]">
        <h1 className="text-2xl font-bold text-foreground font-['IM_Fell_English'] tracking-wide text-carved">
          Admin Portal
        </h1>
        <nav className="mt-3 flex gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activePath === item.path || (item.path !== '/app/admin' && activePath.startsWith(item.path));
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => handleNavClick(item.path, item.label)}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 texture-parchment">
        {children}
      </div>
    </div>
  );
}
