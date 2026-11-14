/**
 * Hard checks and validation rules for ORBITONE missions.
 * All functions return plain-language explanations and actionable suggested fixes.
 */

import { BUDGET_RESERVE_MIN, TECH_MARGIN_L1 } from './config/balance.js';
import { margin } from './formulas.js';
import type { CheckResult, CubeSatClass, Vehicle } from './types.js';

/**
 * Check 1: massFitsVehicle
 * Verifies that the total spacecraft mass is within the vehicle's capacity for the chosen orbit.
 * Handles missing orbit without throwing an exception.
 */
export function checkMassFitsVehicle(
  total_mass_kg: number,
  vehicle: Vehicle,
  orbit_id: string
): CheckResult {
  const id = 'massFitsVehicle';

  if (total_mass_kg < 0) {
    return {
      id,
      passed: false,
      reason: 'Total spacecraft mass cannot be negative.',
      suggestedFix: 'Verify that all component masses are positive values.'
    };
  }

  if (!vehicle.capacity_by_orbit || !(orbit_id in vehicle.capacity_by_orbit)) {
    return {
      id,
      passed: false,
      reason: `Vehicle "${vehicle.name}" does not support orbit "${orbit_id}" (no launch capacity defined).`,
      suggestedFix: `Choose a launch vehicle certified for "${orbit_id}" or switch to a supported orbit.`
    };
  }

  const capacity = vehicle.capacity_by_orbit[orbit_id];
  if (capacity <= 0) {
    return {
      id,
      passed: false,
      reason: `Vehicle "${vehicle.name}" has 0 kg payload capacity to orbit "${orbit_id}".`,
      suggestedFix: `Choose a launch vehicle with positive capacity for "${orbit_id}".`
    };
  }

  if (total_mass_kg > capacity) {
    return {
      id,
      passed: false,
      reason: `Total spacecraft mass (${total_mass_kg} kg) exceeds vehicle "${vehicle.name}" capacity (${capacity} kg) for orbit "${orbit_id}".`,
      suggestedFix: 'Reduce spacecraft mass by descoping parts or choose a larger launch vehicle.'
    };
  }

  return {
    id,
    passed: true,
    reason: `Total spacecraft mass (${total_mass_kg} kg) is within vehicle "${vehicle.name}" capacity (${capacity} kg) for orbit "${orbit_id}".`,
    suggestedFix: ''
  };
}

/**
 * Check 2: powerBalanced
 * Verifies that average power generated covers average subsystem power consumption.
 */
export function checkPowerBalanced(
  power_used_w: number,
  power_generated_w: number
): CheckResult {
  const id = 'powerBalanced';

  if (power_used_w < 0 || power_generated_w < 0) {
    return {
      id,
      passed: false,
      reason: 'Power values cannot be negative.',
      suggestedFix: 'Verify component power consumption and solar generation values.'
    };
  }

  if (power_used_w > power_generated_w) {
    const deficit = (power_used_w - power_generated_w).toFixed(2);
    return {
      id,
      passed: false,
      reason: `Power consumption (${power_used_w.toFixed(2)} W) exceeds generated power (${power_generated_w.toFixed(2)} W) by ${deficit} W.`,
      suggestedFix: 'Increase solar panel area, improve solar panel efficiency, or reduce instrument duty cycle.'
    };
  }

  return {
    id,
    passed: true,
    reason: `Generated power (${power_generated_w.toFixed(2)} W) meets or exceeds power consumption (${power_used_w.toFixed(2)} W).`,
    suggestedFix: ''
  };
}

/**
 * Check 3: withinBudget
 * Verifies that total mission cost is within budget after reserving the required 10% reserve.
 */
