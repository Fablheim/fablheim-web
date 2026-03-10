import { useCallback, useSyncExternalStore } from 'react';

export interface PlayerNote {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

function storageKey(campaignId: string) {
  return `fablheim:player-notes:${campaignId}`;
}

function readNotes(campaignId: string): PlayerNote[] {
  try {
    const raw = localStorage.getItem(storageKey(campaignId));
    return raw ? (JSON.parse(raw) as PlayerNote[]) : [];
  } catch {
    return [];
  }
}

function writeNotes(campaignId: string, notes: PlayerNote[]) {
  localStorage.setItem(storageKey(campaignId), JSON.stringify(notes));
  // Dispatch a storage event so other tabs / useSyncExternalStore picks it up
  window.dispatchEvent(new StorageEvent('storage', { key: storageKey(campaignId) }));
}

function sortNotes(notes: PlayerNote[]): PlayerNote[] {
  return [...notes].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export function usePlayerNotes(campaignId: string) {
  const key = storageKey(campaignId);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const handler = (e: StorageEvent) => {
        if (e.key === key) onStoreChange();
      };
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    },
    [key],
  );

  const getSnapshot = useCallback(() => {
    // Return the raw string so React can do a cheap === comparison
    return localStorage.getItem(key) ?? '[]';
  }, [key]);

  const raw = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  let parsed: PlayerNote[];
  try {
    parsed = JSON.parse(raw) as PlayerNote[];
  } catch {
    parsed = [];
  }

  const notes = sortNotes(parsed);

  const addNote = useCallback(
    (title: string, content: string) => {
      const now = new Date().toISOString();
      const note: PlayerNote = {
        id: crypto.randomUUID(),
        title,
        content,
        isPinned: false,
        createdAt: now,
        updatedAt: now,
      };
      const current = readNotes(campaignId);
      writeNotes(campaignId, [...current, note]);
    },
    [campaignId],
  );

  const updateNote = useCallback(
    (id: string, updates: Partial<Pick<PlayerNote, 'title' | 'content'>>) => {
      const current = readNotes(campaignId);
      const idx = current.findIndex((n) => n.id === id);
      if (idx === -1) return;
      current[idx] = {
        ...current[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      writeNotes(campaignId, current);
    },
    [campaignId],
  );

  const deleteNote = useCallback(
    (id: string) => {
      const current = readNotes(campaignId);
      writeNotes(
        campaignId,
        current.filter((n) => n.id !== id),
      );
    },
    [campaignId],
  );

  const togglePin = useCallback(
    (id: string) => {
      const current = readNotes(campaignId);
      const idx = current.findIndex((n) => n.id === id);
      if (idx === -1) return;
      current[idx] = {
        ...current[idx],
        isPinned: !current[idx].isPinned,
        updatedAt: new Date().toISOString(),
      };
      writeNotes(campaignId, current);
    },
    [campaignId],
  );

  return { notes, addNote, updateNote, deleteNote, togglePin } as const;
}
