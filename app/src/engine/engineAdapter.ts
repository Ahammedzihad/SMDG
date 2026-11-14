/**
 * ORBITONE Engine Adapter
 *
 * The single architectural bridge between the frontend and the game engine.
 * Sync Point S3: Fully wired to the verified @shared engine.
 *
 * Implements the MissionEngineAPI and bridges frontend inputs to MissionDesign,
 * delegating all calculations, simulations, checks, and reports directly to @shared.
 */

import {
  computeMeters as sharedComputeMeters,
  runSimulation as sharedRunSimulation,
  scoreMission as sharedScoreMission,
  buildReport as sharedBuildReport,
  runAllChecks as sharedRunAllChecks,
  getCubesatClasses as sharedGetCubesatClasses,
  getObjectives as sharedGetObjectives,
  getOrbits as sharedGetOrbits,
  getVehicles as sharedGetVehicles,
  getParts as sharedGetParts,
  getRealMissions as sharedGetRealMissions,
  cubesatClasses as allCubesatClasses,
  orbits as allOrbits,
  vehicles as allVehicles,
  parts as allParts,
  total_mass_kg,
  power_generated_w,
  power_used_w,
  data_made_per_day_gb,
  data_sent_per_day_gb,
  cost_total_m
} from '@shared';

import type {
  CubeSatClass,
  MissionDesign,
  MissionValidationResult,
  Meters,
  Objective,
  Orbit,
  Part,
  RealMission,
  Report,
  ScoreBreakdown,
  SimResult,
  Vehicle
} from '@shared';

import {
  mockEngine,
  GAME_OPTIONS as MOCK_GAME_OPTIONS,
  INITIAL_CONFIG as MOCK_INITIAL_CONFIG,
  NASA_SAMPLE as MOCK_NASA_SAMPLE,
  evaluateMission as mockEvaluateMission
} from './mockEngine';

// Feature flag: set to true to use real @shared engine (Sync Point S3)
export const USE_REAL_ENGINE = true;

// ============================================================================
// Core Engine API (Shared Types)
// ============================================================================

export function computeMeters(design: MissionDesign): Meters {
  if (!USE_REAL_ENGINE) {
    return mockEngine.computeMeters(design);
  }
  return sharedComputeMeters(design);
}

export function runChecks(design: MissionDesign): MissionValidationResult {
  if (!USE_REAL_ENGINE) {
    return mockEngine.runChecks(design);
  }

  const safePartIds = design.part_ids ?? [];
  const resolvedParts = safePartIds
    .map((id) => allParts.find((p) => p.id === id))
    .filter((p): p is Part => p !== undefined);

  const cubesatClass = allCubesatClasses.find((c) => c.id === design.cubesat_class_id);
  const orbit = allOrbits.find((o) => o.id === design.orbit_id);
  const vehicle = allVehicles.find((v) => v.id === design.vehicle_id);

  if (!cubesatClass || !vehicle || !orbit) {
    return {
      passed: false,
      checks: [
        {
          id: 'configuration_complete',
          passed: false,
          reason: 'Mission configuration incomplete: class, orbit, and launch vehicle must be specified.',
          suggestedFix: 'Select an orbit, CubeSat class, and compatible launch vehicle.'
        }
      ],
      warnings: []
    };
  }

  const totalMass = total_mass_kg(resolvedParts.map((p) => p.mass), design.fuel_mass_kg ?? 0);
  const solarParts = resolvedParts.filter((p) => (p.solar_area_m2 ?? 0) > 0);
  const totalSolarArea = solarParts.reduce((sum, p) => sum + (p.solar_area_m2 ?? 0), 0);
  const solarEff = solarParts.length > 0 ? Math.max(...solarParts.map((p) => p.solar_efficiency_w_per_m2 ?? 220)) : 220;
  const powerGen = power_generated_w(totalSolarArea, solarEff, orbit.sunlight_fraction);
  const powerUse = power_used_w(resolvedParts.map((p) => p.power), design.duty_cycle ?? 1.0);

  const commsPart = resolvedParts.find((p) => p.category === 'comms');
  const antennaRate = commsPart?.downlink_rate_gb_per_min ?? 0.001;
  const dataSent = data_sent_per_day_gb(antennaRate, orbit.contact_min_per_day, design.link_efficiency ?? 1.0);

  const instruments = resolvedParts.filter((p) => p.category === 'instrument');
  const dataMade = data_made_per_day_gb(instruments.map((i) => i.data_rate), design.observe_time_fraction ?? 1.0);

  const buildCost = resolvedParts.reduce((sum, p) => sum + p.cost, 0);
  const opsCost = 0.02 * (design.lifetime_months ?? 12);
  const totalCost = cost_total_m(buildCost, vehicle.cost, opsCost, 1);
  const budget = design.budget_m ?? totalCost * 1.25;

  const result = sharedRunAllChecks({
    total_mass_kg: totalMass,
    cubesat_class: cubesatClass,
    vehicle,
    orbit_id: orbit.id,
    power_used_w: powerUse,
    power_generated_w: powerGen,
    cost_total_m: totalCost,
    budget_m: budget,
    data_sent_per_day_gb: dataSent,
    data_made_per_day_gb: dataMade
  });

  return {
    passed: result.passed,
    checks: result.checks,
    warnings: result.warnings
  };
}

