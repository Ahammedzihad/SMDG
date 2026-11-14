/**
 * Integration test suite for ORBITONE server-authoritative multiplayer server.
 * Tests Socket.IO client connections, room lifecycle, voting, authorization,
 * reconnection, simulation execution, and error handling.
 */

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { io as ioc, type Socket as ClientSocket } from 'socket.io-client';
import { createAppServer, type ServerInstance } from '../src/index.js';
import {
  buildReport,
  runSimulation,
  scoreMission,
  type ActionRejectedPayload,
  type DecisionResolvedPayload,
  type ErrorPayload,
  type RoomCreatedPayload,
  type RoomJoinedPayload,
  type SimResultPayload,
  type StateUpdatePayload
} from '@orbitone/shared';

function createClient(port: number): ClientSocket {
  return ioc(`http://localhost:${port}`, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false
  });
}

function waitForEvent<T = any>(socket: ClientSocket, event: string, timeoutMs = 3000): Promise<T> {
  return new Promise((resolve, reject) => {
    let timer: NodeJS.Timeout | undefined;

    const onEvent = (data: T) => {
      if (timer) clearTimeout(timer);
      cleanup();
      resolve(data);
    };

    const onError = (err: unknown) => {
      if (timer) clearTimeout(timer);
      cleanup();
      reject(err);
    };

    const cleanup = () => {
      socket.off(event, onEvent);
      socket.off('connect_error', onError);
    };

    timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Timeout waiting for event "${event}" after ${timeoutMs}ms`));
    }, timeoutMs);

    socket.once(event, onEvent);
    socket.once('connect_error', onError);
  });
}

describe('ORBITONE Multiplayer Server', () => {
  let server: ServerInstance;
  let port: number;
  const activeSockets: ClientSocket[] = [];

  const trackSocket = (socket: ClientSocket): ClientSocket => {
    activeSockets.push(socket);
    return socket;
  };

  beforeAll(async () => {
    // Port 0 tells OS to assign an available ephemeral port
    server = createAppServer({ port: 0 });
    port = await server.start();
  });

  afterEach(() => {
    while (activeSockets.length > 0) {
      const s = activeSockets.pop();
      if (s) {
        s.removeAllListeners();
        if (s.connected) {
          s.disconnect();
        }
      }
    }
    server.registry.clear();
  });

  afterAll(async () => {
    while (activeSockets.length > 0) {
      const s = activeSockets.pop();
      if (s) {
        s.removeAllListeners();
        if (s.connected) {
          s.disconnect();
        }
      }
    }
    await server.stop();
  });

  // --------------------------------------------------------------------------
  // 1. Health Check
  // --------------------------------------------------------------------------
  it('GET /health returns 200 with { ok: true }', async () => {
    const res = await fetch(`http://localhost:${port}/health`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; timestamp: number };
    expect(body.ok).toBe(true);
    expect(typeof body.timestamp).toBe('number');
  });

  // --------------------------------------------------------------------------
  // 2. Room State Sync Between Multiple Clients
  // --------------------------------------------------------------------------
  it('two clients join same room and both receive state_update with matching design, players, meters', async () => {
    const client1 = trackSocket(createClient(port));
    const client2 = trackSocket(createClient(port));

    // Client 1 creates room
    const createPromise = waitForEvent<RoomCreatedPayload>(client1, 'room_created');
    const state1Promise = waitForEvent<StateUpdatePayload>(client1, 'state_update');

    client1.emit('create_room', {
      playerName: 'Alice',
      preferredRole: 'spacecraft_engineer'
    });

    const created = await createPromise;
    const initialUpdate = await state1Promise;

    expect(created.roomCode).toMatch(/^[A-Z0-9]{4}$/);
    expect(created.assignedRole).toBe('spacecraft_engineer');
    expect(initialUpdate.players.length).toBe(1);
    expect(initialUpdate.players[0].name).toBe('Alice');

    // Client 2 joins the room
    const joinPromise = waitForEvent<RoomJoinedPayload>(client2, 'room_joined');
    const client1SyncPromise = waitForEvent<StateUpdatePayload>(client1, 'state_update');
    const client2SyncPromise = waitForEvent<StateUpdatePayload>(client2, 'state_update');

    client2.emit('join_room', {
      roomCode: created.roomCode,
      playerName: 'Bob',
      preferredRole: 'science_lead'
    });

    const joined = await joinPromise;
    const updateC1 = await client1SyncPromise;
    const updateC2 = await client2SyncPromise;

    expect(joined.roomCode).toBe(created.roomCode);
    expect(joined.assignedRole).toBe('science_lead');

    // Both clients receive identical state updates
    expect(updateC1.players.length).toBe(2);
    expect(updateC2.players.length).toBe(2);
    expect(updateC1.version).toBe(updateC2.version);
    expect(updateC1.design).toEqual(updateC2.design);
    expect(updateC1.meters).toEqual(updateC2.meters);
  });

  // --------------------------------------------------------------------------
  // 3. 5th-Player Rejection
  // --------------------------------------------------------------------------
  it('rejects 5th player with ROOM_FULL error when 4 players are in the room', async () => {
    const host = trackSocket(createClient(port));
    const hostCreatedPromise = waitForEvent<RoomCreatedPayload>(host, 'room_created');
    host.emit('create_room', { playerName: 'P1' });
    const { roomCode } = await hostCreatedPromise;

    // Join 3 more players (reaching 4 total)
    for (let i = 2; i <= 4; i++) {
      const client = trackSocket(createClient(port));
      const joinedPromise = waitForEvent<RoomJoinedPayload>(client, 'room_joined');
      client.emit('join_room', { roomCode, playerName: `P${i}` });
      await joinedPromise;
    }

    const room = server.registry.getRoom(roomCode);
    expect(room?.players.length).toBe(4);

    // 5th player attempts to join
    const client5 = trackSocket(createClient(port));
    const errorPromise = waitForEvent<ErrorPayload>(client5, 'error');
    client5.emit('join_room', { roomCode, playerName: 'P5' });

    const err = await errorPromise;
    expect(err.code).toBe('ROOM_FULL');
    expect(err.message).toMatch(/full/i);

    // Verify room player count is still strictly 4
    expect(server.registry.getRoom(roomCode)?.players.length).toBe(4);
  });

  // --------------------------------------------------------------------------
  // 4. Role Authorization Enforcement on edit_part
  // --------------------------------------------------------------------------
  it('rejects unauthorized role edit and keeps room state untouched', async () => {
    const client = trackSocket(createClient(port));
    const createdPromise = waitForEvent<RoomCreatedPayload>(client, 'room_created');

    // Join as science_lead (only authorized for 'instrument')
    client.emit('create_room', {
      playerName: 'Curie',
      preferredRole: 'science_lead'
    });
    const created = await createdPromise;
    expect(created.assignedRole).toBe('science_lead');

    // Try to add 'struct_3u' which belongs to 'structure' category
    const rejectedPromise = waitForEvent<ActionRejectedPayload>(client, 'action_rejected');
    client.emit('edit_part', {
      roomCode: created.roomCode,
      playerId: created.playerId,
      action: 'add',
      partId: 'struct_3u'
    });

    const rejected = await rejectedPromise;
    expect(rejected.code).toBe('UNAUTHORIZED_ROLE');
    expect(rejected.action).toBe('edit_part');
    expect(rejected.reason).toMatch(/Science Lead/i);

    // Room state parts must remain unchanged
    const room = server.registry.getRoom(created.roomCode);
    expect(room?.design.part_ids).toEqual(['struct_3u']);
  });

  // --------------------------------------------------------------------------
  // 5. 2-Player Unanimous Voting (Tie vs Consensus)
  // --------------------------------------------------------------------------
  it('requires unanimous agreement in a 2-player room: tie rejects, agreement passes', async () => {
    const p1 = trackSocket(createClient(port));
    const p2 = trackSocket(createClient(port));

    const p1Created = await new Promise<RoomCreatedPayload>((resolve) => {
      p1.once('room_created', resolve);
      p1.emit('create_room', { playerName: 'P1' });
    });

    // P2 joins room, wait for P1 to receive state_update from the join
    const p1StateOnJoinPromise = waitForEvent<StateUpdatePayload>(p1, 'state_update');
    const p2Joined = await new Promise<RoomJoinedPayload>((resolve) => {
      p2.once('room_joined', resolve);
      p2.emit('join_room', { roomCode: p1Created.roomCode, playerName: 'P2' });
    });
    await p1StateOnJoinPromise;

    // Step A: P1 proposes orbit decision with initial choice 'sso'
    const stateAfterProposalPromise = waitForEvent<StateUpdatePayload>(p1, 'state_update');
    p1.emit('propose_decision', {
      roomCode: p1Created.roomCode,
      playerId: p1Created.playerId,
      decision: 'orbit',
      options: ['sso', 'leo', 'polar'],
      initialChoice: 'sso'
    });
    const stateAfterProposal = await stateAfterProposalPromise;
    expect(stateAfterProposal.activeDecision).toBeDefined();
    expect(stateAfterProposal.activeDecision?.decision).toBe('orbit');

    // Step B: P2 votes differently ('leo') -> Split vote in 2-player team is a tie
    const tiePromiseP1 = waitForEvent<DecisionResolvedPayload>(p1, 'decision_resolved');
    const tiePromiseP2 = waitForEvent<DecisionResolvedPayload>(p2, 'decision_resolved');

    p2.emit('vote', {
      roomCode: p1Created.roomCode,
      playerId: p2Joined.playerId,
      decision: 'orbit',
      choice: 'leo'
    });

    const tieP1 = await tiePromiseP1;
    const tieP2 = await tiePromiseP2;
    expect(tieP1.result.status).toBe('tie');
    expect(tieP2.result.winner).toBeNull();

    // Verify orbit was NOT changed
    const roomAfterTie = server.registry.getRoom(p1Created.roomCode);
    expect(roomAfterTie?.design.orbit_id).toBe('sso'); // default initial design orbit
    expect(roomAfterTie?.activeDecision).toBeNull();

    // Step C: Propose again and reach unanimous agreement ('polar')
    p1.emit('propose_decision', {
      roomCode: p1Created.roomCode,
      playerId: p1Created.playerId,
      decision: 'orbit',
      options: ['sso', 'leo', 'polar'],
      initialChoice: 'polar'
    });
    await waitForEvent<StateUpdatePayload>(p1, 'state_update');

    const passPromise = waitForEvent<DecisionResolvedPayload>(p1, 'decision_resolved');
    p2.emit('vote', {
      roomCode: p1Created.roomCode,
      playerId: p2Joined.playerId,
      decision: 'orbit',
      choice: 'polar'
    });

    const passResult = await passPromise;
    expect(passResult.result.status).toBe('passed');
    expect(passResult.result.winner).toBe('polar');
    expect(passResult.appliedChange?.field).toBe('orbit_id');
    expect(passResult.appliedChange?.value).toBe('polar');

    // Verify room state is authoritatively updated
    const roomAfterPass = server.registry.getRoom(p1Created.roomCode);
    expect(roomAfterPass?.design.orbit_id).toBe('polar');
  });

  // --------------------------------------------------------------------------
  // 6. Player Disconnect and Reconnection
  // --------------------------------------------------------------------------
  it('restores player session and role when reconnecting with token', async () => {
    const client = trackSocket(createClient(port));
    const createdPromise = waitForEvent<RoomCreatedPayload>(client, 'room_created');

    client.emit('create_room', {
      playerName: 'Dave',
      preferredRole: 'comms_budget_officer'
    });
    const created = await createdPromise;

    // Disconnect client socket
    client.disconnect();

    // Allow event loop to process socket disconnect on server
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Check room records player as disconnected
    const roomBefore = server.registry.getRoom(created.roomCode);
    const playerBefore = roomBefore?.players.find((p) => p.id === created.playerId);
    expect(playerBefore?.connected).toBe(false);

    // Reconnect with a new socket using credentials
    const newClient = trackSocket(createClient(port));
    const rejoinPromise = waitForEvent<RoomJoinedPayload>(newClient, 'room_joined');

    newClient.emit('join_room', {
      roomCode: created.roomCode,
      playerName: 'Dave',
      playerId: created.playerId,
      playerToken: created.playerToken
    });

    const rejoined = await rejoinPromise;
    expect(rejoined.playerId).toBe(created.playerId);
    expect(rejoined.assignedRole).toBe('comms_budget_officer');

    // Check room records player as reconnected
    const roomAfter = server.registry.getRoom(created.roomCode);
    const playerAfter = roomAfter?.players.find((p) => p.id === created.playerId);
    expect(playerAfter?.connected).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 7. Invalid Payload Handling
  // --------------------------------------------------------------------------
  it('emits error with INVALID_PAYLOAD and does not crash when receiving malformed payloads', async () => {
    const client = trackSocket(createClient(port));

    const errorPromise = waitForEvent<ErrorPayload>(client, 'error');
    // Send invalid payload missing required fields
    client.emit('create_room', { invalidField: 123 });

    const err = await errorPromise;
    expect(err.code).toBe('INVALID_PAYLOAD');
    expect(err.message).toMatch(/Invalid create_room payload/i);

    // Client connection remains healthy and alive
    expect(client.connected).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 8. Pre-Launch Checks and Deterministic Simulation Result
  // --------------------------------------------------------------------------
  it('rejects start_sim if checks fail, and returns deterministic sim_result when valid', async () => {
    const engClient = trackSocket(createClient(port));
    const sciClient = trackSocket(createClient(port));
    const commsClient = trackSocket(createClient(port));

    const p1Created = await new Promise<RoomCreatedPayload>((resolve) => {
      engClient.once('room_created', resolve);
      engClient.emit('create_room', {
        playerName: 'Engineer',
        preferredRole: 'spacecraft_engineer'
      });
    });

    const p1StateSciJoin = waitForEvent<StateUpdatePayload>(engClient, 'state_update');
    const p2Joined = await new Promise<RoomJoinedPayload>((resolve) => {
      sciClient.once('room_joined', resolve);
      sciClient.emit('join_room', {
        roomCode: p1Created.roomCode,
        playerName: 'Scientist',
        preferredRole: 'science_lead'
      });
    });
    await p1StateSciJoin;

    const p1StateCommsJoin = waitForEvent<StateUpdatePayload>(engClient, 'state_update');
    const p3Joined = await new Promise<RoomJoinedPayload>((resolve) => {
      commsClient.once('room_joined', resolve);
      commsClient.emit('join_room', {
        roomCode: p1Created.roomCode,
        playerName: 'CommsOfficer',
        preferredRole: 'comms_budget_officer'
      });
    });
    await p1StateCommsJoin;

    // 1. Engineer adds obc_rad_hard (consumes power) without solar panels, causing power check to fail
    const addObcPromise = waitForEvent<StateUpdatePayload>(engClient, 'state_update');
    engClient.emit('edit_part', {
      roomCode: p1Created.roomCode,
      playerId: p1Created.playerId,
      action: 'add',
      partId: 'obc_rad_hard'
    });
    const stateWithObcOnly = await addObcPromise;
    expect(stateWithObcOnly.validation.passed).toBe(false);

    // Attempting start_sim with failing checks is rejected
    const rejectPromise = waitForEvent<ActionRejectedPayload>(engClient, 'action_rejected');
    engClient.emit('start_sim', {
      roomCode: p1Created.roomCode,
      playerId: p1Created.playerId,
      seed: 42,
      level: 1
    });

    const rejection = await rejectPromise;
    expect(rejection.code).toBe('PRE_LAUNCH_CHECKS_FAILED');
    expect(rejection.action).toBe('start_sim');

    // 2. Engineer, Comms Officer, and Scientist add their authorized parts to make satellite valid
    const engineerParts = [
      'solar_deployable_3u',
      'batt_space_30wh',
      'adcs_3axis_wheels'
    ];

    for (const partId of engineerParts) {
      const updatePromise = waitForEvent<StateUpdatePayload>(engClient, 'state_update');
      engClient.emit('edit_part', {
        roomCode: p1Created.roomCode,
        playerId: p1Created.playerId,
        action: 'add',
        partId
      });
      await updatePromise;
    }

    // Comms Officer adds comms part
    const commsUpdatePromise = waitForEvent<StateUpdatePayload>(commsClient, 'state_update');
    commsClient.emit('edit_part', {
      roomCode: p1Created.roomCode,
      playerId: p3Joined.playerId,
      action: 'add',
      partId: 'comms_sband_patch'
    });
    await commsUpdatePromise;

    // Scientist adds instrument
    const sciUpdatePromise = waitForEvent<StateUpdatePayload>(sciClient, 'state_update');
    sciClient.emit('edit_part', {
      roomCode: p1Created.roomCode,
      playerId: p2Joined.playerId,
      action: 'add',
      partId: 'inst_multispectral_imager'
    });
    const finalState = await sciUpdatePromise;

    // Pre-launch checks must now pass
    expect(finalState.validation.passed).toBe(true);

    // 3. Launch simulation with seed 42, level 1
    const simPromiseEng = waitForEvent<SimResultPayload>(engClient, 'sim_result');
    const simPromiseSci = waitForEvent<SimResultPayload>(sciClient, 'sim_result');
    const simPromiseComms = waitForEvent<SimResultPayload>(commsClient, 'sim_result');

    engClient.emit('start_sim', {
      roomCode: p1Created.roomCode,
      playerId: p1Created.playerId,
      seed: 42,
      level: 1
    });

    const simResEng = await simPromiseEng;
    const simResSci = await simPromiseSci;
    const simResComms = await simPromiseComms;

    // All clients receive identical sim results
    expect(simResEng).toEqual(simResSci);
    expect(simResEng).toEqual(simResComms);
    expect(simResEng.roomCode).toBe(p1Created.roomCode);
    expect(simResEng.sim.outcome).toBeDefined();

    // Deterministic match against pure shared functions
    const room = server.registry.getRoom(p1Created.roomCode)!;
    const expectedSim = runSimulation(room.design, 42, 1);
    const expectedScore = scoreMission(expectedSim, 'team');
    const expectedReport = buildReport(expectedSim, expectedScore);

    expect(simResEng.sim).toEqual(expectedSim);
    expect(simResEng.score).toEqual(expectedScore);
    expect(simResEng.report).toEqual(expectedReport);
  });

  // --------------------------------------------------------------------------
  // 9. Role Conflicts and Rejection
  // --------------------------------------------------------------------------
  it('rejects set_role when another player already claims that role', async () => {
    const c1 = trackSocket(createClient(port));
    const c2 = trackSocket(createClient(port));

    const p1Created = await new Promise<RoomCreatedPayload>((resolve) => {
      c1.once('room_created', resolve);
      c1.emit('create_room', {
        playerName: 'Alice',
        preferredRole: 'spacecraft_engineer'
      });
    });

    const p1StateSync = waitForEvent<StateUpdatePayload>(c1, 'state_update');
    const p2Joined = await new Promise<RoomJoinedPayload>((resolve) => {
      c2.once('room_joined', resolve);
      c2.emit('join_room', {
        roomCode: p1Created.roomCode,
        playerName: 'Bob',
        preferredRole: 'science_lead'
      });
    });
    await p1StateSync;

    // Bob tries to switch to spacecraft_engineer which Alice already has
    const rejectedPromise = waitForEvent<ActionRejectedPayload>(c2, 'action_rejected');
    c2.emit('set_role', {
      roomCode: p1Created.roomCode,
      playerId: p2Joined.playerId,
      role: 'spacecraft_engineer'
    });

    const rejected = await rejectedPromise;
    expect(rejected.code).toBe('ROLE_TAKEN');
    expect(rejected.action).toBe('set_role');
  });

  // --------------------------------------------------------------------------
  // 10. Vote Closed Rejection
  // --------------------------------------------------------------------------
  it('rejects vote when no voting session is open', async () => {
    const client = trackSocket(createClient(port));
    const createdPromise = waitForEvent<RoomCreatedPayload>(client, 'room_created');
    client.emit('create_room', { playerName: 'Alice' });
    const created = await createdPromise;

    const rejectedPromise = waitForEvent<ActionRejectedPayload>(client, 'action_rejected');
    client.emit('vote', {
      roomCode: created.roomCode,
      playerId: created.playerId,
      decision: 'orbit',
      choice: 'sso'
    });

    const rejected = await rejectedPromise;
    expect(rejected.code).toBe('VOTE_CLOSED');
    expect(rejected.action).toBe('vote');
  });

  // --------------------------------------------------------------------------
  // 11. Room Not Found Error
  // --------------------------------------------------------------------------
  it('returns ROOM_NOT_FOUND error when attempting to join a non-existent room', async () => {
    const client = trackSocket(createClient(port));
    const errorPromise = waitForEvent<ErrorPayload>(client, 'error');

    client.emit('join_room', {
      roomCode: 'ZZZZ',
      playerName: 'Ghost'
    });

    const err = await errorPromise;
    expect(err.code).toBe('ROOM_NOT_FOUND');
  });

  // --------------------------------------------------------------------------
  // 12. 4-Letter Code Generation Excludes Ambiguous Characters
  // --------------------------------------------------------------------------
  it('generates 4-letter room codes without ambiguous characters (I, O, L)', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const { room } = server.registry.createRoom(`Player${i}`);
      codes.add(room.code);
      expect(room.code).toMatch(/^[A-HJ-KM-NP-Z2-9]{4}$/);
      expect(room.code).not.toMatch(/[IOL10]/);
    }
    expect(codes.size).toBe(50);
  });
});
