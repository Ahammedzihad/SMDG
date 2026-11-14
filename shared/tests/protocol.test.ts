import { describe, expect, it } from 'vitest';
import {
  CLIENT_INTENTS,
  SERVER_MESSAGES,
  actionRejectedPayloadSchema,
  actionRejectionCodeSchema,
  activeDecisionStateSchema,
  clientIntentSchemas,
  computeMeters,
  createRoomPayloadSchema,
  decisionResolvedPayloadSchema,
  editPartPayloadSchema,
  errorPayloadSchema,
  isClientIntent,
  isServerMessage,
  joinRoomPayloadSchema,
  parseClientIntent,
  parseServerMessage,
  proposeDecisionPayloadSchema,
  roomCreatedPayloadSchema,
  roomJoinedPayloadSchema,
  safeParseClientIntent,
  safeParseServerMessage,
  serverMessageSchemas,
  setRolePayloadSchema,
  simResultPayloadSchema,
  startSimPayloadSchema,
  stateUpdatePayloadSchema,
  votePayloadSchema
} from '../src/index.js';
import type {
  ActionRejectedPayload,
  CreateRoomPayload,
  DecisionResolvedPayload,
  EditPartPayload,
  ErrorPayload,
  JoinRoomPayload,
  MissionDesign,
  ProposeDecisionPayload,
  RoomCreatedPayload,
  RoomJoinedPayload,
  SetRolePayload,
  SimResultPayload,
  StartSimPayload,
  StateUpdatePayload,
  VotePayload
} from '../src/index.js';