export function runSimulation(design: MissionDesign, seed: number = 42, level: number = 1): SimResult {
  if (!USE_REAL_ENGINE) {
    return mockEngine.runSimulation(design, seed);
  }
  return sharedRunSimulation(design, seed, level);
}

export function scoreMission(simResult: SimResult, mode: 'solo' | 'team' = 'solo'): ScoreBreakdown {
  if (!USE_REAL_ENGINE) {
    return mockEngine.scoreMission(simResult, mode);
  }
  return sharedScoreMission(simResult, mode);
}

export function buildReport(simResult: SimResult, score?: ScoreBreakdown): Report {
  if (!USE_REAL_ENGINE) {
    return mockEngine.buildReport(simResult, score);
  }
  const effectiveScore = score || sharedScoreMission(simResult);
  return sharedBuildReport(simResult, effectiveScore);
}

export function getCubesatClasses(): CubeSatClass[] {
  return USE_REAL_ENGINE ? sharedGetCubesatClasses() : mockEngine.getCubesatClasses();
}

export function getObjectives(): Objective[] {
  return USE_REAL_ENGINE ? sharedGetObjectives() : mockEngine.getObjectives();
}

export function getOrbits(): Orbit[] {
  return USE_REAL_ENGINE ? sharedGetOrbits() : mockEngine.getOrbits();
}

export function getVehicles(): Vehicle[] {
  return USE_REAL_ENGINE ? sharedGetVehicles() : mockEngine.getVehicles();
}

export function getParts(): Part[] {
  return USE_REAL_ENGINE ? sharedGetParts() : mockEngine.getParts();
}

export function getRealMissions(): RealMission[] {
  return USE_REAL_ENGINE ? sharedGetRealMissions() : mockEngine.getRealMissions();
}

// ============================================================================
// Frontend Input Mapping & Integration
// ============================================================================

