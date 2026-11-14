
/**
 * ORBITONE Real Socket.IO Transport
 *
 * Implements MultiplayerTransport over a live Socket.IO connection to
 * the authoritative game server.
 *
 * Protocol source of truth:
 * shared/src/protocol.ts
 *
 * Responsibilities:
 * - Validate outgoing client intents.
 * - Validate incoming server messages.
 * - Manage Socket.IO connection lifecycle.
 * - Support automatic reconnection.
 * - Expose connection-state updates.
 * - Clean up listeners and socket resources.
 *
 * Important:
 * - Server authority remains on the backend.
 * - Socket.IO emit() does not prove server acceptance.
 * - Server-side action_rejected and error events remain authoritative.
 */

import { io, type Socket } from 'socket.io-client';

import {
  SERVER_MESSAGES,
  safeParseClientIntent,
  safeParseServerMessage,
  type ClientIntent,
  type ClientIntentMap,
  type ServerMessage,
  type ErrorPayload
} from '@shared';

import type {
  MultiplayerTransport,
  ServerMessageListener,
  ConnectionStateListener
} from './transport';

// ============================================================================
// Configuration
// ============================================================================

export interface SocketIoTransportOptions {
  serverUrl?: string;
  autoConnect?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

// ============================================================================
// Socket.IO Transport
// ============================================================================

export class SocketIoTransport implements MultiplayerTransport {
  public readonly isMock = false;
  public readonly transportLabel = 'LIVE SERVER';

  private socket: Socket;
  private serverUrl: string;

  private messageListeners = new Map<
    ServerMessage,
    Set<ServerMessageListener<any>>
  >();

  private connectionListeners = new Set<ConnectionStateListener>();

  private connectPromise: Promise<void> | null = null;

  private destroyed = false;

  constructor(options?: SocketIoTransportOptions) {
    const environmentUrl =
      typeof import.meta !== 'undefined'
        ? import.meta.env?.VITE_SERVER_URL
        : undefined;

    const defaultUrl =
      environmentUrl ||
      (typeof window !== 'undefined' &&
      window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : '');

    this.serverUrl = options?.serverUrl ?? defaultUrl;

    if (!this.serverUrl) {
      console.warn(
        '[SocketIoTransport] No server URL configured. ' +
        'Set VITE_SERVER_URL before connecting.'
      );
    }

    this.socket = io(this.serverUrl, {
      autoConnect: options?.autoConnect ?? false,

      reconnection: true,

      reconnectionAttempts:
        options?.reconnectionAttempts ?? 10,

      reconnectionDelay:
        options?.reconnectionDelay ?? 1000,

      transports: ['websocket', 'polling']
    });

    this.setupListeners();
  }

  // ==========================================================================
  // Public State
  // ==========================================================================

  public get isConnected(): boolean {
    return this.socket.connected;
  }

  public get url(): string {
    return this.serverUrl;
  }

  // ==========================================================================
  // Connection Management
  // ==========================================================================

  /**
   * Connect to the authoritative game server.
   *
   * Resolves when the initial connection succeeds.
   * Rejects when the initial connection attempt fails.
   *
   * Socket.IO automatic reconnection remains enabled after this promise
   * rejects. Connection-state listeners report subsequent changes.
   */
  public connect(): Promise<void> {
    if (this.destroyed) {
      return Promise.reject(
        new Error('SocketIoTransport has been destroyed.')
      );
    }

    if (this.socket.connected) {
      return Promise.resolve();
    }

    // Prevent multiple simultaneous connection attempts.
    if (this.connectPromise) {
      return this.connectPromise;
    }

    if (!this.serverUrl) {
      return Promise.reject(
        new Error(
          'No server URL configured. Set VITE_SERVER_URL.'
        )
      );
    }

    this.connectPromise = new Promise<void>((resolve, reject) => {
      let settled = false;

      const cleanup = () => {
        this.socket.off('connect', onConnect);
        this.socket.off('connect_error', onConnectError);
      };

      const onConnect = () => {
        if (settled) return;

        settled = true;
        cleanup();

        resolve();
      };

      const onConnectError = (error: Error) => {
        if (settled) return;

        settled = true;
        cleanup();

        reject(error);
      };

      this.socket.once('connect', onConnect);
      this.socket.once('connect_error', onConnectError);

      try {
        this.socket.connect();
      } catch (error) {
        settled = true;
        cleanup();

        reject(error);
      }
    }).finally(() => {
      this.connectPromise = null;
    });

    return this.connectPromise;
  }

