/**
 * ORBITONE Multiplayer Transport Abstraction
 *
 * Defines a transport-agnostic interface for ORBITONE multiplayer communication.
 * Allows seamless switching between the DEVELOPMENT MOCK transport and Person A's
 * real Socket.IO transport without modifying the UI layer.
 */

import type {
  ClientIntent,
  ClientIntentMap,
  ServerMessage,
  ServerMessageMap
} from '@shared';

export type ServerMessageListener<T extends ServerMessage> = (
  payload: ServerMessageMap[T]
) => void;

export type ConnectionStateListener = (connected: boolean) => void;

export interface MultiplayerTransport {
  /**
   * Indicates whether this transport is a local mock or a real network socket.
   */
  readonly isMock: boolean;

  /**
   * Human-readable label for the transport (e.g. 'DEVELOPMENT MOCK' or 'LIVE SOCKET.IO').
   */
  readonly transportLabel: string;

  /**
   * Current connection status.
   */
  readonly isConnected: boolean;

  /**
   * Connect to the transport.
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the transport.
   */
  disconnect(): void;

  /**
   * Send a strongly-typed client intent to the server authority.
   */
  send<T extends ClientIntent>(event: T, data: ClientIntentMap[T]): Promise<void>;

  /**
   * Register a listener for a specific server message.
   * Returns an unsubscribe function.
   */
  on<T extends ServerMessage>(event: T, listener: ServerMessageListener<T>): () => void;

  /**
   * Register a listener for connection status changes.
   * Returns an unsubscribe function.
   */
  onConnectionChange(listener: ConnectionStateListener): () => void;
}