export function mapConfigToMissionDesign(config: {
  objective?: string;
  platform?: string;
  instrument?: string;
  power?: string;
  communications?: string;
  adcs?: string;
  orbit?: string;
  launch?: string;
}): MissionDesign {
  let cubesatClassId = '3U';
  if (config.platform === '6u-cubesat') {
    cubesatClassId = '6U';
  } else if (config.platform === '1u-cubesat') {
    cubesatClassId = '1U';
  } else if (config.platform === '2u-cubesat') {
    cubesatClassId = '2U';
  }

  let orbitId = 'sso';
  if (config.orbit === 'leo-400') {
    orbitId = 'leo';
  } else if (config.orbit === 'geo') {
    orbitId = 'geo';
  }

  let vehicleId = 'dedicated_light';
  if (config.launch === 'rideshare') {
    vehicleId = 'rideshare_dispenser';
  } else if (config.launch === 'heavy') {
    vehicleId = 'heavy_booster';
  }

  let objectiveId = 'earth_observation';
  if (config.objective === 'solar-radiation') {
    objectiveId = 'space_weather';
  }

  const partIds: string[] = [];

  // Structure
  partIds.push(cubesatClassId === '1U' ? 'struct_1u' : 'struct_3u');

  // Power
  if (config.power === 'body-mounted') {
    partIds.push('solar_body_1u');
  } else {
    partIds.push('solar_deployable_3u');
  }

  // Battery
  partIds.push(cubesatClassId === '1U' ? 'batt_liion_10wh' : 'batt_space_30wh');

  // Instrument
  if (config.instrument === 'spectrometer') {
    partIds.push('inst_plasma_probe');
  } else {
    partIds.push('inst_multispectral_imager');
  }

  // Comms
  if (config.communications === 'x-band') {
    partIds.push('comms_sband_patch');
  } else {
    partIds.push('comms_uhf_vhf');
  }

  // ADCS
  if (config.adcs === 'magnetorquer') {
    partIds.push('adcs_passive_magnetorquer');
  } else {
    partIds.push('adcs_3axis_wheels');
  }

  // Computer
  partIds.push('obc_rad_hard');

  return {
    cubesat_class_id: cubesatClassId,
    orbit_id: orbitId,
    vehicle_id: vehicleId,
    objective_id: objectiveId,
    part_ids: partIds,
    lifetime_months: 12,
    fuel_mass_kg: 0.1,
    budget_m: 65.0,
    duty_cycle: 0.8,
    observe_time_fraction: 0.5,
    link_efficiency: 0.95
  };
}

// ============================================================================
// Evaluator: Backwards Compatibility Bridge for Existing Landing Page UI
// ============================================================================

export interface ConstraintCheckView {
  id: string;
  label: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  pass: boolean;
  detail: string;
}

export interface MissionEvaluationSummary {
  constraints: ConstraintCheckView[];
  observation: {
    date: string;
    aod55: number;
  };
  failCount: number;
  passedCount: number;
  warnCount: number;
  totalMassKg: number;
  massLimitKg: number;
  massMarginKg: number;
  powerMarginW: number;
  totalLoadW: number;
  effectiveGenerationW: number;
  creditsRemaining: number;
  budgetReservePercent: number;
  totalCredits: number;
  dataFraction: number;
  dataReturnedMB: number;
  generatedMB: number;
  outcomeLevel: 'BASELINE_MET' | 'THRESHOLD_MET' | 'FAILED';
  scienceScore: number;
  objectiveComplete: boolean;
  explanations: string[];
  recommendations: string[];
  aerosolOpportunity: number;
  targetSignalReturned: number;
  nasaPrecedent: {
    name: string;
    agency: string;
    summary: string;
    url: string;
  };
  assumptions: string;
}