export function checkWithinBudget(
  cost_total_m: number,
  budget_m: number,
  budget_reserve_min: number = BUDGET_RESERVE_MIN
): CheckResult {
  const id = 'withinBudget';

  if (budget_m <= 0) {
    return {
      id,
      passed: false,
      reason: 'Available budget must be greater than zero.',
      suggestedFix: 'Assign a valid mission budget.'
    };
  }

  if (cost_total_m < 0) {
    return {
      id,
      passed: false,
      reason: 'Total mission cost cannot be negative.',
      suggestedFix: 'Check spacecraft parts and launch costs.'
    };
  }

  const reserveFraction = Math.max(0, Math.min(1.0, budget_reserve_min));
  const reserveAmount = budget_m * reserveFraction;
  const maxAllowedCost = budget_m - reserveAmount;

  if (cost_total_m > maxAllowedCost) {
    const reservePct = Math.round(reserveFraction * 100);
    return {
      id,
      passed: false,
      reason: `Total cost ($${cost_total_m.toFixed(3)}M) exceeds maximum allowable spend ($${maxAllowedCost.toFixed(3)}M) after reserving the mandatory ${reservePct}% budget reserve ($${reserveAmount.toFixed(3)}M of $${budget_m.toFixed(3)}M).`,
      suggestedFix: 'Reduce build cost, choose a cheaper rideshare launcher, or shorten operational lifetime.'
    };
  }

  return {
    id,
    passed: true,
    reason: `Total cost ($${cost_total_m.toFixed(3)}M) is within allowable budget ($${maxAllowedCost.toFixed(3)}M) with reserve intact.`,
    suggestedFix: ''
  };
}

/**
 * Check 4: massUnderClassLimit
 * Verifies that total spacecraft mass does not exceed the chosen CubeSat class limit.
 * All limits in CubeSat 101 are "under" limits (e.g. 1U under 1.33 kg).
 */
export function checkMassUnderClassLimit(
  total_mass_kg: number,
  cubesat_class: CubeSatClass
): CheckResult {
  const id = 'massUnderClassLimit';

  if (total_mass_kg < 0) {
    return {
      id,
      passed: false,
      reason: 'Total spacecraft mass cannot be negative.',
      suggestedFix: 'Ensure all component masses are positive numbers.'
    };
  }

  if (total_mass_kg > cubesat_class.mass_limit_kg) {
    return {
      id,
      passed: false,
      reason: `Total spacecraft mass (${total_mass_kg.toFixed(2)} kg) exceeds the ${cubesat_class.id} class limit (${cubesat_class.mass_limit_kg.toFixed(2)} kg).`,
      suggestedFix: `Descope non-essential components to stay under ${cubesat_class.mass_limit_kg.toFixed(2)} kg or switch to a larger CubeSat class.`
    };
  }

  return {
    id,
    passed: true,
    reason: `Total spacecraft mass (${total_mass_kg.toFixed(2)} kg) is within the ${cubesat_class.id} limit (${cubesat_class.mass_limit_kg.toFixed(2)} kg).`,
    suggestedFix: ''
  };
}

/**
 * Check 5: dataCanBeSent
 * Verifies that ground station downlink bandwidth can clear the daily scientific data volume.
 * This is an advisory warning and is non-blocking.
 */
export function checkDataCanBeSent(
  data_sent_per_day_gb: number,
  data_made_per_day_gb: number
): CheckResult {
  const id = 'dataCanBeSent';

  if (data_sent_per_day_gb < 0 || data_made_per_day_gb < 0) {
    return {
      id,
      passed: false,
      isWarning: true,
      reason: 'Data volumes cannot be negative.',
      suggestedFix: 'Verify instrument data generation rates and antenna throughput.'
    };
  }

  if (data_sent_per_day_gb < data_made_per_day_gb) {
    return {
      id,
      passed: false,
      isWarning: true,
      reason: `Daily downlink capacity (${data_sent_per_day_gb.toFixed(2)} GB/day) is less than instrument data generation (${data_made_per_day_gb.toFixed(2)} GB/day). Onboard memory will fill over time.`,
      suggestedFix: 'Upgrade to a higher-frequency transmitter (e.g. S-Band), schedule additional ground passes, or reduce instrument duty cycle.'
    };
  }

  return {
    id,
    passed: true,
    isWarning: true,
    reason: `Downlink capacity (${data_sent_per_day_gb.toFixed(2)} GB/day) is sufficient for generated scientific data (${data_made_per_day_gb.toFixed(2)} GB/day).`,
    suggestedFix: ''
  };
}

