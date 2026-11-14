/**
 * ORBITONE Development Mock Transport
 *
 * Explicitly labelled: DEVELOPMENT MOCK
 * Simulates server authority and network protocol locally when Person A's
 * Socket.IO backend is not yet available or for automated offline tests.
 *
 * Strictly adheres to shared protocol definitions (shared/src/protocol.ts)
 * and shared team rules (shared/src/team.ts).
 */

import {
  safeParseClientIntent,
  safeParseServerMessage,
  resolveVotes,
  computeMeters,
  runSimulation,
  buildReport,
  scoreMission,
  TEAM_ROLES,
  TEAM_ROLE_INFO,
  type ClientIntent,
  type ClientIntentMap,
  type ServerMessage,
  type ServerMessageMap,
  type TeamPlayer,
  type TeamRole,
  type MissionDesign,
  type Meters,
  type MissionValidationResult,
  type ActiveDecisionState,
  type StateUpdatePayload
} from '@shared';

import type {
  MultiplayerTransport,
  ServerMessageListener,
  ConnectionStateListener
} from './transport';

import { runChecks } from '../engine/engineAdapter';

interface MockRoom {
  code: string;
  hostId: string;
  players: TeamPlayer[];
  design: MissionDesign;
  meters: Meters;
  validation: MissionValidationResult;
  activeDecision: ActiveDecisionState | null;
  simStatus: 'idle' | 'running' | 'completed';
  version: number;
}

export class MockTransport implements MultiplayerTransport {
  public readonly isMock = true;
  public readonly transportLabel = 'DEVELOPMENT MOCK';

  private connected = false;
  private currentRoom: MockRoom | null = null;
  private currentLocalPlayerId = '';
  private currentLocalPlayerToken = '';

  private messageListeners = new Map<ServerMessage, Set<ServerMessageListener<any>>>();
  private connectionListeners = new Set<ConnectionStateListener>();

  public get isConnected(): boolean {
    return this.connected;
  }

  public get room(): MockRoom | null {
    return this.currentRoom;
  }

  public get localPlayerId(): string {
    return this.currentLocalPlayerId;
  }

