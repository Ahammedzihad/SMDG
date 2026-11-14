/**
 * @orbitone/shared - Space Mission Design Game rules engine and shared definitions.
 */

// Balance configuration
export {
  BUDGET_RESERVE_MIN,
  STAGE_GATE_PASS,
  TECH_MARGIN_L1,
  TECH_MARGIN_STRICT
} from './config/balance.js';

// Types
export type {
  CheckResult,
  CubeSatClass,
  MissionEvent,
  MissionValidationResult,
  Objective,
  Orbit,
  Part,
  PartCategory,
  Vehicle
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
  getVehicles,
  objectives,
  orbits,
  parts,
  vehicles
} from './data.js';
