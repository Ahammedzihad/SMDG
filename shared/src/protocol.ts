/**
 * Client/server protocol event contract for ORBITONE multiplayer sessions.
 *
 * Transports client intents and server state broadcasts following GAME_RULES section 13
 * and Developer Brief section 11 (A4):
 * - Server is the authority: holds mission state, validates every change, broadcasts results.
 * - Clients send intents only (create/join room, set role, edit part, propose decision, vote, start sim).
 * - All payloads are runtime-validated using Zod schemas.
 * - Fully transport-neutral: compatible with Socket.IO, WebSockets, or local mocks.
 */

import { z } from 'zod';
import type {
  CheckResult,
  EventApplied,
  InvalidVoteRecord,
  MeterId,
  MeterItem,
  Meters,
  MeterState,
  MissionDesign,
  MissionOutcome,
  MissionRank,
  MissionValidationResult,
  MonthlySeries,
  PlayerDataError,
  RealMission,
  Report,
  RiskMatrixItem,
  ScoreBreakdown,
  SharedDecisionType,
  SimResult,
  TeamPlayer,
  TeamRole,
  TimelineEntry,
  VoteResolutionResult,
  VoteResolutionStatus,
  VoteTally
} from './types.js';

// --------------------------------------------------------------------------
// 1. Event Names Constants & Types
// --------------------------------------------------------------------------

export const CLIENT_INTENTS = [
  'create_room',
  'join_room',
  'set_role',
  'edit_part',
  'propose_decision',
  'vote',
  'start_sim'
] as const;

export type ClientIntent = (typeof CLIENT_INTENTS)[number];

export const SERVER_MESSAGES = [
  'room_created',
  'room_joined',
  'state_update',
  'action_rejected',
  'decision_resolved',
  'sim_result',
  'error'
] as const;

export type ServerMessage = (typeof SERVER_MESSAGES)[number];

// --------------------------------------------------------------------------
// 2. Shared Domain & Support Zod Schemas
// --------------------------------------------------------------------------

export const teamRoleSchema = z.enum([
  'mission_planner',
  'spacecraft_engineer',
  'science_lead',
  'comms_budget_officer'
]);

export const teamPlayerSchema = z.object({
  id: z.string().trim().min(1, 'Player ID is required'),
  role: teamRoleSchema,
  name: z.string().trim().min(1).max(50).optional()
});

export const sharedDecisionTypeSchema = z.string().trim().min(1, 'Decision type is required');

export const missionDesignSchema = z.object({
  cubesat_class_id: z.string().trim().min(1, 'CubeSat class ID is required'),
  orbit_id: z.string().trim().min(1, 'Orbit ID is required'),
  vehicle_id: z.string().trim().min(1, 'Vehicle ID is required'),
  part_ids: z.array(z.string().trim().min(1)),
  objective_id: z.string().trim().min(1).optional(),
  fuel_mass_kg: z.number().nonnegative().optional(),
  budget_m: z.number().nonnegative().optional(),
  lifetime_months: z.number().int().nonnegative().optional(),
  duty_cycle: z.number().min(0).max(1).optional(),
  observe_time_fraction: z.number().min(0).max(1).optional(),
  link_efficiency: z.number().min(0).max(1).optional()
});

export const meterStateSchema = z.enum(['ok', 'warning', 'fail']);

export const meterIdSchema = z.enum([
  'mass',
  'power',
  'budget',
  'data',
  'communications',
  'time'
]);

export const meterItemSchema = z.object({
  id: meterIdSchema,
  label: z.string().min(1),
  value: z.number(),
  limit: z.number(),
  unit: z.string(),
  state: meterStateSchema,
  why: z.string()
});

export const metersSchema = z.object({
  mass: meterItemSchema,
  power: meterItemSchema,
  budget: meterItemSchema,
  data: meterItemSchema,
  communications: meterItemSchema,
  time: meterItemSchema
});

export const checkResultSchema = z.object({
  id: z.string().min(1),
  passed: z.boolean(),
  reason: z.string(),
  suggestedFix: z.string(),
  isWarning: z.boolean().optional()
});

