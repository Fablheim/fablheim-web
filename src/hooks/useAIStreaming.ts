import { useState, useCallback, useRef, useEffect } from 'react';
import { useSocketEvent } from './useSocket';

interface StreamState {
  streamId: string | null;
  text: string;
  isStreaming: boolean;
  error: string | null;
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
 * Usage:
 *   const { text, isStreaming, error, startStream, reset } = useAIStreaming();
 *   // Call your API endpoint that returns { streamId }, then:
 *   startStream(response.streamId);
 */
export function useAIStreaming() {
  const [state, setState] = useState<StreamState>({
    streamId: null,
    text: '',
    isStreaming: false,
    error: null,
  });

  const activeStreamId = useRef<string | null>(null);

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
    };
  }, []);

  return {
    streamId: state.streamId,
    text: state.text,
    isStreaming: state.isStreaming,
    error: state.error,
    startStream,
    reset,
  };
}
