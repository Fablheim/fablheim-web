import { useEffect, useRef, useState } from 'react';
import { connectSocket } from '@/lib/socket';
import type { Socket } from 'socket.io-client';

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    function onConnect() { setConnected(true); }
    function onDisconnect() { setConnected(false); }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (socket.connected) setConnected(true);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
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
}

export function useSessionRoom(campaignId: string | null) {
  const { socket, connected } = useSocket();
  const [state, setState] = useState<SessionRoomState>({
    connected: false,
    connectedUsers: [],
    joined: false,
    error: null,
  });

  useEffect(() => {
    setState(prev => ({ ...prev, connected }));
  }, [connected]);

  useEffect(() => {
    if (!socket || !connected || !campaignId) return;

    // Join session room
    socket.emit('join-session', { campaignId }, (response: any) => {
      if (response.success) {
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

    // Listen for user joins/leaves
    function onUserJoined(data: { userId: string; username: string; role: string; connectedUsers: ConnectedUser[] }) {
      setState(prev => ({ ...prev, connectedUsers: data.connectedUsers }));
    }
    function onUserLeft(data: { userId: string; username: string; connectedUsers: ConnectedUser[] }) {
      setState(prev => ({ ...prev, connectedUsers: data.connectedUsers }));
    }

    socket.on('user-joined', onUserJoined);
    socket.on('user-left', onUserLeft);

    return () => {
      socket.emit('leave-session', { campaignId });
      socket.off('user-joined', onUserJoined);
      socket.off('user-left', onUserLeft);
    };
  }, [socket, connected, campaignId]);

  return state;
}
