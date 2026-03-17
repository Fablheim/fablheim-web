import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { connectSocket } from '@/lib/socket';
import type { Socket } from 'socket.io-client';
import type { SyncResponse } from '@/types/live-session';

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    function onConnect() { setConnected(true); }
    function onDisconnect() { setConnected(false); }
    function onConnectError(err: Error) {
      console.error('Socket connect_error:', err.message);
      setConnected(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    if (socket.connected) setConnected(true);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
    };
  }, []);

  return { socket: socketRef.current, connected };
}

export interface ConnectedUser {
  userId: string;
  username: string;
  socketId: string;
  role: 'dm' | 'player';
  connectedAt: string;
  lastActivity: string;
}

export interface SessionRoomState {
  connected: boolean;
  connectedUsers: ConnectedUser[];
  joined: boolean;
  error: string | null;
  desynced: boolean;
  syncData: SyncResponse | null;
}

/** Shallow-compare two ConnectedUser arrays to avoid unnecessary re-renders. */
function usersEqual(a: ConnectedUser[], b: ConnectedUser[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].userId !== b[i].userId || a[i].socketId !== b[i].socketId) return false;
  }
  return true;
}

export function useSessionRoom(campaignId: string | null) {
  const { socket, connected } = useSocket();
  const [state, setState] = useState<SessionRoomState>({
    connected: false,
    connectedUsers: [],
    joined: false,
    error: null,
    desynced: false,
    syncData: null,
  });

  // Track stateVersion and lastMessageTimestamp across events
  const stateVersionRef = useRef<number>(0);
  const lastMessageTimestampRef = useRef<string | undefined>(undefined);
  const hadPreviousConnectionRef = useRef(false);

  useEffect(() => {
    setState(prev => ({ ...prev, connected }));
  }, [connected]);

  useEffect(() => {
    if (!socket || !connected || !campaignId) return;

    // Determine if this is a reconnection (not the very first connect)
    const isReconnect = hadPreviousConnectionRef.current;
    hadPreviousConnectionRef.current = true;

    // Join session room
    socket.emit('join-session', { campaignId }, (response: any) => {
      if (response.success) {
        if (response.stateVersion !== undefined) {
          stateVersionRef.current = response.stateVersion;
        }
        setState(prev => ({
          ...prev,
          joined: true,
          connectedUsers: response.connectedUsers || [],
          error: null,
        }));
      } else {
        setState(prev => ({ ...prev, error: response.error || 'Failed to join session' }));
      }
    });

    // On reconnect, also send an explicit sync-request with last known state
    if (isReconnect) {
      socket.emit('sync-request', {
        campaignId,
        lastStateVersion: stateVersionRef.current,
        lastMessageTimestamp: lastMessageTimestampRef.current,
      });
    }

    // Listen for user joins/leaves (now include stateVersion tracking)
    function onUserJoined(data: { userId: string; username: string; role: string; connectedUsers: ConnectedUser[]; stateVersion?: number }) {
      if (data.stateVersion !== undefined) {
        stateVersionRef.current = data.stateVersion;
      }
      setState(prev =>
        usersEqual(prev.connectedUsers, data.connectedUsers)
          ? prev
          : { ...prev, connectedUsers: data.connectedUsers },
      );
    }
    function onUserLeft(data: { userId: string; username: string; connectedUsers: ConnectedUser[]; stateVersion?: number }) {
      if (data.stateVersion !== undefined) {
        stateVersionRef.current = data.stateVersion;
      }
      setState(prev =>
        usersEqual(prev.connectedUsers, data.connectedUsers)
          ? prev
          : { ...prev, connectedUsers: data.connectedUsers },
      );
    }

    // Listen for sync-response (sent on join, reconnect, or explicit sync-request)
    function onSyncResponse(data: SyncResponse) {
      stateVersionRef.current = data.currentStateVersion;
      setState(prev => {
        const sameUsers = usersEqual(prev.connectedUsers, data.connectedUsers);
        const sameDesync = prev.desynced === data.desynced;
        if (sameUsers && sameDesync) return prev;
        return {
          ...prev,
          connectedUsers: sameUsers ? prev.connectedUsers : data.connectedUsers,
          desynced: data.desynced,
          syncData: data,
        };
      });
    }

    // Track lastMessageTimestamp from chat messages for reconnection sync
    function onChatMessage(msg: { createdAt?: string }) {
      if (msg.createdAt) {
        lastMessageTimestampRef.current = msg.createdAt;
      }
    }

    // Rate limit warnings from the server
    function onRateLimit(data: { event: string; retryAfterMs: number; message: string }) {
      toast.warning(data.message, { duration: data.retryAfterMs });
    }

    // Validation errors from WsValidationPipe (WsException)
    function onException(data: { status?: string; message?: string }) {
      const msg = data?.message || 'Server rejected the request';
      if (msg.startsWith('Validation failed:')) {
        toast.error(msg.replace('Validation failed: ', 'Invalid input: '));
      } else {
        toast.error(msg);
      }
    }

    function onCreditsLow(data: { balance: number; threshold: number }) {
      toast.warning(`You have ${data.balance} AI credits remaining`, { duration: 8000 });
    }

    function onCreditsDepleted() {
      toast.error("You're out of AI credits", { duration: 10000 });
    }

    socket.on('user-joined', onUserJoined);
    socket.on('user-left', onUserLeft);
    socket.on('sync-response', onSyncResponse);
    socket.on('chat:message', onChatMessage);
    socket.on('error:rate-limit', onRateLimit);
    socket.on('exception', onException);
    socket.on('credits:low', onCreditsLow);
    socket.on('credits:depleted', onCreditsDepleted);

    return () => {
      socket.emit('leave-session', { campaignId });
      socket.off('user-joined', onUserJoined);
      socket.off('user-left', onUserLeft);
      socket.off('sync-response', onSyncResponse);
      socket.off('chat:message', onChatMessage);
      socket.off('error:rate-limit', onRateLimit);
      socket.off('exception', onException);
      socket.off('credits:low', onCreditsLow);
      socket.off('credits:depleted', onCreditsDepleted);
    };
  }, [socket, connected, campaignId]);

  /** Update stateVersion from external events (initiative-updated, hp:changed, etc.) */
  const updateStateVersion = useCallback((version: number) => {
    stateVersionRef.current = version;
  }, []);

  /** Track the latest message timestamp for reconnection sync */
  const updateLastMessageTimestamp = useCallback((timestamp: string) => {
    lastMessageTimestampRef.current = timestamp;
  }, []);

  /** Dismiss the desynced banner */
  const dismissDesync = useCallback(() => {
    setState(prev => ({ ...prev, desynced: false }));
  }, []);

  return {
    ...state,
    updateStateVersion,
    updateLastMessageTimestamp,
    dismissDesync,
  };
}

/** Subscribe to a socket event. The callback is stable via ref so it won't cause re-subscriptions. */
export function useSocketEvent(event: string, handler: (data: any) => void) {
  const { socket, connected } = useSocket();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const stableHandler = useCallback((data: any) => {
    handlerRef.current(data);
  }, []);

  useEffect(() => {
    if (!socket || !connected) return;

    socket.on(event, stableHandler);
    return () => {
      socket.off(event, stableHandler);
    };
  }, [socket, connected, event, stableHandler]);
}
