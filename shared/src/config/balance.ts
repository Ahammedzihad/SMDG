/**
 * ORBITONE balance configuration constants.
 * Citations are grounded in NASA mission design references or designated as game values.
 */

/**
 * Minimum budget reserve required throughout development.
 * Source: NASA CubeSat 101 p.13 ("Ensure budget reserves of at least 10% are maintained throughout development.")
 */
export const BUDGET_RESERVE_MIN = 0.10;

/**
 * Strict technical margin required at Point Design (CML 4) for mass, power, and energy.
 * Source: JPL CML Fig 8b (Point Design checklist: dry mass >= 35%, power >= 35%, energy >= 35%)
 */
export const TECH_MARGIN_STRICT = 0.35;

/**
 * Level 1 technical margin threshold (introductory / Office Hours difficulty).
 * Source: game value (relaxed beginner threshold providing gentle warnings rather than strict JPL 35% requirement)
 */
export const TECH_MARGIN_L1 = 0.15;

/**
 * Concept Maturity Level stage-gate pass threshold.
 * Source: JPL CML section V (a stage passes when at least 80% of checklist items are satisfied)
 */
export const STAGE_GATE_PASS = 0.80;

/**
 * Monthly random event probabilities by game difficulty level.
 * Source: game values (GAME_RULES section 9: none for L1, rare for L2, normal for L3)
 */
export const EVENT_PROBABILITY_L1 = 0.00; // Level 1: no random events
export const EVENT_PROBABILITY_L2 = 0.15; // Level 2: rare random events (15% per month)
export const EVENT_PROBABILITY_L3 = 0.40; // Level 3: normal random events (40% per month)

/**
 * Mission scoring category weights from GAME_RULES section 8.
 * Total sums to 100 in both team and solo modes.
 */
export const SCORE_WEIGHTS_TEAM = {
  mission_success: 30,
  science_value: 20,
  resource_efficiency: 20,
  engineering_quality: 15,
  team_coordination: 15
} as const;

export const SCORE_WEIGHTS_SOLO = {
  mission_success: 30,
  science_value: 20,
  resource_efficiency: 20,
  engineering_quality: 30, // In solo mode the 15 moves to engineering quality
  team_coordination: 0
} as const;

/**
 * Rank boundaries from GAME_RULES section 8:
 * Cadet (0-39), Engineer (40-59), Mission Lead (60-79), Flight Director (80-100).
 */
export const RANK_THRESHOLDS = {
  CADET_MAX: 39,
  ENGINEER_MAX: 59,
  MISSION_LEAD_MAX: 79
} as const;
