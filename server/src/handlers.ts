/**
 * Socket.IO event handlers for ORBITONE multiplayer sessions.
 * Implements strict runtime Zod validation and server-authoritative state transitions.
 */

import type { Server, Socket } from 'socket.io';
import {
  buildReport,
  checkRoleAuthorization,
  createRoomPayloadSchema,
  editPartPayloadSchema,
  joinRoomPayloadSchema,
  parts,
  proposeDecisionPayloadSchema,
  resolveVotes,
  runSimulation,
  scoreMission,
  setRolePayloadSchema,
  startSimPayloadSchema,
  votePayloadSchema,
  type ActionRejectedPayload,
  type DecisionResolvedPayload,
  type ErrorPayload,
  type RoomCreatedPayload,
  type RoomJoinedPayload,
  type SimResultPayload
} from '@orbitone/shared';
import type { RoomRegistry } from './rooms.js';
import { evaluateDesign, toClientPlayers, toStateUpdatePayload, type RoomState } from './state.js';

export function roomChannel(roomCode: string): string {
  return `room:${roomCode.toUpperCase().trim()}`;
}

export function setupSocketHandlers(io: Server, socket: Socket, registry: RoomRegistry): void {
  // --------------------------------------------------------------------------
  // 1. create_room
  // --------------------------------------------------------------------------
  socket.on('create_room', (data: unknown) => {
    const parse = createRoomPayloadSchema.safeParse(data);
    if (!parse.success) {
      const err: ErrorPayload = {
        message: `Invalid create_room payload: ${parse.error.message}`,
        code: 'INVALID_PAYLOAD'
      };
      socket.emit('error', err);
      return;
    }

    const { playerName, preferredRole, difficultyLevel } = parse.data;
    const { room, player } = registry.createRoom(playerName, preferredRole, difficultyLevel);

    registry.bindSocket(socket.id, room.code, player.id);
    socket.join(roomChannel(room.code));

    const createdMsg: RoomCreatedPayload = {
      roomCode: room.code,
      playerId: player.id,
      playerToken: player.token,
      assignedRole: player.role,
      players: toClientPlayers(room.players),
      design: room.design,
      meters: room.meters,
      validation: room.validation
    };

    socket.emit('room_created', createdMsg);
    io.to(roomChannel(room.code)).emit('state_update', toStateUpdatePayload(room));
  });

  // --------------------------------------------------------------------------
  // 2. join_room
  // --------------------------------------------------------------------------
  socket.on('join_room', (data: unknown) => {
    const parse = joinRoomPayloadSchema.safeParse(data);
    if (!parse.success) {
      const err: ErrorPayload = {
        message: `Invalid join_room payload: ${parse.error.message}`,
        code: 'INVALID_PAYLOAD'
      };
      socket.emit('error', err);
      return;
    }

    const { roomCode, playerName, playerId, playerToken, preferredRole } = parse.data;
    const result = registry.joinRoom(roomCode, playerName, playerId, playerToken, preferredRole);

    if ('error' in result) {
      const err: ErrorPayload = {
        message: result.error,
        code: result.code
      };
      socket.emit('error', err);
      return;
    }

    const { room, player } = result;
    registry.bindSocket(socket.id, room.code, player.id);
    socket.join(roomChannel(room.code));

    const joinedMsg: RoomJoinedPayload = {
      roomCode: room.code,
      playerId: player.id,
      playerToken: player.token,
      assignedRole: player.role,
      players: toClientPlayers(room.players),
      design: room.design,
      meters: room.meters,
      validation: room.validation
    };

    socket.emit('room_joined', joinedMsg);
    io.to(roomChannel(room.code)).emit('state_update', toStateUpdatePayload(room));
  });

  // --------------------------------------------------------------------------
  // 3. set_role
  // --------------------------------------------------------------------------
  socket.on('set_role', (data: unknown) => {
    const parse = setRolePayloadSchema.safeParse(data);
    if (!parse.success) {
      const err: ErrorPayload = {
        message: `Invalid set_role payload: ${parse.error.message}`,
        code: 'INVALID_PAYLOAD'
      };
      socket.emit('error', err);
      return;
    }

    const { roomCode, playerId, role } = parse.data;
    const room = registry.getRoom(roomCode);
    if (!room) {
      socket.emit('error', { message: `Room "${roomCode}" not found.`, code: 'ROOM_NOT_FOUND' });
      return;
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) {
      socket.emit('error', { message: `Player "${playerId}" not found in room.`, code: 'BAD_REQUEST' });
      return;
    }

    // Role uniqueness check in multiplayer
    const roleTaken = room.players.some((p) => p.id !== playerId && p.role === role);
    if (roleTaken) {
      const rejection: ActionRejectedPayload = {
        action: 'set_role',
        reason: `Role "${role}" is already claimed by another team member.`,
        code: 'ROLE_TAKEN',
        playerId
      };
      socket.emit('action_rejected', rejection);
      return;
    }

    player.role = role;
    room.version += 1;
    io.to(roomChannel(room.code)).emit('state_update', toStateUpdatePayload(room));
  });

  // --------------------------------------------------------------------------
  // 4. edit_part
  // --------------------------------------------------------------------------
  socket.on('edit_part', (data: unknown) => {
    const parse = editPartPayloadSchema.safeParse(data);
    if (!parse.success) {
      const err: ErrorPayload = {
        message: `Invalid edit_part payload: ${parse.error.message}`,
        code: 'INVALID_PAYLOAD'
      };
      socket.emit('error', err);
      return;
    }

    const { roomCode, playerId, action, partId } = parse.data;
    const room = registry.getRoom(roomCode);
    if (!room) {
      socket.emit('error', { message: `Room "${roomCode}" not found.`, code: 'ROOM_NOT_FOUND' });
      return;
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) {
      socket.emit('error', { message: `Player "${playerId}" not found in room.`, code: 'BAD_REQUEST' });
      return;
    }

    const targetPart = parts.find((p) => p.id === partId);
    if (!targetPart) {
      const rejection: ActionRejectedPayload = {
        action: 'edit_part',
        reason: `Part "${partId}" does not exist in catalog.`,
        code: 'INVALID_PART',
        playerId
      };
      socket.emit('action_rejected', rejection);
      return;
    }

    // Role-based subsystem authorization check
    const auth = checkRoleAuthorization(player.role, targetPart.category);
    if (!auth.authorized) {
      const rejection: ActionRejectedPayload = {
        action: 'edit_part',
        reason: auth.reason,
        code: 'UNAUTHORIZED_ROLE',
        playerId
      };
      socket.emit('action_rejected', rejection);
      return;
    }

    // Apply part modification
    if (action === 'add') {
      room.design.part_ids.push(partId);
    } else if (action === 'remove') {
      const idx = room.design.part_ids.indexOf(partId);
      if (idx !== -1) {
        room.design.part_ids.splice(idx, 1);
      }
    }

    // Recompute state with authoritative rules engine
    const { meters, validation } = evaluateDesign(room.design);
    room.meters = meters;
    room.validation = validation;
    room.version += 1;

    io.to(roomChannel(room.code)).emit('state_update', toStateUpdatePayload(room));
  });

  // --------------------------------------------------------------------------
  // 5. propose_decision
  // --------------------------------------------------------------------------
  socket.on('propose_decision', (data: unknown) => {
    const parse = proposeDecisionPayloadSchema.safeParse(data);
    if (!parse.success) {
      const err: ErrorPayload = {
        message: `Invalid propose_decision payload: ${parse.error.message}`,
        code: 'INVALID_PAYLOAD'
      };
      socket.emit('error', err);
      return;
    }

    const { roomCode, playerId, decision, options, initialChoice, description } = parse.data;
    const room = registry.getRoom(roomCode);
    if (!room) {
      socket.emit('error', { message: `Room "${roomCode}" not found.`, code: 'ROOM_NOT_FOUND' });
      return;
    }

    if (room.activeDecision) {
      const rejection: ActionRejectedPayload = {
        action: 'propose_decision',
        reason: `A shared decision ("${room.activeDecision.decision}") is already currently open for voting.`,
        code: 'BAD_REQUEST',
        playerId
      };
      socket.emit('action_rejected', rejection);
      return;
    }

    const N = room.players.length;
    const majorityThreshold = N === 2 ? 2 : Math.floor(N / 2) + 1;
    const votes: Record<string, string> = {};
    if (initialChoice && options.includes(initialChoice)) {
      votes[playerId] = initialChoice;
    }

    const votedPlayerIds = Object.keys(votes);
    const missingPlayerIds = room.players.map((p) => p.id).filter((id) => !votes[id]);

    room.activeDecision = {
      decision,
      proposerId: playerId,
      options,
      description,
      votes,
      majorityThreshold,
      votedPlayerIds,
      missingPlayerIds
    };

    // Check if single-player (solo mode) immediately resolves
    const voteResult = resolveVotes({
      decision,
      players: room.players,
      votes,
      options: { allowedChoices: options }
    });

    if (voteResult.status === 'passed') {
      applyDecisionChange(room, decision, voteResult.winner);
      room.activeDecision = null;
      room.version += 1;

      const resolvedMsg: DecisionResolvedPayload = {
        roomCode: room.code,
        decision,
        result: voteResult,
        appliedChange: { field: getDecisionField(decision), value: voteResult.winner }
      };

      io.to(roomChannel(room.code)).emit('decision_resolved', resolvedMsg);
      io.to(roomChannel(room.code)).emit('state_update', toStateUpdatePayload(room));
      return;
    }

    room.version += 1;
    io.to(roomChannel(room.code)).emit('state_update', toStateUpdatePayload(room));
  });

  // --------------------------------------------------------------------------
  // 6. vote
  // --------------------------------------------------------------------------
  socket.on('vote', (data: unknown) => {
    const parse = votePayloadSchema.safeParse(data);
    if (!parse.success) {
      const err: ErrorPayload = {
        message: `Invalid vote payload: ${parse.error.message}`,
        code: 'INVALID_PAYLOAD'
      };
      socket.emit('error', err);
      return;
    }

    const { roomCode, playerId, decision, choice } = parse.data;
    const room = registry.getRoom(roomCode);
    if (!room) {
      socket.emit('error', { message: `Room "${roomCode}" not found.`, code: 'ROOM_NOT_FOUND' });
      return;
    }

    if (!room.activeDecision || room.activeDecision.decision !== decision) {
      const rejection: ActionRejectedPayload = {
        action: 'vote',
        reason: `No active voting session for decision "${decision}".`,
        code: 'VOTE_CLOSED',
        playerId
      };
      socket.emit('action_rejected', rejection);
      return;
    }

    if (!room.activeDecision.options.includes(choice)) {
      const rejection: ActionRejectedPayload = {
        action: 'vote',
        reason: `Choice "${choice}" is not in the allowed options list (${room.activeDecision.options.join(', ')}).`,
        code: 'INVALID_VOTE',
        playerId
      };
      socket.emit('action_rejected', rejection);
      return;
    }

    room.activeDecision.votes[playerId] = choice;
    room.activeDecision.votedPlayerIds = Object.keys(room.activeDecision.votes);
    room.activeDecision.missingPlayerIds = room.players
      .map((p) => p.id)
      .filter((id) => !room.activeDecision!.votes[id]);

    const result = resolveVotes({
      decision,
      players: room.players,
      votes: room.activeDecision.votes,
      options: { allowedChoices: room.activeDecision.options }
    });

    if (result.status === 'passed') {
      applyDecisionChange(room, decision, result.winner);
      room.activeDecision = null;
      room.version += 1;

      const resolvedMsg: DecisionResolvedPayload = {
        roomCode: room.code,
        decision,
        result,
        appliedChange: { field: getDecisionField(decision), value: result.winner }
      };

      io.to(roomChannel(room.code)).emit('decision_resolved', resolvedMsg);
      io.to(roomChannel(room.code)).emit('state_update', toStateUpdatePayload(room));
    } else if (result.status === 'tie' || result.status === 'no_majority') {
      room.activeDecision = null;
      room.version += 1;

      const resolvedMsg: DecisionResolvedPayload = {
        roomCode: room.code,
        decision,
        result,
        appliedChange: null
      };

      io.to(roomChannel(room.code)).emit('decision_resolved', resolvedMsg);
      io.to(roomChannel(room.code)).emit('state_update', toStateUpdatePayload(room));
    } else {
      // Pending missing votes
      room.version += 1;
      io.to(roomChannel(room.code)).emit('state_update', toStateUpdatePayload(room));
    }
  });

  // --------------------------------------------------------------------------
  // 7. start_sim
  // --------------------------------------------------------------------------
  socket.on('start_sim', (data: unknown) => {
    const parse = startSimPayloadSchema.safeParse(data);
    if (!parse.success) {
      const err: ErrorPayload = {
        message: `Invalid start_sim payload: ${parse.error.message}`,
        code: 'INVALID_PAYLOAD'
      };
      socket.emit('error', err);
      return;
    }

    const { roomCode, playerId, seed, level } = parse.data;
    const room = registry.getRoom(roomCode);
    if (!room) {
      socket.emit('error', { message: `Room "${roomCode}" not found.`, code: 'ROOM_NOT_FOUND' });
      return;
    }

    // Authoritative pre-launch check evaluation
    const { validation } = evaluateDesign(room.design);
    if (!validation.passed) {
      const failedCheck = validation.checks.find((c) => !c.passed);
      const rejection: ActionRejectedPayload = {
        action: 'start_sim',
        reason: `Cannot launch: pre-launch checks failed (${failedCheck ? failedCheck.reason : 'unknown check failure'}).`,
        code: 'PRE_LAUNCH_CHECKS_FAILED',
        playerId
      };
      socket.emit('action_rejected', rejection);
      return;
    }

    const effectiveSeed = seed ?? 42;
    const effectiveLevel = level ?? 1;

    // Run pure deterministic simulation & scoring
    const sim = runSimulation(room.design, effectiveSeed, effectiveLevel);
    const mode = room.players.length > 1 ? 'team' : 'solo';
    const score = scoreMission(sim, mode);
    const report = buildReport(sim, score);

    room.simStatus = 'completed';
    room.version += 1;

    const simMsg: SimResultPayload = {
      roomCode: room.code,
      sim,
      report,
      score
    };

    io.to(roomChannel(room.code)).emit('sim_result', simMsg);
    io.to(roomChannel(room.code)).emit('state_update', toStateUpdatePayload(room));
  });

  // --------------------------------------------------------------------------
  // Disconnect
  // --------------------------------------------------------------------------
  socket.on('disconnect', () => {
    const res = registry.handleDisconnect(socket.id);
    if (res) {
      io.to(roomChannel(res.room.code)).emit('state_update', toStateUpdatePayload(res.room));
    }
  });
}

function getDecisionField(decision: string): string {
  switch (decision) {
    case 'objective':
      return 'objective_id';
    case 'orbit':
      return 'orbit_id';
    case 'launch_vehicle':
      return 'vehicle_id';
    default:
      return decision;
  }
}

function applyDecisionChange(room: RoomState, decision: string, winner: string | null): void {
  if (!winner) return;
  const field = getDecisionField(decision);
  (room.design as unknown as Record<string, unknown>)[field] = winner;
  const { meters, validation } = evaluateDesign(room.design);
  room.meters = meters;
  room.validation = validation;
}

