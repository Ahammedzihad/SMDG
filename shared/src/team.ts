/**
 * Team roles, category authorization, and shared decision voting resolver for ORBITONE.
 *
 * Implements:
 * - The four team roles and their owned spacecraft part categories (GAME_RULES section 3).
 * - Pure authorization checks for part category editing.
 * - Pure voting resolver for shared decisions (majority wins; in a 2-player team both must agree).
 * - Explicit, typed error and outcome handling for invalid votes, missing votes, ties, and invalid player/role data.
 */

import type {
  InvalidVoteRecord,
  PartCategory,
  PlayerDataError,
  PlayerVote,
  RoleAuthCheckResult,
  TeamPlayer,
  TeamRole,
  TeamRoleInfo,
  VoteResolutionOptions,
  VoteResolutionParams,
  VoteResolutionResult,
  VoteResolutionStatus,
  VoteTally
} from './types.js';

// --------------------------------------------------------------------------
// 1. Role Definitions & Constants
// --------------------------------------------------------------------------

export const TEAM_ROLES: readonly TeamRole[] = [
  'mission_planner',
  'spacecraft_engineer',
  'science_lead',
  'comms_budget_officer'
] as const;

export const ROLE_EDITABLE_CATEGORIES: Readonly<Record<TeamRole, readonly PartCategory[]>> = {
  mission_planner: [],
  spacecraft_engineer: ['structure', 'power', 'battery', 'computer', 'adcs'],
  science_lead: ['instrument'],
  comms_budget_officer: ['comms']
};

export const TEAM_ROLE_INFO: Readonly<Record<TeamRole, TeamRoleInfo>> = {
  mission_planner: {
    id: 'mission_planner',
    name: 'Mission Planner',
    description: 'Owns mission objective, requirements, target orbit, mission lifetime, and final sign-off.',
    categories: ROLE_EDITABLE_CATEGORIES.mission_planner,
    owns: 'Objective, requirements, orbit, mission time, final sign-off',
    typicalConflict: 'Wants longer mission and better orbit, which costs money and fuel'
  },
  spacecraft_engineer: {
    id: 'spacecraft_engineer',
    name: 'Spacecraft Engineer',
    description: 'Owns satellite structure, power generation, battery, onboard computer, attitude control, and technical margins.',
    categories: ROLE_EDITABLE_CATEGORIES.spacecraft_engineer,
    owns: 'Structure, power, battery, computer, attitude control, mass and power margins',
    typicalConflict: 'Every added part adds mass and power draw'
  },
  science_lead: {
    id: 'science_lead',
    name: 'Science Lead',
    description: 'Owns scientific payloads, sensor selection, science value return, and data generation rate.',
    categories: ROLE_EDITABLE_CATEGORIES.science_lead,
    owns: 'Instruments, science value, data volume',
    typicalConflict: 'Wants more instruments, which add mass, power and data'
  },
  comms_budget_officer: {
    id: 'comms_budget_officer',
    name: 'Comms and Budget Officer',
    description: 'Owns communications antenna, ground station passes, data downlink, total budget allocation, and launch vehicle selection.',
    categories: ROLE_EDITABLE_CATEGORIES.comms_budget_officer,
    owns: 'Antenna, ground stations, data downlink, total cost, launch vehicle',
    typicalConflict: 'Wants to cut cost, but data cannot be sent home'
  }
};

export const SHARED_DECISION_TYPES: readonly string[] = [
  'objective',
  'orbit',
  'launch_vehicle',
  'final_launch'
] as const;

const VALID_PART_CATEGORIES: readonly PartCategory[] = [
  'structure',
  'power',
  'battery',
  'comms',
  'computer',
  'adcs',
  'instrument'
] as const;

// --------------------------------------------------------------------------
// 2. Role & Authorization Helpers
// --------------------------------------------------------------------------

/**
 * Checks if a value is a valid TeamRole identifier.
 */