export const missionValidationResultSchema = z.object({
  checks: z.array(checkResultSchema),
  passed: z.boolean(),
  warnings: z.array(checkResultSchema)
});

export const voteTallySchema = z.object({
  choice: z.string(),
  votes: z.number().int().nonnegative(),
  voterIds: z.array(z.string())
});

export const invalidVoteRecordSchema = z.object({
  vote: z.unknown().optional(),
  playerId: z.string().optional(),
  choice: z.unknown().optional(),
  reason: z.string()
});

export const playerDataErrorSchema = z.object({
  playerId: z.string().optional(),
  field: z.string(),
  reason: z.string()
});

export const voteResolutionStatusSchema = z.enum([
  'passed',
  'tie',
  'no_majority',
  'missing_votes',
  'invalid'
]);

export const voteResolutionResultSchema = z.object({
  status: voteResolutionStatusSchema,
  passed: z.boolean(),
  decision: z.string(),
  winner: z.string().nullable(),
  tallies: z.array(voteTallySchema),
  totalEligibleVoters: z.number().int().nonnegative(),
  votesCast: z.number().int().nonnegative(),
  validVotesCount: z.number().int().nonnegative(),
  majorityThreshold: z.number().int().nonnegative(),
  missingPlayerIds: z.array(z.string()),
  invalidVotes: z.array(invalidVoteRecordSchema),
  playerErrors: z.array(playerDataErrorSchema),
  reason: z.string()
});

export const missionOutcomeSchema = z.enum([
  'failure',
  'threshold_met',
  'baseline_met'
]);

export const missionRankSchema = z.enum([
  'Cadet',
  'Engineer',
  'Mission Lead',
  'Flight Director'
]);

export const timelineEntrySchema = z.object({
  month: z.number(),
  event: z.string(),
  description: z.string()
});

export const monthlySeriesSchema = z.object({
  months: z.array(z.number()),
  power_w: z.array(z.number()),
  data_stored_gb: z.array(z.number()),
  budget_remaining_m: z.array(z.number()),
  health: z.array(z.number())
});

export const eventAppliedSchema = z.object({
  event_id: z.string(),
  month: z.number(),
  name: z.string(),
  cause: z.string(),
  mitigation_hint: z.string()
});

export const simResultSchema = z.object({
  outcome: missionOutcomeSchema,
  timeline: z.array(timelineEntrySchema),
  series: monthlySeriesSchema,
  events_applied: z.array(eventAppliedSchema),
  cause_tags: z.array(z.string()),
  science_collected: z.number(),
  data_generated_total_gb: z.number(),
  data_transmitted_total_gb: z.number(),
  data_lost_total_gb: z.number(),
  final_health: z.number(),
  lifetime_months: z.number(),
  design: missionDesignSchema,
  error: z.string().optional()
});

export const scoreBreakdownSchema = z.object({
  mission_success: z.number(),
  science_value: z.number(),
  resource_efficiency: z.number(),
  engineering_quality: z.number(),
  team_coordination: z.number(),
  total: z.number(),
  rank: missionRankSchema,
  mode: z.enum(['solo', 'team'])
});

export const riskMatrixItemSchema = z.object({
  risk: z.string(),
  likelihood: z.number().min(1).max(5),
  consequence: z.number().min(1).max(5),
  mitigation: z.string()
});

export const realMissionSchema = z.object({
  id: z.string(),
  name: z.string(),
  organization: z.string(),
  objective_type: z.string(),
  size_class: z.string(),
  description: z.string(),
  source: z.string(),
  explanation: z.string()
});

export const reportSchema = z.object({
  result: missionOutcomeSchema,
  timeline: z.array(timelineEntrySchema),
  series: monthlySeriesSchema,
  why: z.array(z.string()),
  what_to_try_next: z.tuple([z.string(), z.string()]),
  top_risks: z.array(riskMatrixItemSchema),
  similar_real_mission: realMissionSchema.nullable(),
  score: scoreBreakdownSchema,
  rank: missionRankSchema
});