export function evaluateMission(config: any): MissionEvaluationSummary {
  if (!USE_REAL_ENGINE) {
    return mockEvaluateMission(config);
  }

  // Map frontend state to official shared MissionDesign
  const missionDesign = mapConfigToMissionDesign(config);

  // Execute authentic shared engine calculations
  const meters = computeMeters(missionDesign);
  const validation = runChecks(missionDesign);
  const sim = runSimulation(missionDesign, 42, 1);
  const score = scoreMission(sim, 'solo');
  const report = buildReport(sim, score);

  // Map constraint results into visual checklist format
  const constraints: ConstraintCheckView[] = [
    {
      id: 'mass',
      label: 'Spacecraft Mass Check (Launch Compatibility)',
      status: (meters.mass.state === 'ok' ? 'PASS' : meters.mass.state === 'warning' ? 'WARN' : 'FAIL'),
      pass: meters.mass.state !== 'fail',
      detail: meters.mass.why
    },
    {
      id: 'power',
      label: 'Power Balance & Generation Margin',
      status: (meters.power.state === 'ok' ? 'PASS' : meters.power.state === 'warning' ? 'WARN' : 'FAIL'),
      pass: meters.power.state !== 'fail',
      detail: meters.power.why
    },
    {
      id: 'budget',
      label: 'Total Cost vs Budget Reserve',
      status: (meters.budget.state === 'ok' ? 'PASS' : meters.budget.state === 'warning' ? 'WARN' : 'FAIL'),
      pass: meters.budget.state !== 'fail',
      detail: meters.budget.why
    },
    {
      id: 'downlink',
      label: 'Communications & Downlink Bandwidth',
      status: (meters.communications.state === 'ok' ? 'PASS' : meters.communications.state === 'warning' ? 'WARN' : 'FAIL'),
      pass: meters.communications.state !== 'fail',
      detail: meters.communications.why
    }
  ];

  // Append any specific hard check warnings or failures from shared checks
  for (const check of validation.checks) {
    if (!check.passed && !constraints.some((c) => c.id === check.id)) {
      constraints.push({
        id: check.id,
        label: check.id,
        status: 'FAIL',
        pass: false,
        detail: check.reason
      });
    }
  }

  const passedCount = constraints.filter((c) => c.status === 'PASS').length;
  const warnCount = constraints.filter((c) => c.status === 'WARN').length;
  const failCount = constraints.filter((c) => c.status === 'FAIL').length;

  const totalMassKg = meters.mass.value;
  const massLimitKg = meters.mass.limit;
  const massMarginKg = parseFloat((massLimitKg - totalMassKg).toFixed(2));

  const totalLoadW = meters.power.value;
  const effectiveGenerationW = meters.power.limit;
  const powerMarginW = parseFloat((effectiveGenerationW - totalLoadW).toFixed(2));

  const totalCostM = meters.budget.value;
  const budgetAllocationM = meters.budget.limit;
  const creditsRemaining = Math.max(0, Math.round((budgetAllocationM - totalCostM) * 10));
  const budgetReservePercent = Math.max(0, Math.round(((budgetAllocationM - totalCostM) / Math.max(1, budgetAllocationM)) * 100));

  const totalGeneratedMB = sim.data_generated_total_gb * 1024;
  const dataReturnedMB = sim.data_transmitted_total_gb * 1024;
  const dataFraction = totalGeneratedMB > 0 ? dataReturnedMB / totalGeneratedMB : 1.0;

  const selectedObservation = NASA_SAMPLE.values.find((v) => v.date === config.observationDate) || NASA_SAMPLE.values[2];

  const outcomeLevel: 'BASELINE_MET' | 'THRESHOLD_MET' | 'FAILED' =
    sim.outcome === 'baseline_met' ? 'BASELINE_MET' : sim.outcome === 'threshold_met' ? 'THRESHOLD_MET' : 'FAILED';

  const precedent = report.similar_real_mission
    ? {
        name: report.similar_real_mission.name,
        agency: report.similar_real_mission.organization,
        summary: report.similar_real_mission.description,
        url: report.similar_real_mission.source || 'https://science.nasa.gov/'
      }
    : {
        name: 'HARP (Hyper-Angular Rainbow Polarimeter)',
        agency: 'NASA / Earth Science Technology Office',
        summary: 'HARP proved that a 3U CubeSat carrying a wide-angle imaging polarimeter could observe aerosol particles and cloud droplets from low Earth orbit.',
        url: 'https://www.nasa.gov/mission/harp/'
      };

  return {
    constraints,
    observation: selectedObservation,
    failCount,
    passedCount,
    warnCount,
    totalMassKg,
    massLimitKg,
    massMarginKg,
    powerMarginW,
    totalLoadW,
    effectiveGenerationW,
    creditsRemaining,
    budgetReservePercent,
    totalCredits: Math.round(totalCostM * 10),
    dataFraction,
    dataReturnedMB,
    generatedMB: totalGeneratedMB > 0 ? totalGeneratedMB : 120.0,
    outcomeLevel,
    scienceScore: score.total,
    objectiveComplete: sim.outcome !== 'failure',
    explanations: report.why.length > 0 ? report.why : ['Nominal operational profile evaluated.'],
    recommendations: report.what_to_try_next,
    aerosolOpportunity: selectedObservation.aod55,
    targetSignalReturned: selectedObservation.aod55 * (outcomeLevel === 'BASELINE_MET' ? 0.95 : 0.6),
    nasaPrecedent: precedent,
    assumptions: sim.error ?? 'Simulation verified by ORBITONE shared rules engine (@orbitone/shared).'
  };
}

export const GAME_OPTIONS = MOCK_GAME_OPTIONS;
export const INITIAL_CONFIG = MOCK_INITIAL_CONFIG;
export const NASA_SAMPLE = MOCK_NASA_SAMPLE;
