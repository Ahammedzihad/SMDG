/**
 * Room registry and lifecycle management for ORBITONE multiplayer sessions.
 */

import crypto from 'node:crypto';
import {
  DEFAULT_INITIAL_DESIGN,
  evaluateDesign,
  type RoomState,
  type ServerPlayer
} from './state.js';
import { TEAM_ROLES, type TeamRole } from '@orbitone/shared';

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ'; // 23 characters, excludes ambiguous I, O, L
export const MAX_ROOM_PLAYERS = 4;
export const DEFAULT_CLEANUP_TIMEOUT_MS = 60 * 1000; // 1 minute default

function generate4LetterCode(): string {
  let code = '';
  for (let i = 0; i < 4; i++) {
    const idx = crypto.randomInt(0, CODE_ALPHABET.length);
    code += CODE_ALPHABET[idx];
  }
  return code;
}

function generatePlayerToken(): string {
  return `tok_${crypto.randomBytes(16).toString('hex')}`;
}

function generatePlayerId(): string {
  return `p_${crypto.randomBytes(6).toString('hex')}`;
}

export class RoomRegistry {
  private rooms = new Map<string, RoomState>();
  private socketToPlayer = new Map<string, { roomCode: string; playerId: string }>();
  private cleanupTimeoutMs: number;

  constructor(options?: { cleanupTimeoutMs?: number }) {
    this.cleanupTimeoutMs = options?.cleanupTimeoutMs ?? DEFAULT_CLEANUP_TIMEOUT_MS;
  }

  /**
   * Generates a unique 4-letter room code.
   */
  public generateUniqueCode(): string {
    let code: string;
    let attempts = 0;
    do {
      code = generate4LetterCode();
      attempts++;
      if (attempts > 1000) {
        throw new Error('Unable to generate unique room code (namespace full)');
      }
    } while (this.rooms.has(code));
    return code;
  }

  /**
   * Creates a new room and assigns the first player as the creator.
   */
  public createRoom(
    playerName: string,
    preferredRole?: TeamRole,
    _difficultyLevel?: number
  ): { room: RoomState; player: ServerPlayer } {
    const code = this.generateUniqueCode();
    const assignedRole: TeamRole = preferredRole ?? 'mission_planner';

    const creator: ServerPlayer = {
      id: generatePlayerId(),
      name: playerName.trim(),
      role: assignedRole,
      token: generatePlayerToken(),
      connected: true
    };

    const initialDesign = { ...DEFAULT_INITIAL_DESIGN, part_ids: [...DEFAULT_INITIAL_DESIGN.part_ids] };
    const { meters, validation } = evaluateDesign(initialDesign);

    const room: RoomState = {
      code,
      players: [creator],
      design: initialDesign,
      meters,
      validation,
      activeDecision: null,
      simStatus: 'idle',
      version: 1,
      lastActiveAt: Date.now()
    };

    this.rooms.set(code, room);
    return { room, player: creator };
  }

  /**
   * Gets an existing room by its code.
   */
  public getRoom(code: string): RoomState | undefined {
    return this.rooms.get(code.toUpperCase().trim());
  }

  /**
   * Joins an existing room, supporting both new joins and reconnection via player token.
   */
  public joinRoom(
    code: string,
    playerName: string,
    playerId?: string,
    playerToken?: string,
    preferredRole?: TeamRole
  ): { room: RoomState; player: ServerPlayer; isReconnect: boolean } | { error: string; code: string } {
    const cleanCode = code.toUpperCase().trim();
    const room = this.rooms.get(cleanCode);

    if (!room) {
      return { error: `Room not found with code "${cleanCode}".`, code: 'ROOM_NOT_FOUND' };
    }

    // Cancel cleanup timer if active
    if (room.cleanupTimer) {
      clearTimeout(room.cleanupTimer);
      room.cleanupTimer = undefined;
    }

    room.lastActiveAt = Date.now();

    // 1. Check for Reconnection
    if (playerId && playerToken) {
      const existingPlayer = room.players.find(
        (p) => p.id === playerId && p.token === playerToken
      );

      if (existingPlayer) {
        existingPlayer.connected = true;
        if (playerName && playerName.trim()) {
          existingPlayer.name = playerName.trim();
        }
        return { room, player: existingPlayer, isReconnect: true };
      }
    }

    // 2. Enforce Max 4 Players
    if (room.players.length >= MAX_ROOM_PLAYERS) {
      return { error: 'Room is full (maximum 4 players allowed).', code: 'ROOM_FULL' };
    }

    // 3. Assign Role for New Player
    const claimedRoles = new Set(room.players.map((p) => p.role));
    let roleToAssign: TeamRole;

    if (preferredRole && !claimedRoles.has(preferredRole)) {
      roleToAssign = preferredRole;
    } else {
      const availableRole = TEAM_ROLES.find((r) => !claimedRoles.has(r));
      roleToAssign = availableRole ?? 'science_lead';
    }

    const newPlayer: ServerPlayer = {
      id: generatePlayerId(),
      name: playerName.trim(),
      role: roleToAssign,
      token: generatePlayerToken(),
      connected: true
    };

    room.players.push(newPlayer);
    room.version += 1;

    return { room, player: newPlayer, isReconnect: false };
  }

  /**
   * Associates an active Socket.IO connection ID with a room player.
   */
  public bindSocket(socketId: string, roomCode: string, playerId: string): void {
    const room = this.rooms.get(roomCode);
    if (room) {
      const player = room.players.find((p) => p.id === playerId);
      if (player) {
        player.socketId = socketId;
        player.connected = true;
      }
    }
    this.socketToPlayer.set(socketId, { roomCode, playerId });
  }

  /**
   * Handles socket disconnection and schedules room cleanup if everyone leaves.
   */
  public handleDisconnect(socketId: string): { room: RoomState; player: ServerPlayer } | undefined {
    const binding = this.socketToPlayer.get(socketId);
    if (!binding) return undefined;

    this.socketToPlayer.delete(socketId);
    const room = this.rooms.get(binding.roomCode);
    if (!room) return undefined;

    const player = room.players.find((p) => p.id === binding.playerId);
    if (player) {
      player.connected = false;
      player.socketId = undefined;
    }

    const hasConnectedPlayers = room.players.some((p) => p.connected);
    if (!hasConnectedPlayers) {
      // Schedule room deletion if nobody reconnects
      if (room.cleanupTimer) clearTimeout(room.cleanupTimer);
      room.cleanupTimer = setTimeout(() => {
        this.deleteRoom(room.code);
      }, this.cleanupTimeoutMs);
    }

    return player ? { room, player } : undefined;
  }

  /**
   * Deletes a room from memory.
   */
  public deleteRoom(code: string): boolean {
    const cleanCode = code.toUpperCase().trim();
    const room = this.rooms.get(cleanCode);
    if (room?.cleanupTimer) {
      clearTimeout(room.cleanupTimer);
    }
    return this.rooms.delete(cleanCode);
  }

  /**
   * Cleans up all rooms and timers (used for test teardown).
   */
  public clear(): void {
    for (const room of this.rooms.values()) {
      if (room.cleanupTimer) clearTimeout(room.cleanupTimer);
    }
    this.rooms.clear();
    this.socketToPlayer.clear();
  }
}
