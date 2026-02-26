import { useEffect } from 'react';
import { useTabs } from '@/context/TabContext';
import { resolveRouteContent } from '@/routes';

export function useKeyboardShortcuts() {
  const { openTab } = useTabs();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      // Ctrl/Cmd + key shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
            // Future: open command palette
            e.preventDefault();
            break;
        }
        return;
      }

      // Alt + key shortcuts for navigation
      if (e.altKey) {
        let path: string | null = null;
        let title: string | null = null;

        switch (e.key) {
          case 'd':
            path = '/app';
            title = 'Dashboard';
            break;
          case 'c':
            path = '/app/campaigns';
            title = 'Campaigns';
            break;
          case 'h':
            path = '/app/characters';
            title = 'Characters';
            break;
          case 's':
            path = '/app/sessions';
            title = 'Sessions';
            break;
          case 'w':
            path = '/app/world';
            title = 'World';
            break;
          case 'n':
            path = '/app/notebook';
            title = 'Notebook';
            break;
        }

        if (path && title) {
          e.preventDefault();
          openTab({ title, path, content: resolveRouteContent(path, title) });
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openTab]);
}
