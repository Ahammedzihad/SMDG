/**
 * @orbitone/shared - Space Mission Design Game rules engine and shared definitions.
 */

// Balance configuration
export {
  BUDGET_RESERVE_MIN,
  EVENT_PROBABILITY_L1,
  EVENT_PROBABILITY_L2,
  EVENT_PROBABILITY_L3,
  RANK_THRESHOLDS,
  SCORE_WEIGHTS_SOLO,
  SCORE_WEIGHTS_TEAM,
  STAGE_GATE_PASS,
  TECH_MARGIN_L1,
  TECH_MARGIN_STRICT
} from './config/balance.js';

// Types
export type {
  CheckResult,
  CubeSatClass,
  EventApplied,
  InvalidVoteRecord,
  MeterId,
  MeterItem,
  Meters,
  MeterState,
  MissionDesign,
  MissionEvent,
  MissionOutcome,
  MissionRank,
  MissionValidationResult,
  MonthlySeries,
  Objective,
  Orbit,
  Part,
  PartCategory,
  PlayerDataError,
  PlayerVote,
  RealMission,
  Report,
  RiskMatrixItem,
  RoleAuthCheckResult,
  ScoreBreakdown,
  SharedDecisionType,
  SimResult,
  TeamPlayer,
  TeamRole,
  TeamRoleInfo,
  TimelineEntry,
  Vehicle,
  VoteResolutionOptions,
  VoteResolutionParams,
  VoteResolutionResult,
  VoteResolutionStatus,
  VoteTally
} from './types.js';

// Pure formulas
export {
  cost_total,
  cost_total_m,
  data_made_per_day,
  data_made_per_day_gb,
  data_sent_per_day,
  data_sent_per_day_gb,
  downlink_duration_days,
  margin,
  power_generated,
  power_generated_w,
  power_used,
  power_used_w,
  total_mass,
  total_mass_kg
} from './formulas.js';

// Checks and validation rules
export {
  checkDataCanBeSent,
  checkMassFitsVehicle,
  checkMassUnderClassLimit,
  checkPowerBalanced,
  checkTechnicalMargins,
  checkWithinBudget,
  runAllChecks
} from './checks.js';

// Game data
export {
  cubesatClasses,
  events,
  getCubesatClasses,
  getEvents,
  getObjectives,
  getOrbits,
  getParts,
  getRealMissions,
  getVehicles,
  objectives,
  orbits,
  parts,
  realMissions,
  vehicles
} from './data.js';

// PRNG
export { createRNG, normalizeSeed, type RNG } from './rng.js';

// Mission Simulation
export { runSimulation } from './simulation.js';

// Mission Scoring
export { getRankFromScore, scoreMission } from './scoring.js';

// Mission Report
export { buildReport, findSimilarRealMission } from './report.js';

// Resource Meters
export { computeMeters } from './meters.js';

// Team Roles, Authorization & Voting
export {
  ROLE_EDITABLE_CATEGORIES,
  SHARED_DECISION_TYPES,
  TEAM_ROLE_INFO,
  TEAM_ROLES,
  canRoleEditCategory,
  checkRoleAuthorization,
  getRoleEditableCategories,
  getRoleForCategory,
  isPartCategory,
  isTeamRole,
  resolveProposalVote,
  resolveVotes
} from './team.js';

// Client/Server Protocol Contract
export {
  CLIENT_INTENTS,
  SERVER_MESSAGES,
  actionRejectedPayloadSchema,
  actionRejectionCodeSchema,
  activeDecisionStateSchema,
  checkResultSchema,
  clientIntentSchemas,
  createRoomPayloadSchema,
  decisionResolvedPayloadSchema,
  editPartPayloadSchema,
  errorPayloadSchema,
  isClientIntent,
  isServerMessage,
  joinRoomPayloadSchema,
  meterIdSchema,
  meterItemSchema,
  metersSchema,
  meterStateSchema,
  missionDesignSchema,
  missionValidationResultSchema,
  parseClientIntent,
  parseServerMessage,
  proposeDecisionPayloadSchema,
  reportSchema,
  roomCreatedPayloadSchema,
  roomJoinedPayloadSchema,
  safeParseClientIntent,
  safeParseServerMessage,
  scoreBreakdownSchema,
  serverErrorPayloadSchema,
  serverMessageSchemas,
  setRolePayloadSchema,
  sharedDecisionTypeSchema,
  simResultPayloadSchema,
  simResultSchema,
  startSimPayloadSchema,
  stateUpdatePayloadSchema,
  teamPlayerSchema,
  teamRoleSchema,
  votePayloadSchema,
  voteResolutionResultSchema,
  voteTallySchema
} from './protocol.js';

export type {
  ActionRejectedPayload,
  ActionRejectionCode,
  ActiveDecisionState,
  ClientIntent,
  ClientIntentMap,
  ClientMessageEnvelope,
  CreateRoomPayload,
  DecisionResolvedPayload,
  EditPartPayload,
  ErrorPayload,
  JoinRoomPayload,
  ProposeDecisionPayload,
  RoomCreatedPayload,
  RoomJoinedPayload,
  ServerErrorPayload,
  ServerMessage,
  ServerMessageEnvelope,
  ServerMessageMap,
  SetRolePayload,
  SimResultPayload,
  StartSimPayload,
  StateUpdatePayload,
  VotePayload
} from './protocol.js';



