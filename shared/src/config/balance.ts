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