  /**
   * Disconnect the socket.
   *
   * Socket.IO emits its normal disconnect event when applicable.
   */
  public disconnect(): void {
    if (this.destroyed) return;

    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  // ==========================================================================
  // Server Message Subscriptions
  // ==========================================================================

  /**
   * Subscribe to a protocol-defined server message.
   *
   * Returns an unsubscribe function.
   */
  public on<T extends ServerMessage>(
    event: T,
    listener: ServerMessageListener<T>
  ): () => void {
    if (this.destroyed) {
      return () => {};
    }

    if (!this.messageListeners.has(event)) {
      this.messageListeners.set(
        event,
        new Set<ServerMessageListener<any>>()
      );
    }

    const listeners = this.messageListeners.get(event)!;

    listeners.add(listener);

    return () => {
      listeners.delete(listener);

      if (listeners.size === 0) {
        this.messageListeners.delete(event);
      }
    };
  }

  /**
   * Subscribe to connection-state changes.
   *
   * The current connection state is delivered immediately.
   * Returns an unsubscribe function.
   */
  public onConnectionChange(
    listener: ConnectionStateListener
  ): () => void {
    if (this.destroyed) {
      return () => {};
    }

    this.connectionListeners.add(listener);

    listener(this.socket.connected);

    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  // ==========================================================================
  // Client Intent Sending
  // ==========================================================================

  /**
   * Send a protocol-defined client intent.
   *
   * Outbound payloads are validated before emission.
   *
   * IMPORTANT:
   * socket.emit() only sends the event. It does not prove that the
   * server accepted or processed the intent.
   *
   * Server responses such as action_rejected, error, state_update,
   * and decision_resolved determine the actual outcome.
   */
  public async send<T extends ClientIntent>(
    event: T,
    data: ClientIntentMap[T]
  ): Promise<void> {
    if (this.destroyed) {
      this.dispatchLocalError({
        message: 'Cannot send intent: transport has been destroyed.',
        code: 'TRANSPORT_DESTROYED'
      });

      return;
    }

    // Validate before attempting network activity.
    const parsed = safeParseClientIntent(event, data);

    if (!parsed.success) {
      const errorMessage = parsed.error.issues
        .map(
          (issue) =>
            `${issue.path.join('.')}: ${issue.message}`
        )
        .join(', ');

      this.dispatchLocalError({
        message:
          `Client intent validation failed for ${event}: ` +
          errorMessage,
        code: 'INVALID_CLIENT_PAYLOAD'
      });

      return;
    }

    // Ensure an initial connection exists.
    if (!this.socket.connected) {
      try {
        await this.connect();
      } catch (error) {
        this.dispatchLocalError({
          message:
            `Cannot send "${event}": Unable to connect to ` +
            `${this.serverUrl}. ${
              error instanceof Error
                ? error.message
                : String(error)
            }`,
          code: 'NOT_CONNECTED'
        });

        return;
      }
    }

    // The socket may have disconnected while awaiting connection.
    if (!this.socket.connected) {
      this.dispatchLocalError({
        message:
          `Cannot send "${event}": Socket disconnected before emission.`,
        code: 'NOT_CONNECTED'
      });

      return;
    }

    try {
      this.socket.emit(event, parsed.data);
    } catch (error) {
      this.dispatchLocalError({
        message:
          `Failed to emit "${event}": ${
            error instanceof Error
              ? error.message
              : String(error)
          }`,
        code: 'EMIT_FAILED'
      });
    }
  }

  // ==========================================================================
  // Internal Socket Event Binding
  // ==========================================================================

  private setupListeners(): void {
    // Successful connection.
    this.socket.on('connect', () => {
      this.notifyConnectionState(true);
    });

    // Disconnection.
    this.socket.on('disconnect', (reason) => {
      this.notifyConnectionState(false);

      // Socket.IO does not automatically reconnect after a
      // server-initiated disconnect.
      if (
        reason === 'io server disconnect' &&
        !this.destroyed
      ) {
        this.socket.connect();
      }
    });

    // Connection errors.
    this.socket.on('connect_error', (error: Error) => {
      this.notifyConnectionState(false);

      this.dispatchLocalError({
        message:
          `Mission server connection error: ${error.message}`,
        code: 'CONNECT_ERROR'
      });
    });

    // Register all protocol-defined server messages.
    for (const event of SERVER_MESSAGES) {
      this.socket.on(event, (payload: unknown) => {
        this.handleIncomingMessage(event, payload);
      });
    }
  }

  // ==========================================================================
  // Incoming Server Message Validation
  // ==========================================================================

  /**
   * Validate incoming server payloads against shared protocol schemas.
   *
   * Invalid messages are rejected locally and never dispatched to
   * application listeners.
   */
  private handleIncomingMessage(
    event: ServerMessage,
    payload: unknown
  ): void {
    if (this.destroyed) return;

    const parsed = safeParseServerMessage(event, payload);

    if (!parsed.success) {
      const errorMessage = parsed.error.issues
        .map(
          (issue) =>
            `${issue.path.join('.')}: ${issue.message}`
        )
        .join(', ');

      console.error(
        `[SocketIoTransport] Invalid server message "${event}":`,
        errorMessage
      );

      this.dispatchLocalError({
        message:
          `Invalid server payload received for "${event}": ` +
          errorMessage,
        code: 'INVALID_SERVER_PAYLOAD'
      });

      return;
    }

    this.dispatchServerMessage(event, parsed.data);
  }

  // ==========================================================================
  // Internal Message Dispatch
  // ==========================================================================

  private dispatchServerMessage<T extends ServerMessage>(
    event: T,
    payload: unknown
  ): void {
    const listeners = this.messageListeners.get(event);

    if (!listeners) return;

    // Copy the set to prevent subscription changes during iteration
    // from affecting the current dispatch.
    for (const listener of [...listeners]) {
      try {
        listener(payload);
      } catch (error) {
        console.error(
          `[SocketIoTransport] Listener error for "${event}":`,
          error
        );
      }
    }
  }

  // ==========================================================================
  // Local Error Reporting
  // ==========================================================================

  /**
   * Dispatch a local transport error through the existing error
   * message subscription.
   *
   * This is a client-generated diagnostic, not a server response.
   */
  private dispatchLocalError(payload: ErrorPayload): void {
    this.dispatchServerMessage('error', payload);
  }

  // ==========================================================================
  // Connection-State Notifications
  // ==========================================================================

  private notifyConnectionState(connected: boolean): void {
    if (this.destroyed) return;

    for (const listener of [...this.connectionListeners]) {
      try {
        listener(connected);
      } catch (error) {
        console.error(
          '[SocketIoTransport] Connection listener error:',
          error
        );
      }
    }
  }

  // ==========================================================================
  // Resource Cleanup
  // ==========================================================================

  /**
   * Permanently dispose of this transport instance.
   *
   * Use this when the lobby or application no longer needs the
   * connection. Do not use it for temporary network disconnections.
   *
   * This method is an additional concrete-class method; it does not
   * require changing the existing MultiplayerTransport interface.
   */
  public destroy(): void {
    if (this.destroyed) return;

    this.destroyed = true;

    this.socket.removeAllListeners();

    this.socket.disconnect();

    this.messageListeners.clear();
    this.connectionListeners.clear();

    this.connectPromise = null;
  }
}