describe('ORBITONE Protocol Event Contract & Runtime Schemas', () => {
  const sampleDesign: MissionDesign = {
    cubesat_class_id: '3U',
    orbit_id: 'sso',
    vehicle_id: 'rideshare_dispenser',
    part_ids: [
      'struct_3u',
      'solar_deployable_3u',
      'batt_space_30wh',
      'comms_sband_patch',
      'obc_rad_hard',
      'adcs_3axis_wheels',
      'inst_multispectral_imager'
    ],
    lifetime_months: 12,
    budget_m: 2.5,
    fuel_mass_kg: 0.1,
    duty_cycle: 0.5,
    observe_time_fraction: 0.5,
    link_efficiency: 0.95
  };

  const sampleMeters = computeMeters(sampleDesign);

  const sampleValidation = {
    checks: [
      { id: 'massFitsVehicle', passed: true, reason: 'Mass fits', suggestedFix: 'None' }
    ],
    passed: true,
    warnings: []
  };

  it('defines the 7 required client intents', () => {
    expect(CLIENT_INTENTS).toEqual([
      'create_room',
      'join_room',
      'set_role',
      'edit_part',
      'propose_decision',
      'vote',
      'start_sim'
    ]);
  });

  it('defines the 7 required server messages with "error" per Person A brief A4', () => {
    expect(SERVER_MESSAGES).toEqual([
      'room_created',
      'room_joined',
      'state_update',
      'action_rejected',
      'decision_resolved',
      'sim_result',
      'error'
    ]);
  });

  it('validates client intent type guard isClientIntent', () => {
    for (const intent of CLIENT_INTENTS) {
      expect(isClientIntent(intent)).toBe(true);
    }
    expect(isClientIntent('state_update')).toBe(false);
    expect(isClientIntent('error')).toBe(false);
    expect(isClientIntent('invalid_intent')).toBe(false);
    expect(isClientIntent(null)).toBe(false);
    expect(isClientIntent(undefined)).toBe(false);
    expect(isClientIntent(123)).toBe(false);
  });

  it('validates server message type guard isServerMessage', () => {
    for (const message of SERVER_MESSAGES) {
      expect(isServerMessage(message)).toBe(true);
    }
    expect(isServerMessage('edit_part')).toBe(false);
    expect(isServerMessage('server_error')).toBe(false); // replaced with 'error' per A4
    expect(isServerMessage('random_event')).toBe(false);
    expect(isServerMessage(null)).toBe(false);
  });

  // ==========================================================================
  // Client Intent Schemas (Valid & Invalid Cases)
  // ==========================================================================
  describe('Client Intent Zod Schemas', () => {
    // 1. create_room
    describe('create_room (createRoomPayloadSchema)', () => {
      it('accepts valid create_room payload', () => {
        const payload: CreateRoomPayload = {
          playerName: 'Commander Shepard',
          preferredRole: 'mission_planner',
          difficultyLevel: 1
        };
        const parsed = createRoomPayloadSchema.parse(payload);
        expect(parsed.playerName).toBe('Commander Shepard');
        expect(parsed.preferredRole).toBe('mission_planner');
        expect(parsed.difficultyLevel).toBe(1);
      });

      it('rejects invalid create_room payload', () => {
        // Empty playerName
        expect(createRoomPayloadSchema.safeParse({ playerName: '   ' }).success).toBe(false);
        // Invalid preferredRole
        expect(createRoomPayloadSchema.safeParse({ playerName: 'Alice', preferredRole: 'captain' }).success).toBe(false);
        // Invalid difficulty level
        expect(createRoomPayloadSchema.safeParse({ playerName: 'Alice', difficultyLevel: 5 }).success).toBe(false);
      });
    });

    // 2. join_room
    describe('join_room (joinRoomPayloadSchema)', () => {
      it('accepts valid join_room payload', () => {
        const payload: JoinRoomPayload = {
          roomCode: 'ORBT',
          playerName: 'Liara',
          playerToken: 'tok_abc123',
          preferredRole: 'science_lead'
        };
        const parsed = joinRoomPayloadSchema.parse(payload);
        expect(parsed.roomCode).toBe('ORBT');
        expect(parsed.playerName).toBe('Liara');
      });

      it('rejects invalid join_room payload', () => {
        // Empty roomCode
        expect(joinRoomPayloadSchema.safeParse({ roomCode: '', playerName: 'Bob' }).success).toBe(false);
        // Missing playerName
        expect(joinRoomPayloadSchema.safeParse({ roomCode: 'ORBT' }).success).toBe(false);
        // Invalid role
        expect(joinRoomPayloadSchema.safeParse({ roomCode: 'ORBT', playerName: 'Bob', preferredRole: 'invalid' }).success).toBe(false);
      });
    });

    // 3. set_role
    describe('set_role (setRolePayloadSchema)', () => {
      it('accepts valid set_role payload', () => {
        const payload: SetRolePayload = {
          roomCode: 'ORBT',
          playerId: 'p2',
          role: 'spacecraft_engineer'
        };
        const parsed = setRolePayloadSchema.parse(payload);
        expect(parsed.role).toBe('spacecraft_engineer');
      });

      it('rejects invalid set_role payload', () => {
        // Missing playerId
        expect(setRolePayloadSchema.safeParse({ roomCode: 'ORBT', role: 'science_lead' }).success).toBe(false);
        // Unrecognized role
        expect(setRolePayloadSchema.safeParse({ roomCode: 'ORBT', playerId: 'p1', role: 'pilot' }).success).toBe(false);
      });
    });

    // 4. edit_part
    describe('edit_part (editPartPayloadSchema)', () => {
      it('accepts valid edit_part payload', () => {
        const payload: EditPartPayload = {
          roomCode: 'ORBT',
          playerId: 'p2',
          action: 'add',
          partId: 'solar_deployable_3u'
        };
        const parsed = editPartPayloadSchema.parse(payload);
        expect(parsed.action).toBe('add');
        expect(parsed.partId).toBe('solar_deployable_3u');
      });

      it('rejects invalid edit_part payload', () => {
        // Invalid action (only 'add' | 'remove')
        expect(editPartPayloadSchema.safeParse({ roomCode: 'ORBT', playerId: 'p1', action: 'delete', partId: 'p1' }).success).toBe(false);
        // Empty partId
        expect(editPartPayloadSchema.safeParse({ roomCode: 'ORBT', playerId: 'p1', action: 'add', partId: '' }).success).toBe(false);
      });
    });

    // 5. propose_decision
    describe('propose_decision (proposeDecisionPayloadSchema)', () => {
      it('accepts valid propose_decision payload', () => {
        const payload: ProposeDecisionPayload = {
          roomCode: 'ORBT',
          playerId: 'p1',
          decision: 'orbit',
          options: ['sso', 'leo', 'geo'],
          initialChoice: 'sso',
          description: 'Vote on insertion orbit'
        };
        const parsed = proposeDecisionPayloadSchema.parse(payload);
        expect(parsed.decision).toBe('orbit');
        expect(parsed.options).toHaveLength(3);
      });

      it('rejects invalid propose_decision payload', () => {
        // Empty options array
        expect(proposeDecisionPayloadSchema.safeParse({ roomCode: 'ORBT', playerId: 'p1', decision: 'orbit', options: [] }).success).toBe(false);
        // Empty decision
        expect(proposeDecisionPayloadSchema.safeParse({ roomCode: 'ORBT', playerId: 'p1', decision: '', options: ['sso'] }).success).toBe(false);
      });
    });

    // 6. vote
    describe('vote (votePayloadSchema)', () => {
      it('accepts valid vote payload', () => {
        const payload: VotePayload = {
          roomCode: 'ORBT',
          playerId: 'p2',
          decision: 'orbit',
          choice: 'sso'
        };
        const parsed = votePayloadSchema.parse(payload);
        expect(parsed.choice).toBe('sso');
      });

      it('rejects invalid vote payload', () => {
        // Empty choice
        expect(votePayloadSchema.safeParse({ roomCode: 'ORBT', playerId: 'p1', decision: 'orbit', choice: '' }).success).toBe(false);
        // Missing decision
        expect(votePayloadSchema.safeParse({ roomCode: 'ORBT', playerId: 'p1', choice: 'yes' }).success).toBe(false);
      });
    });

    // 7. start_sim
    describe('start_sim (startSimPayloadSchema)', () => {
      it('accepts valid start_sim payload', () => {
        const payload: StartSimPayload = {
          roomCode: 'ORBT',
          playerId: 'p1',
          seed: 42,
          level: 2
        };
        const parsed = startSimPayloadSchema.parse(payload);
        expect(parsed.seed).toBe(42);
        expect(parsed.level).toBe(2);
      });

      it('rejects invalid start_sim payload', () => {
        // Level out of bounds
        expect(startSimPayloadSchema.safeParse({ roomCode: 'ORBT', playerId: 'p1', level: 0 }).success).toBe(false);
        expect(startSimPayloadSchema.safeParse({ roomCode: 'ORBT', playerId: 'p1', level: 4 }).success).toBe(false);
        // Non-integer seed
        expect(startSimPayloadSchema.safeParse({ roomCode: 'ORBT', playerId: 'p1', seed: 3.14 }).success).toBe(false);
      });
    });
  });

  // ==========================================================================
  // Server Message Schemas (Valid & Invalid Cases)
  // ==========================================================================
  describe('Server Message Zod Schemas', () => {
    // 8. room_created
    describe('room_created (roomCreatedPayloadSchema)', () => {
      it('accepts valid room_created payload', () => {
        const payload: RoomCreatedPayload = {
          roomCode: 'ORBT',
          playerId: 'p1',
          playerToken: 'tok_random123',
          assignedRole: 'mission_planner',
          players: [{ id: 'p1', role: 'mission_planner', name: 'Alice' }],
          design: sampleDesign,
          meters: sampleMeters,
          validation: sampleValidation
        };
        const parsed = roomCreatedPayloadSchema.parse(payload);
        expect(parsed.roomCode).toBe('ORBT');
        expect(parsed.meters.mass.state).toBe('ok');
      });

      it('rejects invalid room_created payload', () => {
        expect(roomCreatedPayloadSchema.safeParse({ roomCode: 'ORBT' }).success).toBe(false);
      });
    });

    // 9. room_joined
    describe('room_joined (roomJoinedPayloadSchema)', () => {
      it('accepts valid room_joined payload', () => {
        const payload: RoomJoinedPayload = {
          roomCode: 'ORBT',
          playerId: 'p2',
          playerToken: 'tok_random456',
          assignedRole: 'spacecraft_engineer',
          players: [
            { id: 'p1', role: 'mission_planner', name: 'Alice' },
            { id: 'p2', role: 'spacecraft_engineer', name: 'Bob' }
          ],
          design: sampleDesign,
          meters: sampleMeters,
          validation: sampleValidation
        };
        const parsed = roomJoinedPayloadSchema.parse(payload);
        expect(parsed.players).toHaveLength(2);
      });

      it('rejects invalid room_joined payload missing design', () => {
        expect(
          roomJoinedPayloadSchema.safeParse({
            roomCode: 'ORBT',
            playerId: 'p2',
            playerToken: 'tok',
            players: [],
            meters: sampleMeters,
            validation: sampleValidation
          }).success
        ).toBe(false);
      });
    });

    // 10. state_update
    describe('state_update (stateUpdatePayloadSchema)', () => {
      it('accepts valid state_update payload', () => {
        const payload: StateUpdatePayload = {
          roomCode: 'ORBT',
          players: [{ id: 'p1', role: 'mission_planner' }],
          design: sampleDesign,
          meters: sampleMeters,
          validation: sampleValidation,
          activeDecision: {
            decision: 'orbit',
            proposerId: 'p1',
            options: ['sso', 'leo'],
            votes: { p1: 'sso' },
            majorityThreshold: 2,
            votedPlayerIds: ['p1'],
            missingPlayerIds: ['p2']
          },
          simStatus: 'idle',
          version: 3
        };
        const parsed = stateUpdatePayloadSchema.parse(payload);
        expect(parsed.simStatus).toBe('idle');
        expect(parsed.version).toBe(3);
      });

      it('rejects invalid state_update payload', () => {
        // Invalid simStatus
        expect(
          stateUpdatePayloadSchema.safeParse({
            roomCode: 'ORBT',
            players: [],
            design: sampleDesign,
            meters: sampleMeters,
            validation: sampleValidation,
            simStatus: 'flying',
            version: 1
          }).success
        ).toBe(false);

        // Negative version number
        expect(
          stateUpdatePayloadSchema.safeParse({
            roomCode: 'ORBT',
            players: [],
            design: sampleDesign,
            meters: sampleMeters,
            validation: sampleValidation,
            simStatus: 'idle',
            version: -1
          }).success
        ).toBe(false);
      });
    });

    // 11. action_rejected
    describe('action_rejected (actionRejectedPayloadSchema)', () => {
      it('accepts valid action_rejected payload with standard code', () => {
        const payload: ActionRejectedPayload = {
          action: 'edit_part',
          reason: 'Role "Science Lead" is not authorized to edit "structure" parts (owned by Spacecraft Engineer).',
          code: 'UNAUTHORIZED_ROLE',
          playerId: 'p3'
        };
        const parsed = actionRejectedPayloadSchema.parse(payload);
        expect(parsed.code).toBe('UNAUTHORIZED_ROLE');
      });

      it('rejects invalid action_rejected payload', () => {
        expect(actionRejectedPayloadSchema.safeParse({ action: '' }).success).toBe(false);
      });
    });

    // 12. decision_resolved
    describe('decision_resolved (decisionResolvedPayloadSchema)', () => {
      it('accepts valid decision_resolved payload', () => {
        const payload: DecisionResolvedPayload = {
          roomCode: 'ORBT',
          decision: 'orbit',
          result: {
            status: 'passed',
            passed: true,
            decision: 'orbit',
            winner: 'sso',
            tallies: [{ choice: 'sso', votes: 2, voterIds: ['p1', 'p2'] }],
            totalEligibleVoters: 2,
            votesCast: 2,
            validVotesCount: 2,
            majorityThreshold: 2,
            missingPlayerIds: [],
            invalidVotes: [],
            playerErrors: [],
            reason: 'Shared decision "orbit" passed: all 2 players agreed on "sso".'
          },
          appliedChange: { field: 'orbit_id', value: 'sso' }
        };
        const parsed = decisionResolvedPayloadSchema.parse(payload);
        expect(parsed.result.winner).toBe('sso');
        expect(parsed.appliedChange?.field).toBe('orbit_id');
      });

      it('rejects invalid decision_resolved payload', () => {
        expect(
          decisionResolvedPayloadSchema.safeParse({
            roomCode: 'ORBT',
            decision: 'orbit',
            result: { status: 'bad_status' }
          }).success
        ).toBe(false);
      });
    });

    // 13. sim_result
    describe('sim_result (simResultPayloadSchema)', () => {
      it('accepts valid sim_result payload', () => {
        const payload: SimResultPayload = {
          roomCode: 'ORBT',
          sim: {
            outcome: 'baseline_met',
            timeline: [{ month: 1, event: 'Launch', description: 'Successful launch' }],
            series: {
              months: [1, 2],
              power_w: [10.5, 10.5],
              data_stored_gb: [0.5, 0.8],
              budget_remaining_m: [2.0, 1.98],
              health: [100, 100]
            },
            events_applied: [],
            cause_tags: ['power_positive'],
            science_collected: 100,
            data_generated_total_gb: 30,
            data_transmitted_total_gb: 30,
            data_lost_total_gb: 0,
            final_health: 100,
            lifetime_months: 12,
            design: sampleDesign
          },
          report: {
            result: 'baseline_met',
            timeline: [{ month: 1, event: 'Launch', description: 'Successful launch' }],
            series: {
              months: [1, 2],
              power_w: [10.5, 10.5],
              data_stored_gb: [0.5, 0.8],
              budget_remaining_m: [2.0, 1.98],
              health: [100, 100]
            },
            why: ['Power generation was healthy.', 'Downlink cleared storage.', 'Structure stayed within limits.'],
            what_to_try_next: ['Try adding another sensor', 'Try higher orbit'],
            top_risks: [{ risk: 'Solar degradation', likelihood: 2, consequence: 3, mitigation: 'Use margin' }],
            similar_real_mission: null,
            score: {
              mission_success: 30,
              science_value: 20,
              resource_efficiency: 18,
              engineering_quality: 14,
              team_coordination: 15,
              total: 97,
              rank: 'Flight Director',
              mode: 'team'
            },
            rank: 'Flight Director'
          },
          score: {
            mission_success: 30,
            science_value: 20,
            resource_efficiency: 18,
            engineering_quality: 14,
            team_coordination: 15,
            total: 97,
            rank: 'Flight Director',
            mode: 'team'
          }
        };
        const parsed = simResultPayloadSchema.parse(payload);
        expect(parsed.sim.outcome).toBe('baseline_met');
        expect(parsed.score.total).toBe(97);
      });

      it('rejects invalid sim_result payload', () => {
        expect(simResultPayloadSchema.safeParse({ roomCode: 'ORBT' }).success).toBe(false);
      });
    });

    // 14. error (A4 error event)
    describe('error (errorPayloadSchema)', () => {
      it('accepts valid error payload', () => {
        const payload: ErrorPayload = {
          message: 'Room not found with code "ZZZZ".',
          code: 'ROOM_NOT_FOUND',
          details: { attemptedCode: 'ZZZZ' }
        };
        const parsed = errorPayloadSchema.parse(payload);
        expect(parsed.message).toContain('Room not found');
        expect(parsed.code).toBe('ROOM_NOT_FOUND');
      });

      it('rejects invalid error payload', () => {
        expect(errorPayloadSchema.safeParse({ message: '   ' }).success).toBe(false);
        expect(errorPayloadSchema.safeParse({}).success).toBe(false);
      });
    });
  });

  // ==========================================================================
  // Parsing Helpers and Registry Maps
  // ==========================================================================
  describe('Parsing and Validation Helpers', () => {
    it('parseClientIntent validates correctly and throws on bad input', () => {
      const valid = parseClientIntent('edit_part', {
        roomCode: 'ABCD',
        playerId: 'p1',
        action: 'add',
        partId: 'part_123'
      });
      expect(valid.action).toBe('add');

      expect(() => {
        parseClientIntent('edit_part', { roomCode: 'ABCD', action: 'explode' });
      }).toThrow();
    });

    it('safeParseClientIntent returns safe result objects', () => {
      const ok = safeParseClientIntent('vote', {
        roomCode: 'ABCD',
        playerId: 'p1',
        decision: 'orbit',
        choice: 'sso'
      });
      expect(ok.success).toBe(true);

      const fail = safeParseClientIntent('vote', {
        roomCode: 'ABCD',
        choice: 'sso' // missing playerId and decision
      });
      expect(fail.success).toBe(false);
    });

    it('parseServerMessage validates server messages correctly', () => {
      const valid = parseServerMessage('error', {
        message: 'Simulation failed: division by zero.'
      });
      expect(valid.message).toContain('Simulation failed');

      expect(() => {
        parseServerMessage('error', { message: '' });
      }).toThrow();
    });

    it('safeParseServerMessage returns safe result objects', () => {
      const ok = safeParseServerMessage('action_rejected', {
        action: 'set_role',
        reason: 'Role already taken.'
      });
      expect(ok.success).toBe(true);

      const fail = safeParseServerMessage('action_rejected', {
        action: '' // empty action
      });
      expect(fail.success).toBe(false);
    });
  });
});