/**
 * Evaluates technical margins against a threshold (e.g. TECH_MARGIN_L1 = 15% at Level 1).
 * Returns soft warnings for any margin falling below the threshold.
 */
export function checkTechnicalMargins(
  margins: {
    mass_margin?: number;
    power_margin?: number;
    budget_margin?: number;
  },
  threshold: number = TECH_MARGIN_L1
): CheckResult[] {
  const warnings: CheckResult[] = [];
  const thresholdPct = Math.round(threshold * 100);

  if (margins.mass_margin !== undefined && margins.mass_margin < threshold) {
    const currentPct = Math.round(margins.mass_margin * 100);
    warnings.push({
      id: 'lowMassMargin',
      passed: false,
      isWarning: true,
      reason: `Mass margin (${currentPct}%) is below the recommended ${thresholdPct}% threshold.`,
      suggestedFix: 'Consider removing optional hardware to restore safe mass margin.'
    });
  }

  if (margins.power_margin !== undefined && margins.power_margin < threshold) {
    const currentPct = Math.round(margins.power_margin * 100);
    warnings.push({
      id: 'lowPowerMargin',
      passed: false,
      isWarning: true,
      reason: `Power margin (${currentPct}%) is below the recommended ${thresholdPct}% threshold.`,
      suggestedFix: 'Consider adding solar panel area or duty-cycling high-power instruments.'
    });
  }

  if (margins.budget_margin !== undefined && margins.budget_margin < threshold) {
    const currentPct = Math.round(margins.budget_margin * 100);
    warnings.push({
      id: 'lowBudgetMargin',
      passed: false,
      isWarning: true,
      reason: `Budget margin (${currentPct}%) is below the recommended ${thresholdPct}% threshold.`,
      suggestedFix: 'Consider selecting lower-cost components to protect against financial overruns.'
    });
  }

  return warnings;
}

/**
 * Runs all five standard checks plus margin soft warnings.
 * Hard checks: 1-4 are blocking (must pass to launch).
 * Check 5 and margin checks are non-blocking warnings.
 */
export function runAllChecks(params: {
  total_mass_kg: number;
  cubesat_class: CubeSatClass;
  vehicle: Vehicle;
  orbit_id: string;
  power_used_w: number;
  power_generated_w: number;
  cost_total_m: number;
  budget_m: number;
  data_sent_per_day_gb: number;
  data_made_per_day_gb: number;
  margin_threshold?: number;
}): {
  checks: CheckResult[];
  passed: boolean;
  warnings: CheckResult[];
} {
  const massVehicleCheck = checkMassFitsVehicle(
    params.total_mass_kg,
    params.vehicle,
    params.orbit_id
  );
  const powerCheck = checkPowerBalanced(
    params.power_used_w,
    params.power_generated_w
  );
  const budgetCheck = checkWithinBudget(
    params.cost_total_m,
    params.budget_m
  );
  const classCheck = checkMassUnderClassLimit(
    params.total_mass_kg,
    params.cubesat_class
  );
  const dataCheck = checkDataCanBeSent(
    params.data_sent_per_day_gb,
    params.data_made_per_day_gb
  );

  const hardChecks = [massVehicleCheck, powerCheck, budgetCheck, classCheck];
  const passed = hardChecks.every((c) => c.passed);

  const vehicleCapacity = params.vehicle.capacity_by_orbit?.[params.orbit_id] ?? 0;
  const massMarginVal = margin(params.total_mass_kg, vehicleCapacity);
  const powerMarginVal = margin(params.power_used_w, params.power_generated_w);
  const budgetMarginVal = margin(params.cost_total_m, params.budget_m);

  const marginWarnings = checkTechnicalMargins(
    {
      mass_margin: massMarginVal,
      power_margin: powerMarginVal,
      budget_margin: budgetMarginVal
    },
    params.margin_threshold ?? TECH_MARGIN_L1
  );

  const allWarnings: CheckResult[] = [];
  if (!dataCheck.passed) {
    allWarnings.push(dataCheck);
  }
  allWarnings.push(...marginWarnings);

  return {
    checks: [...hardChecks, dataCheck],
    passed,
    warnings: allWarnings
  };
}
