import { useState, useCallback, useRef, useEffect } from 'react';
import { useSocketEvent } from './useSocket';

interface StreamState {
  streamId: string | null;
  text: string;
  isStreaming: boolean;
  error: string | null;
}

interface AIStreamStartData {
  streamId: string;
  label?: string;
}

interface AIStreamChunkData {
  streamId: string;
  label?: string;
  text?: string;
}

interface AIStreamCompleteData {
  streamId: string;
  label?: string;
  usage?: { inputTokens: number; outputTokens: number; totalTokens: number };
  model?: string;
  latency?: number;
}

interface AIStreamErrorData {
  streamId: string;
  label?: string;
  error?: string;
}

/**
 * Hook for consuming AI streaming responses via WebSocket.
 *
 * Pass a `label` to auto-start when a matching `ai:stream-start` event fires.
 * Call `listen()` before triggering the API call so the hook knows to capture
 * the next stream-start event with that label.
 *
 * Usage:
 *   const stream = useAIStreaming('npc-generator');
 *   async function handleGenerate() {
 *     stream.listen();  // Start listening for the stream
 *     const result = await api.generateNPC({ stream: true });
 *     stream.reset();   // Done -- structured result is ready
 *   }
 *   // While waiting, stream.text updates in real time.
 */
export function useAIStreaming(label?: string) {
  const [state, setState] = useState<StreamState>({
    streamId: null,
    text: '',
    isStreaming: false,
    error: null,
  });

  const activeStreamId = useRef<string | null>(null);
  const listeningForLabel = useRef<string | null>(null);

  // Auto-start when a stream-start event matches our waiting label
  useSocketEvent('ai:stream-start', (data: AIStreamStartData) => {
    if (
      listeningForLabel.current &&
      data.label === listeningForLabel.current &&
      !activeStreamId.current
    ) {
      activeStreamId.current = data.streamId;
      setState({
        streamId: data.streamId,
        text: '',
        isStreaming: true,
        error: null,
      });
    }
  });

  useSocketEvent('ai:chunk', (data: AIStreamChunkData) => {
    if (data.streamId !== activeStreamId.current) return;
    setState((prev) => ({
      ...prev,
      text: prev.text + (data.text ?? ''),
    }));
  });

  useSocketEvent('ai:complete', (data: AIStreamCompleteData) => {
    if (data.streamId !== activeStreamId.current) return;
    setState((prev) => ({
      ...prev,
      isStreaming: false,
    }));
  });

  useSocketEvent('ai:error', (data: AIStreamErrorData) => {
    if (data.streamId !== activeStreamId.current) return;
    setState((prev) => ({
      ...prev,
      isStreaming: false,
      error: data.error ?? 'Stream failed',
    }));
  });

  /** Begin listening for the next stream-start event with our label. */
  const listen = useCallback(() => {
    listeningForLabel.current = label ?? null;
    activeStreamId.current = null;
    setState({
      streamId: null,
      text: '',
      isStreaming: false,
      error: null,
    });
  }, [label]);

  /** Manually start tracking a specific streamId (for non-label usage). */
  const startStream = useCallback((streamId: string) => {
    activeStreamId.current = streamId;
    setState({
      streamId,
      text: '',
      isStreaming: true,
      error: null,
    });
  }, []);

  const reset = useCallback(() => {
    activeStreamId.current = null;
    listeningForLabel.current = null;
    setState({
      streamId: null,
      text: '',
      isStreaming: false,
      error: null,
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      activeStreamId.current = null;
      listeningForLabel.current = null;
    };
  }, []);

  return {
    streamId: state.streamId,
    text: state.text,
    isStreaming: state.isStreaming,
    error: state.error,
    listen,
    startStream,
    reset,
  };
}
