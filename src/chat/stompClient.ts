import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { WS_BASE_URL } from '@/api/client';
import { tokenStorage } from '@/auth/secureStore';
import type { MessageResponse, UUID } from '@/types/api';

/** Pushed by the server when the other participant reads the conversation. */
export interface ReadReceipt {
  conversationId: UUID;
  readerId: UUID;
  readAt: string;
}

export interface ChatConnection {
  send: (conversationId: UUID, content: string) => void;
  disconnect: () => void;
}

export async function connectChat(opts: {
  onMessage: (msg: MessageResponse) => void;
  onRead?: (receipt: ReadReceipt) => void;
  onConnect?: () => void;
  onError?: (err: Error) => void;
}): Promise<ChatConnection> {
  const token = await tokenStorage.getAccess();
  if (!token) throw new Error('Not authenticated');

  let subscription: StompSubscription | null = null;
  let readSubscription: StompSubscription | null = null;

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
      readSubscription = client.subscribe('/user/queue/read', (frame: IMessage) => {
        try {
          const payload = JSON.parse(frame.body) as ReadReceipt;
          opts.onRead?.(payload);
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
        destination: `/app/conversations/${conversationId}/sendMessageInChat`,
        body: JSON.stringify({ content }),
      });
    },
    disconnect() {
      subscription?.unsubscribe();
      readSubscription?.unsubscribe();
      client.deactivate();
    },
  };
}