  public connect(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.connected = true;
        this.notifyConnectionState(true);
        resolve();
      }, 50);
    });
  }

  public disconnect(): void {
    if (this.connected) {
      this.connected = false;
      this.notifyConnectionState(false);
    }
  }

  public on<T extends ServerMessage>(
    event: T,
    listener: ServerMessageListener<T>
  ): () => void {
    if (!this.messageListeners.has(event)) {
      this.messageListeners.set(event, new Set());
    }
    const set = this.messageListeners.get(event)!;
    set.add(listener);
    return () => set.delete(listener);
  }

  public onConnectionChange(listener: ConnectionStateListener): () => void {
    this.connectionListeners.add(listener);
    return () => this.connectionListeners.delete(listener);
  }

  public async send<T extends ClientIntent>(
    event: T,
    data: ClientIntentMap[T]
  ): Promise<void> {
    if (!this.connected) {
      this.emit('error', {
        message: 'Cannot send intent while disconnected from mock transport.',
        code: 'NOT_CONNECTED'
      });
      return;
    }

    // 1. Strict protocol schema validation of outbound intent
    const parsed = safeParseClientIntent(event, data);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      this.emit('action_rejected', {
        action: event,
        reason: `Schema validation failed: ${errorMsg}`,
        code: 'BAD_REQUEST'
      });
      return;
    }

    // 2. Dispatch to mock authority handler with simulated network delay
    await new Promise((r) => setTimeout(r, 40));
    this.handleClientIntent(event, parsed.data as any);
  }

  // ==========================================================================
  // Mock Server Authority Handlers
  // ==========================================================================

  private handleClientIntent<T extends ClientIntent>(
    event: T,
    data: ClientIntentMap[T]
  ): void {
    switch (event) {
      case 'create_room':
        this.handleCreateRoom(data as ClientIntentMap['create_room']);
        break;
      case 'join_room':
        this.handleJoinRoom(data as ClientIntentMap['join_room']);
        break;
      case 'set_role':
        this.handleSetRole(data as ClientIntentMap['set_role']);
        break;
      case 'edit_part':
        this.handleEditPart(data as ClientIntentMap['edit_part']);
        break;
      case 'propose_decision':
        this.handleProposeDecision(data as ClientIntentMap['propose_decision']);
        break;
      case 'vote':
        this.handleVote(data as ClientIntentMap['vote']);
        break;
      case 'start_sim':
        this.handleStartSim(data as ClientIntentMap['start_sim']);
        break;
      default:
        this.emit('error', {
          message: `Unhandled intent: ${event}`,
          code: 'UNHANDLED_INTENT'
        });
    }
  }

  private handleCreateRoom(payload: ClientIntentMap['create_room']): void {
    const roomCode = this.generateRoomCode();
    const playerId = `usr_${Math.random().toString(36).substring(2, 8)}`;
    const playerToken = `tok_${Math.random().toString(36).substring(2, 10)}`;

    const initialRole: TeamRole = payload.preferredRole || 'mission_planner';
    const player: TeamPlayer = {
      id: playerId,
      name: payload.playerName,
      role: initialRole
    };

    const initialDesign: MissionDesign = {
      cubesat_class_id: '3U',
      orbit_id: 'leo',
      vehicle_id: 'rideshare_dispenser',
      objective_id: 'earth_observation',
      part_ids: [
        'struct_3u',
        'solar_deployable_3u',
        'batt_space_30wh',
        'inst_multispectral_imager',
        'comms_uhf_vhf',
        'adcs_3axis_wheels',
        'obc_rad_hard'
      ],
      lifetime_months: 12,
      fuel_mass_kg: 0.1,
      budget_m: 65.0,
      duty_cycle: 0.8,
      observe_time_fraction: 0.5,
      link_efficiency: 0.95
    };

    const meters = computeMeters(initialDesign);
    const validation = runChecks(initialDesign);

    this.currentRoom = {
      code: roomCode,
      hostId: playerId,
      players: [player],
      design: initialDesign,
      meters,
      validation,
      activeDecision: null,
      simStatus: 'idle',
      version: 1
    };

    this.currentLocalPlayerId = playerId;
    this.currentLocalPlayerToken = playerToken;

    this.emit('room_created', {
      roomCode,
      playerId,
      playerToken,
      assignedRole: initialRole,
      players: [player],
      design: initialDesign,
      meters,
      validation
    });

    this.broadcastStateUpdate();
  }

  private handleJoinRoom(payload: ClientIntentMap['join_room']): void {
    const normalizedCode = payload.roomCode.toUpperCase();
    if (!this.currentRoom || this.currentRoom.code !== normalizedCode) {
      this.emit('error', {
        message: `Room "${payload.roomCode}" does not exist in development mock transport.`,
        code: 'ROOM_NOT_FOUND'
      });
      return;
    }

    if (this.currentRoom.players.length >= 4) {
      this.emit('action_rejected', {
        action: 'join_room',
        reason: 'Room has reached maximum team capacity (4 players).',
        code: 'ROOM_FULL'
      });
      return;
    }

    const playerId = payload.playerId || `usr_${Math.random().toString(36).substring(2, 8)}`;
    const playerToken = payload.playerToken || `tok_${Math.random().toString(36).substring(2, 10)}`;

    // Determine an unassigned role
    const takenRoles = new Set(this.currentRoom.players.map((p) => p.role));
    let assignedRole: TeamRole = payload.preferredRole && !takenRoles.has(payload.preferredRole)
      ? payload.preferredRole
      : (TEAM_ROLES.find((r) => !takenRoles.has(r)) || 'comms_budget_officer');

    const newPlayer: TeamPlayer = {
      id: playerId,
      name: payload.playerName,
      role: assignedRole
    };

    this.currentRoom.players.push(newPlayer);
    this.currentRoom.version += 1;
    this.currentLocalPlayerId = playerId;
    this.currentLocalPlayerToken = playerToken;

    this.emit('room_joined', {
      roomCode: this.currentRoom.code,
      playerId,
      playerToken,
      assignedRole,
      players: this.currentRoom.players,
      design: this.currentRoom.design,
      meters: this.currentRoom.meters,
      validation: this.currentRoom.validation
    });

    this.broadcastStateUpdate();
  }

  private handleSetRole(payload: ClientIntentMap['set_role']): void {
    if (!this.currentRoom) return;

    const player = this.currentRoom.players.find((p) => p.id === payload.playerId);
    if (!player) {
      this.emit('action_rejected', {
        action: 'set_role',
        reason: 'Player not found in active room.',
        code: 'BAD_REQUEST',
        playerId: payload.playerId
      });
      return;
    }

    // Check if role is taken by another member
    const existingHolder = this.currentRoom.players.find(
      (p) => p.id !== payload.playerId && p.role === payload.role
    );
    if (existingHolder) {
      const roleName = TEAM_ROLE_INFO[payload.role]?.name || payload.role;
      this.emit('action_rejected', {
        action: 'set_role',
        reason: `Role "${roleName}" is already claimed by ${existingHolder.name || existingHolder.id}. Duplicate roles are not permitted under team rules.`,
        code: 'ROLE_TAKEN',
        playerId: payload.playerId
      });
      return;
    }

    player.role = payload.role;
    this.currentRoom.version += 1;
    this.broadcastStateUpdate();
  }

  private handleEditPart(payload: ClientIntentMap['edit_part']): void {
    if (!this.currentRoom) return;

    const player = this.currentRoom.players.find((p) => p.id === payload.playerId);
    if (!player) {
      this.emit('action_rejected', {
        action: 'edit_part',
        reason: 'Player not found in room.',
        code: 'BAD_REQUEST',
        playerId: payload.playerId
      });
      return;
    }

    const currentParts = [...this.currentRoom.design.part_ids];
    if (payload.action === 'add') {
      if (!currentParts.includes(payload.partId)) {
        currentParts.push(payload.partId);
      }
    } else {
      const idx = currentParts.indexOf(payload.partId);
      if (idx !== -1) {
        currentParts.splice(idx, 1);
      }
    }

    this.currentRoom.design.part_ids = currentParts;
    this.currentRoom.meters = computeMeters(this.currentRoom.design);
    this.currentRoom.validation = runChecks(this.currentRoom.design);
    this.currentRoom.version += 1;

    this.broadcastStateUpdate();
  }

  private handleProposeDecision(payload: ClientIntentMap['propose_decision']): void {
    if (!this.currentRoom) return;

    if (this.currentRoom.activeDecision) {
      this.emit('action_rejected', {
        action: 'propose_decision',
        reason: 'A voting decision is already active. Complete or resolve it first.',
        code: 'INVALID_DECISION',
        playerId: payload.playerId
      });
      return;
    }

    const playerCount = this.currentRoom.players.length;
    // 2 players: both must agree (threshold = 2); 3-4 players: strict majority (>50%)
    const threshold = playerCount === 2 ? 2 : Math.floor(playerCount / 2) + 1;

    const initialVotes: Record<string, string> = {};
    const votedPlayerIds: string[] = [];
    if (payload.initialChoice && payload.options.includes(payload.initialChoice)) {
      initialVotes[payload.playerId] = payload.initialChoice;
      votedPlayerIds.push(payload.playerId);
    }

    const missingPlayerIds = this.currentRoom.players
      .map((p) => p.id)
      .filter((id) => !votedPlayerIds.includes(id));

    this.currentRoom.activeDecision = {
      decision: payload.decision,
      proposerId: payload.playerId,
      options: payload.options,
      description: payload.description,
      votes: initialVotes,
      majorityThreshold: threshold,
      votedPlayerIds,
      missingPlayerIds
    };

    this.currentRoom.version += 1;
    this.broadcastStateUpdate();
  }

  private handleVote(payload: ClientIntentMap['vote']): void {
    if (!this.currentRoom || !this.currentRoom.activeDecision) {
      this.emit('action_rejected', {
        action: 'vote',
        reason: 'No voting decision is currently open.',
        code: 'VOTE_CLOSED',
        playerId: payload.playerId
      });
      return;
    }

    const decision = this.currentRoom.activeDecision;
    if (decision.decision !== payload.decision) {
      this.emit('action_rejected', {
        action: 'vote',
        reason: `Vote decision "${payload.decision}" does not match active decision "${decision.decision}".`,
        code: 'INVALID_VOTE',
        playerId: payload.playerId
      });
      return;
    }

    if (!decision.options.includes(payload.choice)) {
      this.emit('action_rejected', {
        action: 'vote',
        reason: `Option "${payload.choice}" is not in valid choices: ${decision.options.join(', ')}.`,
        code: 'INVALID_VOTE',
        playerId: payload.playerId
      });
      return;
    }

    decision.votes[payload.playerId] = payload.choice;
    if (!decision.votedPlayerIds.includes(payload.playerId)) {
      decision.votedPlayerIds.push(payload.playerId);
    }
    decision.missingPlayerIds = this.currentRoom.players
      .map((p) => p.id)
      .filter((id) => !decision.votedPlayerIds.includes(id));

    // Resolve votes using pure shared resolver
    const resolution = resolveVotes({
      decision: decision.decision,
      players: this.currentRoom.players,
      votes: decision.votes
    });

    const allVoted = decision.missingPlayerIds.length === 0;

    if (resolution.passed && resolution.winner) {
      // Majority passed! Apply change to design
      let appliedChange: { field: string; value: unknown } | null = null;
      if (decision.decision === 'orbit') {
        this.currentRoom.design.orbit_id = resolution.winner;
        appliedChange = { field: 'orbit_id', value: resolution.winner };
      } else if (decision.decision === 'objective') {
        this.currentRoom.design.objective_id = resolution.winner;
        appliedChange = { field: 'objective_id', value: resolution.winner };
      } else if (decision.decision === 'launch_vehicle') {
        this.currentRoom.design.vehicle_id = resolution.winner;
        appliedChange = { field: 'vehicle_id', value: resolution.winner };
      }

      this.currentRoom.meters = computeMeters(this.currentRoom.design);
      this.currentRoom.validation = runChecks(this.currentRoom.design);
      this.currentRoom.activeDecision = null;
      this.currentRoom.version += 1;

      this.emit('decision_resolved', {
        roomCode: this.currentRoom.code,
        decision: decision.decision,
        result: resolution,
        appliedChange
      });

      this.broadcastStateUpdate();
      return;
    } else if (allVoted) {
      // All cast but failed to achieve majority/unanimity (e.g. 2-player disagreement or tie)
      this.currentRoom.activeDecision = null;
      this.currentRoom.version += 1;

      this.emit('decision_resolved', {
        roomCode: this.currentRoom.code,
        decision: decision.decision,
        result: resolution,
        appliedChange: null
      });

      this.broadcastStateUpdate();
      return;
    }

    // Still awaiting votes from remaining members
    this.currentRoom.version += 1;
    this.broadcastStateUpdate();
  }

  private handleStartSim(payload: ClientIntentMap['start_sim']): void {
    if (!this.currentRoom) return;

    // Check pre-launch validation
    if (!this.currentRoom.validation.passed) {
      this.emit('action_rejected', {
        action: 'start_sim',
        reason: 'Cannot start simulation: hard pre-launch checks have failed.',
        code: 'PRE_LAUNCH_CHECKS_FAILED',
        playerId: payload.playerId
      });
      return;
    }

    // Check team requirements (at least 2 players in team mode)
    if (this.currentRoom.players.length < 2) {
      this.emit('action_rejected', {
        action: 'start_sim',
        reason: 'Team mission requires at least 2 crew members assembled.',
        code: 'BAD_REQUEST',
        playerId: payload.playerId
      });
      return;
    }

    this.currentRoom.simStatus = 'running';
    this.currentRoom.version += 1;
    this.broadcastStateUpdate();

    setTimeout(() => {
      if (!this.currentRoom) return;

      const simResult = runSimulation(
        this.currentRoom.design,
        payload.seed ?? 42,
        payload.level ?? 1
      );
      const score = scoreMission(simResult, 'team');
      const report = buildReport(simResult, score);

      this.currentRoom.simStatus = 'completed';
      this.currentRoom.version += 1;

      this.emit('sim_result', {
        roomCode: this.currentRoom.code,
        sim: simResult,
        report,
        score
      });

      this.broadcastStateUpdate();
    }, 600);
  }

  // ==========================================================================
  // Developer Simulation Helpers (For UI Verification and Edge Testing)
  // ==========================================================================

  public simulatePeerJoin(
    name = 'Cadet Alex',
    preferredRole: TeamRole = 'spacecraft_engineer'
  ): TeamPlayer | null {
    if (!this.currentRoom || this.currentRoom.players.length >= 4) return null;

    const takenRoles = new Set(this.currentRoom.players.map((p) => p.role));
    const role: TeamRole = !takenRoles.has(preferredRole)
      ? preferredRole
      : (TEAM_ROLES.find((r) => !takenRoles.has(r)) || 'science_lead');

    const peer: TeamPlayer = {
      id: `usr_peer_${Math.random().toString(36).substring(2, 6)}`,
      name,
      role
    };

    this.currentRoom.players.push(peer);
    this.currentRoom.version += 1;
    this.broadcastStateUpdate();
    return peer;
  }

  public simulatePeerLeave(peerId?: string): boolean {
    if (!this.currentRoom || this.currentRoom.players.length <= 1) return false;

    const targetId = peerId || this.currentRoom.players.find((p) => p.id !== this.currentLocalPlayerId)?.id;
    if (!targetId) return false;

    const idx = this.currentRoom.players.findIndex((p) => p.id === targetId);
    if (idx === -1) return false;

    this.currentRoom.players.splice(idx, 1);
    this.currentRoom.version += 1;
    this.broadcastStateUpdate();
    return true;
  }

  public simulatePeerVote(choice?: string): boolean {
    if (!this.currentRoom || !this.currentRoom.activeDecision) return false;

    const peer = this.currentRoom.players.find(
      (p) => p.id !== this.currentLocalPlayerId && !this.currentRoom!.activeDecision!.votes[p.id]
    );
    if (!peer) return false;

    const voteChoice = choice || this.currentRoom.activeDecision.options[0];
    this.handleVote({
      roomCode: this.currentRoom.code,
      playerId: peer.id,
      decision: this.currentRoom.activeDecision.decision,
      choice: voteChoice
    });
    return true;
  }

  public simulateNetworkError(message = 'Simulated network connection timeout.', code = 'MOCK_NETWORK_ERROR'): void {
    this.emit('error', {
      message,
      code
    });
  }

  public simulateDisconnectAndReconnect(durationMs = 800): void {
    this.disconnect();
    setTimeout(() => {
      void this.connect();
    }, durationMs);
  }

  // ==========================================================================
  // Internal Emitters
  // ==========================================================================

  private broadcastStateUpdate(): void {
    if (!this.currentRoom) return;

    const payload: StateUpdatePayload = {
      roomCode: this.currentRoom.code,
      players: [...this.currentRoom.players],
      design: { ...this.currentRoom.design },
      meters: { ...this.currentRoom.meters },
      validation: { ...this.currentRoom.validation },
      activeDecision: this.currentRoom.activeDecision ? { ...this.currentRoom.activeDecision } : null,
      simStatus: this.currentRoom.simStatus,
      version: this.currentRoom.version
    };

    this.emit('state_update', payload);
  }

  private emit<T extends ServerMessage>(event: T, data: ServerMessageMap[T]): void {
    // Validate outbound message with shared protocol schema
    const check = safeParseServerMessage(event, data);
    if (!check.success) {
      console.warn(`[DEVELOPMENT MOCK] Outbound ${event} failed schema parse:`, check.error);
    }

    const listeners = this.messageListeners.get(event);
    if (listeners) {
      listeners.forEach((fn) => {
        try {
          fn(data);
        } catch (err) {
          console.error(`[DEVELOPMENT MOCK] Error in listener for ${event}:`, err);
        }
      });
    }
  }

  private notifyConnectionState(connected: boolean): void {
    this.connectionListeners.forEach((fn) => {
      try {
        fn(connected);
      } catch (err) {
        console.error('[DEVELOPMENT MOCK] Error in connection listener:', err);
      }
    });
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    let res = '';
    for (let i = 0; i < 4; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  }
}
