import { useEffect, useState, type ReactNode } from 'react';

interface SessionWorkspaceShellProps {
  header: ReactNode;
  leftPanel: ReactNode;
  centerStage: ReactNode;
  rightPanel?: ReactNode;
  quickActionBar?: ReactNode;
  mapOverlay?: ReactNode;
  bottomDrawer?: ReactNode;
  defaultLeftOpen?: boolean;
  defaultRightOpen?: boolean;
  mapMode?: boolean;
}

export default function SessionWorkspaceShell({
  header,
  leftPanel,
  centerStage,
  rightPanel,
  quickActionBar,
  mapOverlay,
  bottomDrawer,
  defaultLeftOpen = true,
  defaultRightOpen = true,
  mapMode = false,
}: SessionWorkspaceShellProps) {
  const [leftOpen, setLeftOpen] = useState(defaultLeftOpen);
  const [rightOpen, setRightOpen] = useState(defaultRightOpen);
  const [isSmallViewport, setIsSmallViewport] = useState(() => window.innerWidth < 1024);

  useEffect(() => {
    setLeftOpen(defaultLeftOpen);
  }, [defaultLeftOpen]);

  useEffect(() => {
    setRightOpen(defaultRightOpen);
  }, [defaultRightOpen]);

  useEffect(() => {
    const handleResize = () => setIsSmallViewport(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (mapMode && isSmallViewport) {
      setLeftOpen(false);
      setRightOpen(false);
    }
  }, [mapMode, isSmallViewport]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {header}

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {isSmallViewport && leftOpen && (
          <div
            className="absolute inset-0 z-20 bg-black/35"
            onClick={() => setLeftOpen(false)}
          />
        )}

        <div className="flex h-full min-h-0 overflow-hidden">
          <aside
            className={`h-full border-r border-border/70 bg-card/70 transition-[width,transform] duration-200 ${
              leftOpen
                ? isSmallViewport
                  ? 'absolute inset-y-0 left-0 z-30 w-[340px] max-w-[86vw] translate-x-0 shadow-2xl'
                  : 'w-[360px] min-w-[300px] max-w-[420px]'
                : isSmallViewport
                  ? 'absolute inset-y-0 left-0 z-30 w-[340px] max-w-[86vw] -translate-x-full'
                  : 'w-14'
            }`}
          >
            {leftOpen ? (
              leftPanel
            ) : (
              <button
                type="button"
                onClick={() => setLeftOpen(true)}
                className="flex h-full w-full items-center justify-center text-xs uppercase tracking-wider text-muted-foreground hover:bg-accent/40"
                title="Open left panel"
                aria-label="Open left panel"
              >
                Panel
              </button>
            )}
          </aside>

          <main className="relative min-h-0 flex-1 overflow-hidden">
            {centerStage}

            {mapOverlay && (
              <div className="pointer-events-none absolute bottom-[4.75rem] left-3 z-20">
                <div className="pointer-events-auto">{mapOverlay}</div>
              </div>
            )}

            {quickActionBar && (
              <div className="pointer-events-none absolute inset-x-0 bottom-14 z-20 px-3 pb-2">
                <div className="pointer-events-auto">{quickActionBar}</div>
              </div>
            )}

            {bottomDrawer && (
              <div className="absolute inset-x-0 bottom-0 z-30">
                {bottomDrawer}
              </div>
            )}
          </main>

          {rightPanel && rightOpen && !isSmallViewport && (
            <aside className="h-full w-[360px] min-w-[320px] max-w-[420px] border-l border-border/70 bg-card/70">
              {rightPanel}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