// --------------------------------------------------------------------------
// 3. Client Intent Payloads & Schemas (Client -> Server)
// --------------------------------------------------------------------------

/**
 * Client intent to create a new multiplayer room.
 */
export const createRoomPayloadSchema = z.object({
  playerName: z
    .string()
    .trim()
    .min(1, 'Player name is required')
    .max(50, 'Player name cannot exceed 50 characters'),
  preferredRole: teamRoleSchema.optional(),
  difficultyLevel: z.number().int().min(1).max(3).optional()
});
export type CreateRoomPayload = z.infer<typeof createRoomPayloadSchema>;

/**
 * Client intent to join an existing room via 4-letter room code or reconnect.
 */
export const joinRoomPayloadSchema = z.object({
  roomCode: z
    .string()
    .trim()
    .min(1, 'Room code is required')
    .max(10, 'Room code cannot exceed 10 characters'),
  playerName: z
    .string()
    .trim()
    .min(1, 'Player name is required')
    .max(50, 'Player name cannot exceed 50 characters'),
  playerId: z.string().trim().min(1).optional(),
  playerToken: z.string().trim().min(1).optional(),
  preferredRole: teamRoleSchema.optional()
});
export type JoinRoomPayload = z.infer<typeof joinRoomPayloadSchema>;

/**
 * Client intent to claim or switch a team role.
 */
export const setRolePayloadSchema = z.object({
  roomCode: z
    .string()
    .trim()
    .min(1, 'Room code is required')
    .max(10, 'Room code cannot exceed 10 characters'),
  playerId: z.string().trim().min(1, 'Player ID is required'),
  role: teamRoleSchema
});
export type SetRolePayload = z.infer<typeof setRolePayloadSchema>;

/**
 * Client intent to add or remove a spacecraft part.
 */
export const editPartPayloadSchema = z.object({
  roomCode: z
    .string()
    .trim()
    .min(1, 'Room code is required')
    .max(10, 'Room code cannot exceed 10 characters'),
  playerId: z.string().trim().min(1, 'Player ID is required'),
  action: z.enum(['add', 'remove']),
  partId: z.string().trim().min(1, 'Part ID is required')
});
export type EditPartPayload = z.infer<typeof editPartPayloadSchema>;

/**
 * Client intent to propose a shared team decision for voting.
 */
export const proposeDecisionPayloadSchema = z.object({
  roomCode: z
    .string()
    .trim()
    .min(1, 'Room code is required')
    .max(10, 'Room code cannot exceed 10 characters'),
  playerId: z.string().trim().min(1, 'Player ID is required'),
  decision: sharedDecisionTypeSchema,
  options: z
    .array(z.string().trim().min(1, 'Option cannot be empty'))
    .min(1, 'At least one option must be provided'),
  initialChoice: z.string().trim().min(1).optional(),
  description: z.string().trim().max(500).optional()
});
export type ProposeDecisionPayload = z.infer<typeof proposeDecisionPayloadSchema>;

/**
 * Client intent to cast a vote on an active shared decision.
 */
export const votePayloadSchema = z.object({
  roomCode: z
    .string()
    .trim()
    .min(1, 'Room code is required')
    .max(10, 'Room code cannot exceed 10 characters'),
  playerId: z.string().trim().min(1, 'Player ID is required'),
  decision: sharedDecisionTypeSchema,
  choice: z.string().trim().min(1, 'Vote choice is required')
});
export type VotePayload = z.infer<typeof votePayloadSchema>;

/**
 * Client intent to launch mission simulation once all checks pass.
 */
export const startSimPayloadSchema = z.object({
  roomCode: z
    .string()
    .trim()
    .min(1, 'Room code is required')
    .max(10, 'Room code cannot exceed 10 characters'),
  playerId: z.string().trim().min(1, 'Player ID is required'),
  seed: z.number().int().optional(),
  level: z.number().int().min(1).max(3).optional()
});
export type StartSimPayload = z.infer<typeof startSimPayloadSchema>;

// --------------------------------------------------------------------------
// 4. Protocol-Local State & Support Types
// --------------------------------------------------------------------------

