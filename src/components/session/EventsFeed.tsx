import { useEffect, useState } from 'react';
import { Swords, Heart, Shield, Dices, MessageSquare, Activity } from 'lucide-react';
import { getSocket } from '@/lib/socket';
import type { ChatMessage, ChatMessageType } from '@/types/campaign';

interface EventsFeedProps {
  campaignId: string;
}

/** Event types shown in the unified feed */
const EVENT_TYPES: ChatMessageType[] = [
  'system',
  'roll',
  'hp_change',
  'initiative',
  'condition',
];

function isEventType(type: ChatMessageType): boolean {
  return EVENT_TYPES.includes(type);
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getEventIcon(type: ChatMessageType) {
  switch (type) {
    case 'roll':
      return Dices;
    case 'hp_change':
      return Heart;
    case 'initiative':
      return Swords;
    case 'condition':
      return Shield;
    case 'system':
      return Activity;
    default:
      return MessageSquare;
  }
}

function getEventColor(type: ChatMessageType): string {
  switch (type) {
    case 'roll':
      return 'text-primary';
    case 'hp_change':
      return 'text-[hsl(0,55%,55%)]';
    case 'initiative':
      return 'text-[hsl(38,80%,55%)]';
    case 'condition':
      return 'text-purple-400';
    case 'system':
      return 'text-muted-foreground';
    default:
      return 'text-muted-foreground';
  }
}

function getEventBorder(type: ChatMessageType): string {
  switch (type) {
    case 'roll':
      return 'border-l-primary/60';
    case 'hp_change':
      return 'border-l-[hsl(0,55%,55%)]/50';
    case 'initiative':
      return 'border-l-[hsl(38,80%,55%)]/50';
    case 'condition':
      return 'border-l-purple-500/50';
    default:
      return 'border-l-muted-foreground/30';
  }
}

export function EventsFeed({ campaignId }: EventsFeedProps) {
  const [events, setEvents] = useState<ChatMessage[]>([]);
  const [filter, setFilter] = useState<ChatMessageType | 'all'>('all');

  // Load initial events from chat history (filter to event types)
  useEffect(() => {
    const socket = getSocket();

    socket.emit(
      'chat:load',
      { campaignId, limit: 100 },
      (response: { messages: ChatMessage[] }) => {
        const eventMessages = (response.messages || []).filter((m) =>
          isEventType(m.type),
        );
        setEvents(eventMessages);
      },
    );
  }, [campaignId]);

  // Listen for new messages and filter to events
  useEffect(() => {
    const socket = getSocket();

    function onMessage(msg: ChatMessage) {
      if (isEventType(msg.type)) {
        setEvents((prev) => [...prev, msg].slice(-200));
      }
    }

    socket.on('chat:message', onMessage);
    return () => {
      socket.off('chat:message', onMessage);
    };
  }, []);

  const filtered =
    filter === 'all' ? events : events.filter((e) => e.type === filter);

  return (
    <div className="flex h-full flex-col">
      {renderFilterBar()}
      {renderEventList()}
    </div>
  );

  function renderFilterBar() {
    const filters: { id: ChatMessageType | 'all'; label: string }[] = [
      { id: 'all', label: 'All' },
      { id: 'roll', label: 'Dice' },
      { id: 'hp_change', label: 'HP' },
      { id: 'initiative', label: 'Initiative' },
      { id: 'condition', label: 'Conditions' },
      { id: 'system', label: 'System' },
    ];

    return (
      <div className="shrink-0 flex items-center gap-1 border-b border-[hsla(38,40%,30%,0.15)] px-3 py-2 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-sm px-2 py-1 text-[10px] font-[Cinzel] uppercase tracking-wider transition-all whitespace-nowrap ${
              filter === f.id
                ? 'bg-accent/60 text-foreground border border-primary/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/30 border border-transparent'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    );
  }

  function renderEventList() {
    return (
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Activity className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm font-['IM_Fell_English'] italic">
              No events yet. Events will appear as the session progresses.
            </p>
          </div>
        )}
        {filtered.map((event) => (
          <EventItem key={event._id} event={event} />
        ))}
      </div>
    );
  }
}

function EventItem({ event }: { event: ChatMessage }) {
  const Icon = getEventIcon(event.type);
  const color = getEventColor(event.type);
  const borderColor = getEventBorder(event.type);

  return (
    <div
      className={`flex items-start gap-2.5 rounded-md border-l-2 ${borderColor} bg-accent/20 px-3 py-2 transition-colors hover:bg-accent/30`}
    >
      <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${color}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-snug">{event.message}</p>
        <span className="text-[10px] text-muted-foreground">
          {formatTime(event.createdAt)}
        </span>
      </div>
    </div>
  );
}