export function isTeamRole(role: unknown): role is TeamRole {
  return typeof role === 'string' && TEAM_ROLES.includes(role as TeamRole);
}

/**
 * Checks if a value is a valid PartCategory identifier.
 */
export function isPartCategory(category: unknown): category is PartCategory {
  return typeof category === 'string' && VALID_PART_CATEGORIES.includes(category as PartCategory);
}

/**
 * Returns the spacecraft categories that a given role is authorized to edit.
 */
export function getRoleEditableCategories(role: TeamRole): readonly PartCategory[] {
  return ROLE_EDITABLE_CATEGORIES[role] ?? [];
}

/**
 * Finds the role that owns a specific spacecraft part category.
 */
export function getRoleForCategory(category: PartCategory): TeamRole | null {
  for (const role of TEAM_ROLES) {
    if (ROLE_EDITABLE_CATEGORIES[role].includes(category)) {
      return role;
    }
  }
  return null;
}

/**
 * Pure authorization check returning a rich result indicating whether a role may edit a category.
 *
 * @param role The role attempting to edit.
 * @param category The spacecraft part category to edit.
 * @returns RoleAuthCheckResult with authorization status and plain-language explanation.
 */
export function checkRoleAuthorization(role: unknown, category: unknown): RoleAuthCheckResult {
  if (!isTeamRole(role)) {
    return {
      authorized: false,
      reason: `Invalid role "${String(role)}". Must be one of: ${TEAM_ROLES.join(', ')}.`
    };
  }

  if (!isPartCategory(category)) {
    return {
      authorized: false,
      role,
      reason: `Invalid spacecraft category "${String(category)}". Must be one of: ${VALID_PART_CATEGORIES.join(', ')}.`
    };
  }

  const roleInfo = TEAM_ROLE_INFO[role];
  const isAllowed = ROLE_EDITABLE_CATEGORIES[role].includes(category);

  if (isAllowed) {
    return {
      authorized: true,
      role,
      category,
      reason: `Role "${roleInfo.name}" is authorized to edit "${category}" parts.`
    };
  }

  const ownerRole = getRoleForCategory(category);
  const ownerName = ownerRole ? TEAM_ROLE_INFO[ownerRole].name : 'another role';

  return {
    authorized: false,
    role,
    category,
    reason: `Role "${roleInfo.name}" is not authorized to edit "${category}" parts (owned by ${ownerName}).`
  };
}

/**
 * Pure authorization check returning a boolean indicating whether a role may edit a category.
 */
export function canRoleEditCategory(role: unknown, category: unknown): boolean {
  return checkRoleAuthorization(role, category).authorized;
}

// --------------------------------------------------------------------------
// 3. Voting Resolver for Shared Decisions
// --------------------------------------------------------------------------

/**
 * Normalizes input parameters for the voting resolver.
 */
function normalizeVoteParams(
  decisionOrParams: string | VoteResolutionParams,
  maybePlayers?: Array<TeamPlayer | string>,
  maybeVotes?: PlayerVote[] | Record<string, string>,
  maybeOptions?: VoteResolutionOptions
): {
  decision: string;
  players: Array<TeamPlayer | string>;
  votes: PlayerVote[] | Record<string, string>;
  options: VoteResolutionOptions;
} {
  if (typeof decisionOrParams === 'object' && decisionOrParams !== null && 'decision' in decisionOrParams) {
    return {
      decision: decisionOrParams.decision,
      players: decisionOrParams.players ?? [],
      votes: decisionOrParams.votes ?? [],
      options: decisionOrParams.options ?? {}
    };
  }

  return {
    decision: typeof decisionOrParams === 'string' ? decisionOrParams : '',
    players: maybePlayers ?? [],
    votes: maybeVotes ?? [],
    options: maybeOptions ?? {}
  };
}

/**
 * Pure voting resolver for shared decisions (objective, orbit, launch vehicle, final launch).
 *
 * Rules:
 * - Majority wins for 3 or 4 players (strict majority: > 50%).
 * - With 2 players, BOTH must agree (unanimous agreement required).
 * - With 1 player (solo), 1 vote is sufficient.
 * - Handles invalid votes, missing votes, ties, or invalid player/role data with clear typed results.
 */