/**
 * Represents an ongoing voting decision within an active room.
 */
export const activeDecisionStateSchema = z.object({
  decision: sharedDecisionTypeSchema,
  proposerId: z.string().trim().min(1),
  options: z.array(z.string()),
  description: z.string().optional(),
  votes: z.record(z.string(), z.string()),
  majorityThreshold: z.number().int().positive(),
  votedPlayerIds: z.array(z.string()),
  missingPlayerIds: z.array(z.string())
});
export type ActiveDecisionState = z.infer<typeof activeDecisionStateSchema>;

/**
 * Standard error codes for action rejections.
 */
export const actionRejectionCodeSchema = z.enum([
  'UNAUTHORIZED_ROLE',
  'ROLE_TAKEN',
  'ROOM_NOT_FOUND',
  'ROOM_FULL',
  'INVALID_PART',
  'INVALID_DECISION',
  'INVALID_VOTE',
  'VOTE_CLOSED',
  'PRE_LAUNCH_CHECKS_FAILED',
  'SIMULATION_ERROR',
  'BAD_REQUEST'
]);
export type ActionRejectionCode = z.infer<typeof actionRejectionCodeSchema>;

// --------------------------------------------------------------------------
// 5. Server Message Payloads & Schemas (Server -> Client)
// --------------------------------------------------------------------------

/**
 * Sent to the room creator with initial room credentials and session state.
 */
export const roomCreatedPayloadSchema = z.object({
  roomCode: z.string().trim().min(1).max(10),
  playerId: z.string().trim().min(1),
  playerToken: z.string().trim().min(1),
  assignedRole: teamRoleSchema.optional(),
  players: z.array(teamPlayerSchema),
  design: missionDesignSchema,
  meters: metersSchema,
  validation: missionValidationResultSchema
});
export type RoomCreatedPayload = z.infer<typeof roomCreatedPayloadSchema>;

/**
 * Sent to a joining or reconnecting player with current room session state.
 */
export const roomJoinedPayloadSchema = roomCreatedPayloadSchema;
export type RoomJoinedPayload = z.infer<typeof roomJoinedPayloadSchema>;

/**
 * Broadcast to all room members whenever state changes.
 */
export const stateUpdatePayloadSchema = z.object({
  roomCode: z.string().trim().min(1).max(10),
  players: z.array(teamPlayerSchema),
  design: missionDesignSchema,
  meters: metersSchema,
  validation: missionValidationResultSchema,
  activeDecision: activeDecisionStateSchema.nullable().optional(),
  simStatus: z.enum(['idle', 'running', 'completed']),
  version: z.number().int().nonnegative()
});
export type StateUpdatePayload = z.infer<typeof stateUpdatePayloadSchema>;

/**
 * Sent to a client when an intent is rejected by the server authority.
 */
export const actionRejectedPayloadSchema = z.object({
  action: z.string().trim().min(1),
  reason: z.string().trim().min(1),
  code: z.union([actionRejectionCodeSchema, z.string()]).optional(),
  playerId: z.string().trim().min(1).optional()
});
export type ActionRejectedPayload = z.infer<typeof actionRejectedPayloadSchema>;

/**
 * Broadcast to room members when a shared voting decision concludes.
 */
export const decisionResolvedPayloadSchema = z.object({
  roomCode: z.string().trim().min(1).max(10),
  decision: sharedDecisionTypeSchema,
  result: voteResolutionResultSchema,
  appliedChange: z
    .object({
      field: z.string(),
      value: z.unknown()
    })
    .nullable()
    .optional()
});
export type DecisionResolvedPayload = z.infer<typeof decisionResolvedPayloadSchema>;

/**
 * Broadcast to room members when a mission simulation run completes.
 */
export const simResultPayloadSchema = z.object({
  roomCode: z.string().trim().min(1).max(10),
  sim: simResultSchema,
  report: reportSchema,
  score: scoreBreakdownSchema
});
export type SimResultPayload = z.infer<typeof simResultPayloadSchema>;

/**
 * Sent on general server or session errors (A4 error event).
 */
