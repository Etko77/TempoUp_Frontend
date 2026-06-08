import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { WS_BASE_URL } from '@/api/client';
import { tokenStorage } from '@/auth/secureStore';
import type { MessageResponse, UUID } from '@/types/api';


export interface ChatConnection {
  send: (conversationId: UUID, content: string) => void;
  disconnect: () => void;
}

export async function connectChat(opts: {
  onMessage: (msg: MessageResponse) => void;
  onConnect?: () => void;
  onError?: (err: Error) => void;
}): Promise<ChatConnection> {
  const token = await tokenStorage.getAccess();
  if (!token) throw new Error('Not authenticated');

  let subscription: StompSubscription | null = null;

  const client = new Client({
    webSocketFactory: () => new WebSocket(`${WS_BASE_URL}/ws`),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 5000,
    forceBinaryWSFrames: true,
    appendMissingNULLonIncoming: true,
    onConnect: () => {
      subscription = client.subscribe('/user/queue/messages', (frame: IMessage) => {
        try {
          const payload = JSON.parse(frame.body) as MessageResponse;
          opts.onMessage(payload);
        } catch (err) {
          // ignore malformed frames
        }
      });
      opts.onConnect?.();
    },
    onStompError: (frame) => {
      opts.onError?.(new Error(frame.headers['message'] ?? 'STOMP error'));
    },
    onWebSocketError: () => {
      opts.onError?.(new Error('WebSocket error'));
    },
  });

  client.activate();

  return {
    send(conversationId, content) {
      if (!client.connected) return;
      client.publish({
        destination: `/app/conversations/${conversationId}/send`,
        body: JSON.stringify({ content }),
      });
    },
    disconnect() {
      subscription?.unsubscribe();
      client.deactivate();
    },
  };
}
