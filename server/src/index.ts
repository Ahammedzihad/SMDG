/**
 * ORBITONE Express & Socket.IO server bootstrap.
 */

import http from 'node:http';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { type Express } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { setupSocketHandlers } from './handlers.js';
import { RoomRegistry } from './rooms.js';

dotenv.config();

export interface ServerInstance {
  app: Express;
  httpServer: http.Server;
  io: SocketIOServer;
  registry: RoomRegistry;
  port: number;
  start: () => Promise<number>;
  stop: () => Promise<void>;
}

export function createAppServer(options?: {
  port?: number;
  clientOrigin?: string;
  registry?: RoomRegistry;
}): ServerInstance {
  const app = express();
  const clientOrigin = options?.clientOrigin ?? process.env.CLIENT_ORIGIN ?? '*';
  const registry = options?.registry ?? new RoomRegistry();

  app.use(cors({ origin: clientOrigin, credentials: true }));
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  const httpServer = http.createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: clientOrigin,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    setupSocketHandlers(io, socket, registry);
  });

  let activePort = options?.port ?? Number(process.env.PORT || 3000);

  const start = (): Promise<number> => {
    return new Promise((resolve) => {
      httpServer.listen(activePort, () => {
        const addr = httpServer.address();
        if (typeof addr === 'object' && addr !== null) {
          activePort = addr.port;
        }
        resolve(activePort);
      });
    });
  };

  let isStopped = false;
  const stop = (): Promise<void> => {
    if (isStopped) return Promise.resolve();
    isStopped = true;
    return new Promise((resolve, reject) => {
      registry.clear();
      io.close((err) => {
        if (err && (err as { code?: string }).code !== 'ERR_SERVER_NOT_RUNNING') {
          return reject(err);
        }
        if (httpServer.listening) {
          httpServer.close((httpErr) => {
            if (httpErr && (httpErr as { code?: string }).code !== 'ERR_SERVER_NOT_RUNNING') {
              return reject(httpErr);
            }
            resolve();
          });
        } else {
          resolve();
        }
      });
    });
  };

  return { app, httpServer, io, registry, port: activePort, start, stop };
}

// Auto-start server when run directly
const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith('index.ts') || process.argv[1].endsWith('index.js'));

if (isDirectRun && process.env.NODE_ENV !== 'test') {
  const instance = createAppServer();
  instance.start().then((port) => {
    console.log(`[ORBITONE] Server running at http://localhost:${port}`);
    console.log(`[ORBITONE] Health endpoint at http://localhost:${port}/health`);
  });
}