export const errorPayloadSchema = z.object({
  message: z.string().trim().min(1, 'Error message is required'),
  code: z.string().optional(),
  details: z.unknown().optional()
});
export type ErrorPayload = z.infer<typeof errorPayloadSchema>;
export const serverErrorPayloadSchema = errorPayloadSchema;
export type ServerErrorPayload = ErrorPayload;

// --------------------------------------------------------------------------
// 6. Protocol Message Maps & Envelopes
// --------------------------------------------------------------------------

export interface ClientIntentMap {
  create_room: CreateRoomPayload;
  join_room: JoinRoomPayload;
  set_role: SetRolePayload;
  edit_part: EditPartPayload;
  propose_decision: ProposeDecisionPayload;
  vote: VotePayload;
  start_sim: StartSimPayload;
}

export interface ServerMessageMap {
  room_created: RoomCreatedPayload;
  room_joined: RoomJoinedPayload;
  state_update: StateUpdatePayload;
  action_rejected: ActionRejectedPayload;
  decision_resolved: DecisionResolvedPayload;
  sim_result: SimResultPayload;
  error: ErrorPayload;
}

export const clientIntentSchemas = {
  create_room: createRoomPayloadSchema,
  join_room: joinRoomPayloadSchema,
  set_role: setRolePayloadSchema,
  edit_part: editPartPayloadSchema,
  propose_decision: proposeDecisionPayloadSchema,
  vote: votePayloadSchema,
  start_sim: startSimPayloadSchema
} as const;

export const serverMessageSchemas = {
  room_created: roomCreatedPayloadSchema,
  room_joined: roomJoinedPayloadSchema,
  state_update: stateUpdatePayloadSchema,
  action_rejected: actionRejectedPayloadSchema,
  decision_resolved: decisionResolvedPayloadSchema,
  sim_result: simResultPayloadSchema,
  error: errorPayloadSchema
} as const;

/**
 * Generic transport-neutral client intent message wrapper.
 */
export interface ClientMessageEnvelope<T extends ClientIntent = ClientIntent> {
  event: T;
  data: ClientIntentMap[T];
}

/**
 * Generic transport-neutral server event message wrapper.
 */
export interface ServerMessageEnvelope<T extends ServerMessage = ServerMessage> {
  event: T;
  data: ServerMessageMap[T];
}

// --------------------------------------------------------------------------
// 7. Type Guards & Parsing Helpers
// --------------------------------------------------------------------------

/**
 * Type guard for client intent names.
 */
export function isClientIntent(event: unknown): event is ClientIntent {
  return typeof event === 'string' && (CLIENT_INTENTS as readonly string[]).includes(event as ClientIntent);
}

/**
 * Type guard for server message names.
 */
export function isServerMessage(event: unknown): event is ServerMessage {
  return typeof event === 'string' && (SERVER_MESSAGES as readonly string[]).includes(event as ServerMessage);
}

/**
 * Parses and validates an incoming client intent payload with Zod.
 * Throws ZodError if validation fails.
 */
export function parseClientIntent<T extends ClientIntent>(
  intent: T,
  data: unknown
): ClientIntentMap[T] {
  return clientIntentSchemas[intent].parse(data) as ClientIntentMap[T];
}

/**
 * Safely parses and validates an incoming client intent payload with Zod.
 * Returns { success: true, data } or { success: false, error }.
 */
export function safeParseClientIntent<T extends ClientIntent>(
  intent: T,
  data: unknown
) {
  return clientIntentSchemas[intent].safeParse(data);
}

/**
 * Parses and validates an outgoing or received server message payload with Zod.
 * Throws ZodError if validation fails.
 */
export function parseServerMessage<T extends ServerMessage>(
  message: T,
  data: unknown
): ServerMessageMap[T] {
  return serverMessageSchemas[message].parse(data) as ServerMessageMap[T];
}

/**
 * Safely parses and validates a server message payload with Zod.
 * Returns { success: true, data } or { success: false, error }.
 */
export function safeParseServerMessage<T extends ServerMessage>(
  message: T,
  data: unknown
) {
  return serverMessageSchemas[message].safeParse(data);
}
