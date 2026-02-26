import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Panel, Group, Separator } from 'react-resizable-panels';
import { Sidebar } from './Sidebar';
import { PanelTabBar } from './PanelTabBar';
import { TabProvider, useTabs } from '@/context/TabContext';
import { useDefaultLayout } from '@/hooks/useLayouts';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { resolveRouteContent } from '@/routes';

const routeTitles: Record<string, string> = {
  '/app': 'Dashboard',
  '/app/campaigns': 'Campaigns',
  '/app/sessions': 'Sessions',
  '/app/characters': 'Characters',
  '/app/world': 'World',
  '/app/tools': 'AI Tools',
  '/app/settings': 'Settings',
};

function titleFromPath(path: string): string {
  if (routeTitles[path]) return routeTitles[path];
  if (path.startsWith('/app/campaigns/')) return 'Campaign';
  const segment = path.replace('/app/', '').split('/')[0];
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

interface AppShellProps {
  children: ReactNode;
}

function ShellContent({ children }: { children: ReactNode }) {
  const {
    leftTabs,
    activeLeftTabId,
    openLeftTab,
    setActiveLeftTab,
    closeLeftTab,
    closeOtherLeftTabs,
    closeAllLeftTabs,
    rightTabs,
    activeRightTabId,
    setActiveRightTab,
    closeRightTab,
    closeOtherRightTabs,
    closeAllRightTabs,
    rightPanelVisible,
    focusedPanel,
    setFocusedPanel,
    splitRatio,
    setSplitRatio,
    layoutVersion,
    restoreLayout,
  } = useTabs();

  const location = useLocation();
  useKeyboardShortcuts();

  // Auto-load default layout on first mount
  const { data: defaultLayout, isSuccess } = useDefaultLayout();
  const [defaultApplied, setDefaultApplied] = useState(false);

  useEffect(() => {
    if (isSuccess && defaultLayout && !defaultApplied) {
      restoreLayout(defaultLayout, resolveRouteContent);
      setDefaultApplied(true);
    }
  }, [isSuccess, defaultLayout, defaultApplied, restoreLayout]);

  // When Panel 2 opens and Panel 1 has no tabs, promote the current view into a Panel 1 tab
  useEffect(() => {
    if (rightPanelVisible && leftTabs.length === 0) {
      const path = location.pathname;
      const title = titleFromPath(path);
      openLeftTab({ title, path, content: resolveRouteContent(path, title) });
    }
  }, [rightPanelVisible, leftTabs.length, location.pathname, openLeftTab]);

  const activeLeftTab = leftTabs.find((t) => t.id === activeLeftTabId);
  const activeRightTab = rightTabs.find((t) => t.id === activeRightTabId);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Group
          key={`${layoutVersion}-${rightPanelVisible}`}
          orientation="horizontal"
          className="flex-1"
        >
          {/* Left Panel */}
          <Panel
            defaultSize={rightPanelVisible ? splitRatio : 100}
            minSize={30}
            onResize={(size) => { if (rightPanelVisible) setSplitRatio(size.asPercentage); }}
          >
            <div className="flex h-full flex-col" onMouseDown={() => setFocusedPanel('left')}>
              <PanelTabBar
                tabs={leftTabs}
                activeTabId={activeLeftTabId}
                onTabClick={setActiveLeftTab}
                onTabClose={closeLeftTab}
                onCloseOthers={closeOtherLeftTabs}
                onCloseAll={closeAllLeftTabs}
                focused={focusedPanel === 'left'}
              />
              <div className="flex-1 overflow-auto">
                {activeLeftTab ? activeLeftTab.content : children}
              </div>
            </div>
          </Panel>

          {/* Right Panel */}
          {rightPanelVisible && (
            <>
              <Separator className="w-1 cursor-col-resize bg-[hsl(24,14%,18%)] transition-colors hover:bg-primary/70" />

              <Panel defaultSize={100 - splitRatio} minSize={20}>
                <div className="flex h-full flex-col" onMouseDown={() => setFocusedPanel('right')}>
                  <PanelTabBar
                    tabs={rightTabs}
                    activeTabId={activeRightTabId}
                    onTabClick={setActiveRightTab}
                    onTabClose={closeRightTab}
                    onCloseOthers={closeOtherRightTabs}
                    onCloseAll={closeAllRightTabs}
                    focused={focusedPanel === 'right'}
                  />
                  <div className="flex-1 overflow-auto">
                    {activeRightTab?.content}
                  </div>
                </div>
              </Panel>
            </>
          )}
        </Group>
      </div>
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <TabProvider>
      <ShellContent>{children}</ShellContent>
    </TabProvider>
  );
}
