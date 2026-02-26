import { useCallback, useEffect, useRef, useState } from 'react';
import { Send, EyeOff, MessageSquare } from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/context/AuthContext';
import type { ChatMessage } from '@/types/campaign';
import type { ConnectedUser } from '@/hooks/useSocket';

interface ChatPanelProps {
  campaignId: string;
  connectedUsers: ConnectedUser[];
}

type ChatMode = 'ic' | 'ooc' | 'whisper';

const MODE_LABELS: Record<ChatMode, string> = {
  ic: 'In-Character',
  ooc: 'Out-of-Character',
  whisper: 'Whisper',
};

const MODE_COLORS: Record<ChatMode, string> = {
  ic: 'border-primary/60 text-primary',
  ooc: 'border-muted-foreground/50 text-muted-foreground',
  whisper: 'border-purple-500/50 text-purple-400',
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ChatPanel({ campaignId, connectedUsers }: ChatPanelProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ChatMode>('ooc');
  const [recipientId, setRecipientId] = useState<string>('');
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<
    { userId: string; username: string }[]
  >([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAtBottomRef = useRef(true);

  // Track scroll position
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    isAtBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  }, []);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load initial messages
  useEffect(() => {
    const socket = getSocket();

    socket.emit(
      'chat:load',
      { campaignId, limit: 50 },
      (response: { messages: ChatMessage[] }) => {
        setMessages(response.messages || []);
        setHasMore((response.messages?.length ?? 0) >= 50);
        // Scroll to bottom after initial load
        setTimeout(() => {
          bottomRef.current?.scrollIntoView();
        }, 50);
      },
    );
  }, [campaignId]);

  // Listen for new messages
  useEffect(() => {
    const socket = getSocket();

    function onMessage(msg: ChatMessage) {
      setMessages((prev) => [...prev, msg]);
      // Auto-scroll if user is at bottom
      if (isAtBottomRef.current) {
        setTimeout(scrollToBottom, 50);
      }
    }

    function onTyping(data: {
      userId: string;
      username: string;
      isTyping: boolean;
    }) {
      setTypingUsers((prev) => {
        if (data.isTyping) {
          if (prev.some((u) => u.userId === data.userId)) return prev;
          return [...prev, { userId: data.userId, username: data.username }];
        }
        return prev.filter((u) => u.userId !== data.userId);
      });
    }

    socket.on('chat:message', onMessage);
    socket.on('chat:typing', onTyping);

    return () => {
      socket.off('chat:message', onMessage);
      socket.off('chat:typing', onTyping);
    };
  }, [scrollToBottom]);

  // Load older messages
  function loadMore() {
    if (loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    const socket = getSocket();
    const oldestDate = messages[0]?.createdAt;

    socket.emit(
      'chat:load',
      { campaignId, limit: 50, before: oldestDate },
      (response: { messages: ChatMessage[] }) => {
        const older = response.messages || [];
        setMessages((prev) => [...older, ...prev]);
        setHasMore(older.length >= 50);
        setLoadingMore(false);
      },
    );
  }

  // Emit typing indicator
  function handleInputChange(value: string) {
    setInput(value);
    const socket = getSocket();

    if (value.length > 0) {
      socket.emit('chat:typing', { campaignId, isTyping: true });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('chat:typing', { campaignId, isTyping: false });
      }, 3000);
    } else {
      socket.emit('chat:typing', { campaignId, isTyping: false });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  }

  // Send message
  async function handleSend() {
    if (sending || !input.trim()) return;
    if (mode === 'whisper' && !recipientId) return;
    setSending(true);

    const socket = getSocket();
    socket.emit('chat:typing', { campaignId, isTyping: false });

    socket.emit(
      'chat:send',
      {
        campaignId,
        message: input.trim(),
        type: mode,
        recipientId: mode === 'whisper' ? recipientId : undefined,
      },
      (response: { success: boolean; error?: string }) => {
        if (response.success) {
          setInput('');
        }
        setSending(false);
      },
    );
  }

  // Other users for whisper target
  const otherUsers = connectedUsers.filter((u) => u.userId !== user?._id);

  return (
    <div className="flex h-full flex-col">
      {renderMessages()}
      {renderTypingIndicator()}
      {renderInput()}
    </div>
  );

  function renderMessages() {
    return (
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 space-y-1"
      >
        {hasMore && (
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full text-xs text-muted-foreground hover:text-foreground py-1 transition-colors font-['IM_Fell_English']"
          >
            {loadingMore ? 'Loading...' : 'Load older messages'}
          </button>
        )}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm font-['IM_Fell_English'] italic">
              No messages yet. Start the conversation!
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <ChatBubble
            key={msg._id}
            message={msg}
            isOwn={msg.userId === user?._id}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    );
  }

  function renderTypingIndicator() {
    if (typingUsers.length === 0) return null;
    const names = typingUsers.map((u) => u.username).join(', ');
    return (
      <div className="px-3 py-1 text-xs text-muted-foreground italic font-['IM_Fell_English']">
        {names} {typingUsers.length === 1 ? 'is' : 'are'} typing...
      </div>
    );
  }

  function renderInput() {
    return (
      <div className="shrink-0 border-t border-[hsla(38,40%,30%,0.15)] p-3 space-y-2">
        {/* Mode selector */}
        <div className="flex items-center gap-2">
          {(Object.keys(MODE_LABELS) as ChatMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-sm px-2.5 py-1 text-[10px] font-[Cinzel] uppercase tracking-wider border transition-all ${
                mode === m
                  ? `${MODE_COLORS[m]} bg-accent/60`
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/30'
              }`}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>

        {/* Whisper target */}
        {mode === 'whisper' && (
          <select
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            className="w-full rounded-sm border border-border bg-input px-2 py-1.5 text-xs text-foreground focus:border-primary/50 focus:outline-none"
          >
            <option value="">Select recipient...</option>
            {otherUsers.map((u) => (
              <option key={u.userId} value={u.userId}>
                {u.username} ({u.role === 'dm' ? 'GM' : 'Player'})
              </option>
            ))}
          </select>
        )}

        {/* Input + send */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              mode === 'ic'
                ? 'Speak in character...'
                : mode === 'whisper'
                  ? 'Whisper privately...'
                  : 'Type a message...'
            }
            className="flex-1 rounded-sm border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !input.trim() || (mode === 'whisper' && !recipientId)}
            className="rounded-sm bg-primary p-2 text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }
}

// ── Chat Bubble ─────────────────────────────────────────────

function ChatBubble({
  message,
  isOwn,
}: {
  message: ChatMessage;
  isOwn: boolean;
}) {
  const isSystem =
    message.type === 'system' ||
    message.type === 'roll' ||
    message.type === 'hp_change' ||
    message.type === 'initiative' ||
    message.type === 'condition';

  if (isSystem) {
    return (
      <div className="flex justify-center py-0.5">
        <span className="text-[11px] text-muted-foreground italic font-['IM_Fell_English'] px-3 py-0.5 rounded-full bg-accent/30">
          {message.message}
        </span>
      </div>
    );
  }

  const isWhisper = message.type === 'whisper';
  const isIC = message.type === 'ic';

  return (
    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
      {/* Username + time */}
      <div className="flex items-center gap-1.5 px-1">
        <span className="font-[Cinzel] text-[10px] uppercase tracking-wider text-foreground/70">
          {message.username}
        </span>
        {isWhisper && (
          <span className="text-[10px] text-purple-400 flex items-center gap-0.5">
            <EyeOff className="h-2.5 w-2.5" />
            {isOwn ? `to ${message.recipientUsername}` : 'whisper'}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground">
          {formatTime(message.createdAt)}
        </span>
      </div>

      {/* Message bubble */}
      <div
        className={`max-w-[85%] rounded-lg px-3 py-1.5 text-sm ${
          isWhisper
            ? 'bg-purple-500/10 border border-purple-500/20 text-foreground'
            : isIC
              ? "bg-primary/10 border border-primary/20 text-foreground font-['IM_Fell_English'] italic"
              : isOwn
                ? 'bg-accent/80 text-foreground'
                : 'bg-card border border-border/50 text-foreground'
        }`}
      >
        {message.message}
      </div>
    </div>
  );
}