export function resolveVotes(params: VoteResolutionParams): VoteResolutionResult;
export function resolveVotes(
  decision: string,
  players: Array<TeamPlayer | string>,
  votes: PlayerVote[] | Record<string, string>,
  options?: VoteResolutionOptions
): VoteResolutionResult;
export function resolveVotes(
  decisionOrParams: string | VoteResolutionParams,
  maybePlayers?: Array<TeamPlayer | string>,
  maybeVotes?: PlayerVote[] | Record<string, string>,
  maybeOptions?: VoteResolutionOptions
): VoteResolutionResult {
  const { decision, players, votes, options } = normalizeVoteParams(
    decisionOrParams,
    maybePlayers,
    maybeVotes,
    maybeOptions
  );

  const playerErrors: PlayerDataError[] = [];

  // 1. Validate decision string
  if (typeof decision !== 'string' || decision.trim() === '') {
    playerErrors.push({
      field: 'decision',
      reason: 'A valid non-empty decision identifier must be provided.'
    });
  }

  // 2. Validate players array
  if (!Array.isArray(players)) {
    playerErrors.push({
      field: 'players',
      reason: 'Eligible players must be provided as an array.'
    });
  } else if (players.length === 0) {
    playerErrors.push({
      field: 'players',
      reason: 'Eligible players list cannot be empty.'
    });
  }

  // 3. Validate individual player and role data
  const eligiblePlayerIds: string[] = [];
  const seenPlayerIds = new Set<string>();
  const seenRoles = new Set<TeamRole>();

  if (Array.isArray(players)) {
    for (let i = 0; i < players.length; i++) {
      const entry = players[i];
      if (entry === null || entry === undefined || (typeof entry !== 'string' && typeof entry !== 'object')) {
        playerErrors.push({
          field: `players[${i}]`,
          reason: `Player entry at index ${i} is not a valid player object or string ID.`
        });
        continue;
      }

      let pId: string;
      let pRole: unknown = undefined;

      if (typeof entry === 'string') {
        pId = entry.trim();
      } else {
        pId = typeof entry.id === 'string' ? entry.id.trim() : '';
        pRole = entry.role;
      }

      if (pId === '') {
        playerErrors.push({
          field: `players[${i}].id`,
          reason: `Player entry at index ${i} is missing a non-empty id string.`
        });
        continue;
      }

      if (seenPlayerIds.has(pId)) {
        playerErrors.push({
          playerId: pId,
          field: 'id',
          reason: `Duplicate player ID "${pId}" found in team roster.`
        });
      } else {
        seenPlayerIds.add(pId);
        eligiblePlayerIds.push(pId);
      }

      // Role validation if role is specified
      if (pRole !== undefined) {
        if (!isTeamRole(pRole)) {
          playerErrors.push({
            playerId: pId,
            field: 'role',
            reason: `Invalid role "${String(pRole)}". Must be one of: ${TEAM_ROLES.join(', ')}.`
          });
        } else if (!options.allowDuplicateRoles) {
          if (seenRoles.has(pRole)) {
            playerErrors.push({
              playerId: pId,
              field: 'role',
              reason: `Duplicate role "${pRole}": each player in team mode must hold a distinct role.`
            });
          } else {
            seenRoles.add(pRole);
          }
        }
      }
    }
  }

  // If player or role validation failed, return 'invalid' immediately
  if (playerErrors.length > 0) {
    return {
      status: 'invalid',
      passed: false,
      decision: typeof decision === 'string' ? decision : '',
      winner: null,
      tallies: [],
      totalEligibleVoters: eligiblePlayerIds.length,
      votesCast: 0,
      validVotesCount: 0,
      majorityThreshold: 0,
      missingPlayerIds: [],
      invalidVotes: [],
      playerErrors,
      reason: `Voting cannot proceed due to invalid player/role data: ${playerErrors.map((e) => e.reason).join('; ')}`
    };
  }

  // 4. Normalize and validate votes
  const eligibleIdSet = new Set(eligiblePlayerIds);
  let rawVotes: unknown[] = [];

  if (Array.isArray(votes)) {
    rawVotes = votes;
  } else if (typeof votes === 'object' && votes !== null) {
    rawVotes = Object.entries(votes).map(([playerId, choice]) => ({ playerId, choice }));
  }

  const validVotes: PlayerVote[] = [];
  const invalidVotes: InvalidVoteRecord[] = [];
  const votersSeen = new Set<string>();

  for (const v of rawVotes) {
    if (!v || typeof v !== 'object') {
      invalidVotes.push({
        vote: v,
        reason: 'Vote item is not a valid object.'
      });
      continue;
    }

    const { playerId, choice } = v as Partial<PlayerVote>;

    if (typeof playerId !== 'string' || playerId.trim() === '') {
      invalidVotes.push({
        vote: v,
        choice,
        reason: 'Vote is missing a valid playerId.'
      });
      continue;
    }

    if (!eligibleIdSet.has(playerId)) {
      invalidVotes.push({
        vote: v,
        playerId,
        choice,
        reason: `Voter "${playerId}" is not in the eligible team player roster.`
      });
      continue;
    }

    if (votersSeen.has(playerId)) {
      invalidVotes.push({
        vote: v,
        playerId,
        choice,
        reason: `Duplicate vote from player "${playerId}". Only one vote per player is counted.`
      });
      continue;
    }

    if (
      choice === undefined ||
      choice === null ||
      (typeof choice !== 'string' && typeof choice !== 'boolean') ||
      String(choice).trim() === ''
    ) {
      invalidVotes.push({
        vote: v,
        playerId,
        choice,
        reason: `Vote from player "${playerId}" has an empty or invalid choice.`
      });
      continue;
    }

    const normalizedChoice = String(choice).trim();

    if (options.allowedChoices && options.allowedChoices.length > 0) {
      if (!options.allowedChoices.includes(normalizedChoice)) {
        invalidVotes.push({
          vote: v,
          playerId,
          choice: normalizedChoice,
          reason: `Choice "${normalizedChoice}" is not in the allowed choices list (${options.allowedChoices.join(', ')}).`
        });
        continue;
      }
    }

    votersSeen.add(playerId);
    validVotes.push({ playerId, choice: normalizedChoice });
  }

  // 5. Identify missing votes
  const missingPlayerIds = eligiblePlayerIds.filter((id) => !votersSeen.has(id));

  // 6. Tally votes by choice
  const tallyMap = new Map<string, { choice: string; votes: number; voterIds: string[] }>();
  for (const v of validVotes) {
    const existing = tallyMap.get(v.choice);
    if (existing) {
      existing.votes += 1;
      existing.voterIds.push(v.playerId);
    } else {
      tallyMap.set(v.choice, { choice: v.choice, votes: 1, voterIds: [v.playerId] });
    }
  }

  const tallies: VoteTally[] = Array.from(tallyMap.values()).sort((a, b) => {
    if (b.votes !== a.votes) return b.votes - a.votes;
    return a.choice.localeCompare(b.choice);
  });

  // 7. Calculate required majority threshold
  const N = eligiblePlayerIds.length;
  // With 2 players: both must agree (threshold = 2)
  // For other team sizes: strict majority (> 50%)
  const majorityThreshold = N === 2 ? 2 : Math.floor(N / 2) + 1;

  const topTally = tallies[0] as VoteTally | undefined;
  const topVotes = topTally?.votes ?? 0;

  let status: VoteResolutionStatus;
  let passed = false;
  let winner: string | null = null;
  let reason = '';

  // 8. Determine outcome based on team size and voting rules
  if (N === 2) {
    // Two-player team: both must agree
    if (topVotes === 2) {
      status = 'passed';
      passed = true;
      winner = topTally!.choice;
      reason = `Shared decision "${decision}" passed: all 2 players agreed on "${winner}".`;
    } else if (missingPlayerIds.length === 0) {
      // Both players voted, but did not agree (1 vs 1)
      status = 'tie';
      passed = false;
      winner = null;
      reason = `Shared decision "${decision}" failed: in a 2-player team both players must agree, but votes were split between "${tallies[0].choice}" (1) and "${tallies[1].choice}" (1).`;
    } else {
      // Fewer than 2 players voted
      status = 'missing_votes';
      passed = false;
      winner = null;
      reason = `Shared decision "${decision}" is awaiting votes: ${missingPlayerIds.length} of 2 players have not voted (missing: ${missingPlayerIds.join(', ')}). In a 2-player team both must agree.`;
    }
  } else {
    // 1, 3, or 4 players: majority wins
    if (topVotes >= majorityThreshold) {
      if (options.requireAllVotes && missingPlayerIds.length > 0) {
        status = 'missing_votes';
        passed = false;
        winner = null;
        reason = `Shared decision "${decision}" has a preliminary lead for "${topTally!.choice}" (${topVotes}/${N}), but is awaiting remaining votes from: ${missingPlayerIds.join(', ')}.`;
      } else {
        status = 'passed';
        passed = true;
        winner = topTally!.choice;
        reason =
          topVotes === N && N > 1
            ? `Shared decision "${decision}" passed unanimously: all ${N} players voted for "${winner}".`
            : `Shared decision "${decision}" passed: "${winner}" won with a majority of ${topVotes} of ${N} votes.`;
      }
    } else if (missingPlayerIds.length > 0) {
      status = 'missing_votes';
      passed = false;
      winner = null;
      reason = `Shared decision "${decision}" is awaiting votes: ${missingPlayerIds.length} of ${N} players have not voted (missing: ${missingPlayerIds.join(', ')}). A majority of ${majorityThreshold} votes is required.`;
    } else {
      // All players voted, but topVotes < majorityThreshold
      const tiedChoices = tallies.filter((t) => t.votes === topVotes);
      if (tiedChoices.length > 1) {
        status = 'tie';
        passed = false;
        winner = null;
        reason = `Shared decision "${decision}" tied: ${tiedChoices.map((t) => `"${t.choice}" (${t.votes})`).join(', ')}.`;
      } else {
        status = 'no_majority';
        passed = false;
        winner = null;
        reason = `Shared decision "${decision}" failed to reach a majority: "${topTally!.choice}" received ${topVotes} of ${N} votes, but ${majorityThreshold} votes are required.`;
      }
    }
  }

  return {
    status,
    passed,
    decision,
    winner,
    tallies,
    totalEligibleVoters: N,
    votesCast: rawVotes.length,
    validVotesCount: validVotes.length,
    majorityThreshold,
    missingPlayerIds,
    invalidVotes,
    playerErrors: [],
    reason
  };
}

/**
 * Convenience helper to resolve binary approval/proposal votes (e.g. approve/reject final launch).
 */
export function resolveProposalVote(
  decision: string,
  players: Array<TeamPlayer | string>,
  votes: Array<{ playerId: string; approve: boolean }> | Record<string, boolean>,
  options?: VoteResolutionOptions
): VoteResolutionResult {
  let mappedVotes: PlayerVote[] = [];

  if (Array.isArray(votes)) {
    mappedVotes = votes.map((v) => ({
      playerId: v.playerId,
      choice: v.approve ? 'approve' : 'reject'
    }));
  } else if (typeof votes === 'object' && votes !== null) {
    mappedVotes = Object.entries(votes).map(([playerId, approve]) => ({
      playerId,
      choice: approve ? 'approve' : 'reject'
    }));
  }

  return resolveVotes({
    decision,
    players,
    votes: mappedVotes,
    options: {
      ...options,
      allowedChoices: options?.allowedChoices ?? ['approve', 'reject']
    }
  });
}
