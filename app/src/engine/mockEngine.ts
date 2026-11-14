/**
 * MOCK ENGINE FOR ORBITONE FRONTEND (TASK B1)
 *
 * Implements MissionEngineAPI with deterministic mock responses
 * adhering strictly to shapes in shared/src/types.ts.
 *
 * NOTE: All values here are educational mock/game-balance values,
 * not real flight telemetry or certified NASA flight calculations.
 */

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
import type { MissionEngineAPI } from './engineInterface';

// ============================================================================
// Verified Shared Types Mock Implementation
// ============================================================================

export const mockCubesatClasses: CubeSatClass[] = [
  {
    id: '1u',
    name: '1U CubeSat',
    mass_limit_kg: 1.33,
    height_mm: 113.5,
    source: 'NASA CubeSat 101 (2017) p.79',
    sources: { mass: 'CS101 p.79' },
    explanation: 'Standard 10 cm cube form factor for technology demonstration.'
  },
  {
    id: '2u',
    name: '2U CubeSat',
    mass_limit_kg: 2.66,
    height_mm: 227.0,
    source: 'NASA CubeSat 101 (2017) p.80',
    sources: { mass: 'CS101 p.80' },
    explanation: 'Double unit form factor offering moderate payload volume.'
  },
  {
    id: '3u',
    name: '3U CubeSat',
    mass_limit_kg: 4.0,
    height_mm: 340.5,
    source: 'NASA CubeSat 101 (2017) p.81',
    sources: { mass: 'CS101 p.81' },
    explanation: 'Standard 3-unit CubeSat configuration balancing mass and scientific payload capacity.'
  }
];

export const mockObjectives: Objective[] = [
  {
    id: 'earth_aerosol',
    name: 'Earth Atmosphere & Aerosol Science',
    description: 'Measure aerosol optical depth and cloud boundary layers to track particulate transport.',
    needs: ['polarimeter', 'high_downlink'],
    recommended_orbits: ['sso_500'],
    min_level: 1,
    target_data_gb_per_day: 1.5,
    baseline_science_target: 100,
    threshold_science_target: 60,
    baseline_science: 'Continuous daily imaging over maritime corridors with 90% completeness.',
    threshold_science: 'Regional daylight observations over landmass targets with 60% completeness.',
    critical_checklist_items: ['Payload Accommodation', 'Daylight Power Balance', 'Downlink Link Budget'],
    source: 'NASA SmallSat Institute (2025)',
    sources: { reference: 'SmallSat Institute Webinar' },
    explanation: 'Aerosol studies require sun-synchronous lighting for consistent optical measurements.'
  },
  {
    id: 'solar_monitoring',
    name: 'Solar UV & Flare Flare Activity',
    description: 'Monitor high-energy solar UV flux and coronal heating precursors.',
    needs: ['spectrometer', 'sun_pointing'],
    recommended_orbits: ['leo_400'],
    min_level: 1,
    target_data_gb_per_day: 0.8,
    baseline_science_target: 90,
    threshold_science_target: 50,
    baseline_science: 'Full solar disk UV spectral irradiance recording across daylight arcs.',
    threshold_science: 'Peak flare event detection and irradiance threshold logging.',
    critical_checklist_items: ['Attitude Pointing Accuracy', 'Detector Thermal Stability'],
    source: 'NASA Science Mission Directorate',
    sources: { reference: 'MinXSS precedent' },
    explanation: 'Requires uninterrupted line-of-sight pointing toward the solar disk during daylight passes.'
  }
];

export const mockOrbits: Orbit[] = [
  {
    id: 'leo_400',
    name: 'Low Earth Orbit (400 km)',
    altitude_km: 400,
    sunlight_fraction: 0.62,
    contact_min_per_day: 48,
    launch_energy: 1.0,
    lifetime_penalty: 0.95,
    manifest_flexibility: 'High',
    launch_period_days: 30,
    source: 'NASA Flight Dynamics',
    sources: { mechanics: 'Orbital Mechanics Primer' },
    explanation: 'High atmospheric drag accelerates decay; frequent ground contact passes with shorter duration.'
  },
  {
    id: 'sso_500',
    name: 'Sun-Synchronous Orbit (500 km)',
    altitude_km: 500,
    sunlight_fraction: 0.68,
    contact_min_per_day: 55,
    launch_energy: 1.15,
    lifetime_penalty: 1.0,
    manifest_flexibility: 'Medium',
    launch_period_days: 20,
    source: 'NASA Earth Science Division',
    sources: { mechanics: 'Goddard Mission Design Lab' },
    explanation: 'Consistent solar illumination angles provide stable radiometric calibration.'
  }
];

export const mockVehicles: Vehicle[] = [
  {
    id: 'rideshare_leo',
    name: 'Commercial Rideshare (LEO)',
    cost: 15.0,
    capacity_by_orbit: { leo_400: 450, sso_500: 380 },
    fairing_size: 'Standard secondary dispenser envelope',
    source: 'NASA CSLI (2017)',
    sources: { rideshare: 'CubeSat 101 Table 1' },
    explanation: 'Cost-effective ride as a secondary payload on a primary launcher.'
  },
  {
    id: 'dedicated_small',
    name: 'Dedicated Small Launcher',
    cost: 35.0,
    capacity_by_orbit: { leo_400: 220, sso_500: 180 },
    fairing_size: 'Dedicated payload dispenser',
    source: 'Commercial Launch Provider Guide',
    sources: { cost: 'Industry average game-balance figure' },
    explanation: 'Customized orbit insertion time and inclination at higher mission budget.'
  }
];

export const mockParts: Part[] = [
  {
    id: 'struct_3u',
    name: '3U Aluminum Primary Structure',
    category: 'structure',
    mass: 0.85,
    power: 0,
    cost: 5.0,
    data_rate: 0,
    level_unlocked: 1,
    requires: [],
    heritage: true,
    descopable: false,
    material: 'Aluminium 6061-T6',
    source: 'CubeSat 101 p.16',
    sources: { material: 'CS101 p.16' },
    explanation: 'Standard space-grade anodized aluminum chassis conforming to dispenser rails.'
  },
  {
    id: 'power_deployable',
    name: 'Deployable Solar Array (3-Panel)',
    category: 'power',
    mass: 0.65,
    power: -18.0, // negative represents net generation
    solar_area_m2: 0.12,
    solar_efficiency_w_per_m2: 150,
    cost: 8.0,
    data_rate: 0,
    level_unlocked: 1,
    requires: ['struct_3u'],
    heritage: true,
    descopable: false,
    material: 'Gallium Arsenide cells on composite substrate',
    source: 'JPL SmallSat Survey',
    sources: { heritage: 'TRL 8 flight heritage' },
    explanation: 'Articulated panels deploy post-insertion to provide daylight power generation.'
  },
  {
    id: 'battery_li_ion',
    name: '10Wh Lithium-Ion Battery Pack',
    category: 'battery',
    mass: 0.45,
    power: 0,
    capacity_wh: 10,
    cost: 4.5,
    data_rate: 0,
    level_unlocked: 1,
    requires: [],
    heritage: true,
    descopable: false,
    material: 'Hermetic pouch cells with protection circuit',
    source: 'CubeSat 101 p.70',
    sources: { safety: 'CS101 p.70' },
    explanation: 'Stores energy for eclipse operations; includes overcharge protection circuits.'
  },
  {
    id: 'comms_xband',
    name: 'X-Band Directional Patch Antenna',
    category: 'comms',
    mass: 0.35,
    power: 4.5,
    downlink_rate_gb_per_min: 0.05,
    cost: 6.0,
    data_rate: 0,
    level_unlocked: 1,
    requires: [],
    heritage: true,
    descopable: false,
    material: 'Microstrip patch on PTFE substrate',
    source: 'NASA SmallSat Comms Compendium',
    sources: { freq: 'X-band frequency allocation' },
    explanation: 'High-throughput downlink transmitter enabling science data dumps during passes.'
  },
  {
    id: 'inst_polarimeter',
    name: 'Multi-Angle Cloud & Aerosol Polarimeter',
    category: 'instrument',
    mass: 0.95,
    power: 5.2,
    cost: 14.0,
    data_rate: 0.08,
    level_unlocked: 1,
    requires: [],
    heritage: false,
    descopable: true,
    material: 'Optical barrel with fused silica lenses',
    source: 'NASA HARP Precedent',
    sources: { reference: 'HARP CubeSat scientific sensor' },
    explanation: 'Measures polarized daylight scattering to determine aerosol optical thickness.'
  }
];

export const mockRealMissions: RealMission[] = [
  {
    id: 'harp',
    name: 'HARP (Hyper-Angular Rainbow Polarimeter)',
    organization: 'NASA Goddard / UMBC',
    objective_type: 'Earth Atmosphere & Aerosol Science',
    size_class: '3U CubeSat',
    description: 'Measured microphysical properties of cloud droplets and atmospheric particles using a multi-angle imaging polarimeter.',
    source: 'NASA SmallSat Records',
    explanation: 'Demonstrated scientific-grade aerosol optical measurements from a CubeSat platform.'
  }
];

export class MockMissionEngine implements MissionEngineAPI {
  computeMeters(design: MissionDesign): Meters {
    const isOverMass = (design.fuel_mass_kg || 0) > 10;
    return {
      mass: {
        id: 'mass',
        label: 'Total Mass',
        value: 3.25,
        limit: 4.0,
        unit: 'kg',
        state: isOverMass ? 'fail' : 'ok',
        why: 'Total dry mass plus propellant must stay within 3U dispenser envelope.'
      },
      power: {
        id: 'power',
        label: 'Power Balance',
        value: 12.8,
        limit: 15.0,
        unit: 'W',
        state: 'ok',
        why: 'Effective generation exceeds combined instrument and avionics load.'
      },
      budget: {
        id: 'budget',
        label: 'Cost Budget',
        value: 48.5,
        limit: 65.0,
        unit: '$M',
        state: 'ok',
        why: 'Total mission cost includes hardware assembly, launch allocation, and operations.'
      },
      data: {
        id: 'data',
        label: 'Data Generated',
        value: 1.1,
        limit: 2.0,
        unit: 'GB/day',
        state: 'ok',
        why: 'Daily sensor generation rate matches onboard solid-state memory buffer.'
      },
      communications: {
        id: 'communications',
        label: 'Downlink Capacity',
        value: 1.4,
        limit: 1.1,
        unit: 'GB/day',
        state: 'ok',
        why: 'Ground contact duration is sufficient to empty onboard data buffer daily.'
      },
      time: {
        id: 'time',
        label: 'Mission Lifetime',
        value: 12,
        limit: 12,
        unit: 'months',
        state: 'ok',
        why: 'Nominal operational mission lifetime before orbital degradation.'
      }
    };
  }

  runChecks(_design: MissionDesign): MissionValidationResult {
    return {
      passed: true,
      checks: [
        {
          id: 'mass_limit',
          passed: true,
          reason: 'Spacecraft mass is 3.25 kg, within the 4.00 kg limit for 3U class.',
          suggestedFix: 'None required.'
        },
        {
          id: 'power_balance',
          passed: true,
          reason: 'Solar arrays generate 15.0 W in sunlight vs 12.8 W peak consumption.',
          suggestedFix: 'None required.'
        },
        {
          id: 'cost_budget',
          passed: true,
          reason: 'Mission cost is $48.5M vs $65.0M allocation (25% reserve).',
          suggestedFix: 'None required.'
        }
      ],
      warnings: [
        {
          id: 'margin_warning',
          passed: true,
          isWarning: true,
          reason: 'Mass margin is 18.7%, above minimum 15% Level 1 advisory threshold.',
          suggestedFix: 'Optional: consider descoping non-critical sensors for greater reserve.'
        }
      ]
    };
  }

  runSimulation(design: MissionDesign, _seed: number = 42): SimResult {
    return {
      outcome: 'baseline_met',
      timeline: [
        { month: 1, event: 'Orbit Insertion', description: 'Dispenser deployment and antenna array activation.' },
        { month: 2, event: 'First Science Light', description: 'Polarimeter calibration and solar alignment complete.' },
        { month: 6, event: 'Mid-Mission Review', description: '92% of target aerosol observation sequences completed.' },
        { month: 12, event: 'Mission Baseline Complete', description: 'Full science objective requirements achieved.' }
      ],
      series: {
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        power_w: [14.8, 14.5, 14.2, 14.0, 13.8, 13.5, 13.2, 13.0, 12.8, 12.6, 12.5, 12.4],
        data_stored_gb: [0.2, 0.4, 0.3, 0.5, 0.4, 0.3, 0.5, 0.4, 0.3, 0.4, 0.3, 0.2],
        budget_remaining_m: [16.5, 15.0, 13.5, 12.0, 10.5, 9.0, 7.5, 6.0, 4.5, 3.0, 1.5, 0.5],
        health: [100, 100, 98, 97, 95, 94, 93, 91, 90, 88, 86, 85]
      },
      events_applied: [],
      cause_tags: ['NOMINAL_FLIGHT', 'HIGH_SOLAR_EFFICIENCY'],
      science_collected: 94.5,
      data_generated_total_gb: 412.0,
      data_transmitted_total_gb: 408.5,
      data_lost_total_gb: 3.5,
      final_health: 85,
      lifetime_months: 12,
      design
    };
  }

  scoreMission(_simResult: SimResult, mode: 'solo' | 'team' = 'solo'): ScoreBreakdown {
    return {
      mission_success: 30,
      science_value: 20,
      resource_efficiency: 18,
      engineering_quality: 24, // includes coordination weight in solo
      team_coordination: mode === 'team' ? 14 : 0,
      total: 92,
      rank: 'Flight Director',
      mode
    };
  }

  buildReport(simResult: SimResult, score?: ScoreBreakdown): Report {
    const finalScore = score || this.scoreMission(simResult);
    return {
      result: 'baseline_met',
      timeline: simResult.timeline,
      series: simResult.series,
      why: [
        'Sun-synchronous orbit provided consistent optical observation angles across every daylight pass.',
        'Deployable solar array ensured positive energy balance through eclipse phases without battery exhaustion.',
        'High-bandwidth X-band transmitter enabled daily data clearance, preventing onboard buffer overflows.'
      ],
      what_to_try_next: [
        'Explore 2U chassis variant to reduce launch rideshare costs.',
        'Add secondary star tracker to optimize pointing accuracy during off-nadir observations.'
      ],
      top_risks: [
        {
          risk: 'Battery degradation over mission lifetime',
          likelihood: 2,
          consequence: 3,
          mitigation: 'Implement thermal control heater to prevent low-temperature cycling.'
        },
        {
          risk: 'Atmospheric drag causing premature orbital decay',
          likelihood: 1,
          consequence: 4,
          mitigation: 'Choose 500 km altitude over 400 km for 3-year ballistic orbital lifetime.'
        }
      ],
      similar_real_mission: mockRealMissions[0],
      score: finalScore,
      rank: finalScore.rank
    };
  }

  getCubesatClasses(): CubeSatClass[] {
    return mockCubesatClasses;
  }

  getObjectives(): Objective[] {
    return mockObjectives;
  }

  getOrbits(): Orbit[] {
    return mockOrbits;
  }

  getVehicles(): Vehicle[] {
    return mockVehicles;
  }

  getParts(): Part[] {
    return mockParts;
  }

  getRealMissions(): RealMission[] {
    return mockRealMissions;
  }
}

export const mockEngine = new MockMissionEngine();

// ============================================================================
// Legacy Landing Page Compatibility Layer
// ============================================================================

export const INITIAL_CONFIG = {
  objective: 'aerosol-transport',
  platform: '3u-cubesat',
  instrument: 'polarimeter',
  power: 'deployable-panels',
  communications: 'x-band',
  adcs: 'reaction-wheels',
  orbit: 'sso-500',
  launch: 'dedicated-small',
  observationDate: '2023-09-03'
};

export const NASA_SAMPLE = {
  parameter: 'AOD_55',
  provider: 'NASA Langley Research Center POWER Project',
  sourceProduct: 'CERES SYN1deg',
  units: 'dimensionless',
  latitude: 37.0,
  longitude: -76.0,
  samplePeriod: { start: '2023-09-01', end: '2023-09-07' },
  apiRequest: 'https://power.larc.nasa.gov/api/temporal/daily/point?parameters=AOD_55&community=SB&longitude=-76.0&latitude=37.0&start=20230901&end=20230907&format=JSON',
  values: [
    { date: '2023-09-01', aod55: 0.18 },
    { date: '2023-09-02', aod55: 0.24 },
    { date: '2023-09-03', aod55: 0.38 },
    { date: '2023-09-04', aod55: 0.29 },
    { date: '2023-09-05', aod55: 0.21 },
    { date: '2023-09-06', aod55: 0.16 },
    { date: '2023-09-07', aod55: 0.19 }
  ]
};

export const GAME_OPTIONS = {
  objectives: {
    'aerosol-transport': {
      id: 'aerosol-transport',
      name: 'Aerosol Transport & Air Quality',
      description: 'Track particulate plumes and optical depth variations using multi-angle polarization observations.',
      credits: 20,
      science: 95
    },
    'solar-radiation': {
      id: 'solar-radiation',
      name: 'Solar Spectral Irradiance',
      description: 'Measure variations in top-of-atmosphere solar flux to benchmark Earth radiation budgets.',
      credits: 15,
      science: 85
    }
  },
  platforms: {
    '3u-cubesat': {
      id: '3u-cubesat',
      name: '3U CubeSat Chassis',
      description: 'Standard 10×10×34 cm triple-unit chassis with space-grade aluminum rails.',
      massKg: 1.2,
      massLimitKg: 4.0,
      credits: 10
    },
    '6u-cubesat': {
      id: '6u-cubesat',
      name: '6U CubeSat Chassis',
      description: 'Expanded 6-unit chassis providing dual payload volume and enhanced thermal dissipation.',
      massKg: 2.1,
      massLimitKg: 8.0,
      credits: 18
    }
  },
  instruments: {
    polarimeter: {
      id: 'polarimeter',
      name: 'Multi-Angle Aerosol Polarimeter',
      description: 'Detects degree of linear polarization across three optical channels for aerosol sizing.',
      massKg: 0.95,
      loadW: 5.2,
      credits: 18
    },
    spectrometer: {
      id: 'spectrometer',
      name: 'Miniature UV/Vis Spectrometer',
      description: 'Dispersive grating spectrometer for atmospheric trace gas and ozone column retrieval.',
      massKg: 0.75,
      loadW: 4.1,
      credits: 14
    }
  },
  power: {
    'deployable-panels': {
      id: 'deployable-panels',
      name: 'Deployable GaAs Solar Wings',
      description: 'Articulated triple-junction solar panels generating 22W peak in full sunlight.',
      massKg: 0.65,
      generationW: 22.0,
      credits: 12
    },
    'body-mounted': {
      id: 'body-mounted',
      name: 'Body-Mounted Silicon Arrays',
      description: 'Low-mass body-mounted cells providing omnidirectional passive solar generation.',
      massKg: 0.35,
      generationW: 8.5,
      credits: 6
    }
  },
  communications: {
    'x-band': {
      id: 'x-band',
      name: 'X-Band Downlink Transmitter',
      description: 'Directional microstrip patch with 50 Mbps throughput to partner ground stations.',
      massKg: 0.35,
      powerW: 4.5,
      rateMbps: 50,
      credits: 10
    },
    's-band': {
      id: 's-band',
      name: 'S-Band Transceiver',
      description: 'Bi-directional telemetry and command transponder with global amateur network support.',
      massKg: 0.25,
      powerW: 2.5,
      rateMbps: 2,
      credits: 6
    }
  },
  adcs: {
    'reaction-wheels': {
      id: 'reaction-wheels',
      name: '3-Axis Reaction Wheels + Star Tracker',
      description: 'Precision pointing mechanism achieving arcsecond orientation for optical payloads.',
      massKg: 0.45,
      loadW: 2.2,
      credits: 12
    },
    'magnetorquer': {
      id: 'magnetorquer',
      name: 'Magnetic Torquer Rods',
      description: 'Passive-assist magnetic coils aligning to Earth field; zero moving parts.',
      massKg: 0.2,
      loadW: 0.8,
      credits: 5
    }
  },
  orbits: {
    'sso-500': {
      id: 'sso-500',
      name: 'Sun-Synchronous Orbit (500 km)',
      description: 'Fixed local solar time lighting; optimal for repeatable aerosol radiometry.',
      credits: 14
    },
    'leo-400': {
      id: 'leo-400',
      name: 'Low Inclination Orbit (400 km)',
      description: 'Low launch energy requirement with frequent equatorial ground station passes.',
      credits: 8
    }
  },
  launch: {
    'dedicated-small': {
      id: 'dedicated-small',
      name: 'Dedicated Small Rocket',
      description: 'Direct insertion into desired orbit plane with flexible launch window.',
      credits: 22
    },
    rideshare: {
      id: 'rideshare',
      name: 'Secondary Payload Rideshare',
      description: 'Shared deployment from an ISS resupply flight at reduced mission cost.',
      credits: 12
    }
  }
};

export function evaluateMission(config: any) {
  const chosenPlatform = (GAME_OPTIONS.platforms as any)[config.platform] || GAME_OPTIONS.platforms['3u-cubesat'];
  const chosenInstrument = (GAME_OPTIONS.instruments as any)[config.instrument] || GAME_OPTIONS.instruments.polarimeter;
  const chosenPower = (GAME_OPTIONS.power as any)[config.power] || GAME_OPTIONS.power['deployable-panels'];
  const chosenComms = (GAME_OPTIONS.communications as any)[config.communications] || GAME_OPTIONS.communications['x-band'];
  const chosenAdcs = (GAME_OPTIONS.adcs as any)[config.adcs] || GAME_OPTIONS.adcs['reaction-wheels'];
  const chosenOrbit = (GAME_OPTIONS.orbits as any)[config.orbit] || GAME_OPTIONS.orbits['sso-500'];
  const chosenLaunch = (GAME_OPTIONS.launch as any)[config.launch] || GAME_OPTIONS.launch['dedicated-small'];

  const totalMassKg = (chosenPlatform.massKg || 0) + (chosenInstrument.massKg || 0) + (chosenPower.massKg || 0) + (chosenComms.massKg || 0) + (chosenAdcs.massKg || 0);
  const massLimitKg = chosenPlatform.massLimitKg || 4.0;
  const massMarginKg = parseFloat((massLimitKg - totalMassKg).toFixed(2));

  const effectiveGenerationW = chosenPower.generationW || 15.0;
  const totalLoadW = (chosenInstrument.loadW || 0) + (chosenComms.powerW || 0) + (chosenAdcs.loadW || 0) + 2.0; // +2W avionics
  const powerMarginW = parseFloat((effectiveGenerationW - totalLoadW).toFixed(2));

  const totalCredits = (chosenPlatform.credits || 0) + (chosenInstrument.credits || 0) + (chosenPower.credits || 0) + (chosenComms.credits || 0) + (chosenAdcs.credits || 0) + (chosenOrbit.credits || 0) + (chosenLaunch.credits || 0);
  const maxCredits = 85;
  const creditsRemaining = maxCredits - totalCredits;
  const budgetReservePercent = Math.round((creditsRemaining / maxCredits) * 100);

  const rateMbps = chosenComms.rateMbps || 10;
  const generatedMB = 120.0;
  const dataReturnedMB = Math.min(generatedMB, generatedMB * (rateMbps > 5 ? 1.0 : 0.45));
  const dataFraction = dataReturnedMB / generatedMB;

  const selectedObservation = NASA_SAMPLE.values.find((v) => v.date === config.observationDate) || NASA_SAMPLE.values[2];

  const constraints = [
    {
      id: 'mass',
      label: 'Spacecraft Mass Check',
      status: (totalMassKg <= massLimitKg ? (massMarginKg >= 0.5 ? 'PASS' : 'WARN') : 'FAIL') as 'PASS' | 'WARN' | 'FAIL',
      pass: totalMassKg <= massLimitKg,
      detail: `Total wet mass ${totalMassKg.toFixed(2)} kg vs ${massLimitKg} kg limit (${massMarginKg >= 0 ? '+' : ''}${massMarginKg} kg margin).`
    },
    {
      id: 'power',
      label: 'Daylight Power Margin Check',
      status: (powerMarginW >= 0 ? (powerMarginW >= 3 ? 'PASS' : 'WARN') : 'FAIL') as 'PASS' | 'WARN' | 'FAIL',
      pass: powerMarginW >= 0,
      detail: `Generation ${effectiveGenerationW} W vs Load ${totalLoadW.toFixed(1)} W (Margin: ${powerMarginW > 0 ? '+' : ''}${powerMarginW} W).`
    },
    {
      id: 'budget',
      label: 'Cost Allocation Reserve',
      status: (creditsRemaining >= 0 ? (budgetReservePercent >= 10 ? 'PASS' : 'WARN') : 'FAIL') as 'PASS' | 'WARN' | 'FAIL',
      pass: creditsRemaining >= 0,
      detail: `${totalCredits} MC used of ${maxCredits} MC budget (${budgetReservePercent}% reserve remaining).`
    },
    {
      id: 'downlink',
      label: 'Telemetry Downlink Capacity',
      status: (dataFraction >= 0.8 ? 'PASS' : dataFraction >= 0.5 ? 'WARN' : 'FAIL') as 'PASS' | 'WARN' | 'FAIL',
      pass: dataFraction >= 0.5,
      detail: `${dataReturnedMB.toFixed(1)} MB returned of ${generatedMB} MB generated sample (${(dataFraction * 100).toFixed(0)}% returned).`
    }
  ];

  const passedCount = constraints.filter((c) => c.status === 'PASS').length;
  const warnCount = constraints.filter((c) => c.status === 'WARN').length;
  const failCount = constraints.filter((c) => c.status === 'FAIL').length;

  const objectiveComplete = failCount === 0;
  const outcomeLevel: 'BASELINE_MET' | 'THRESHOLD_MET' | 'FAILED' =
    failCount === 0 && warnCount === 0 ? 'BASELINE_MET' : failCount === 0 ? 'THRESHOLD_MET' : 'FAILED';

  const scienceScore = Math.max(0, Math.min(100, Math.round(passedCount * 22 + warnCount * 12 - failCount * 25 + (chosenInstrument.id === 'polarimeter' ? 12 : 5))));

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
    totalCredits,
    dataFraction,
    dataReturnedMB,
    generatedMB,
    outcomeLevel,
    scienceScore,
    objectiveComplete,
    explanations: [
      `Your mission operated in ${chosenOrbit.name} utilizing ${chosenPower.name}.`,
      powerMarginW >= 0
        ? 'Solar power generation exceeded instrument draw, maintaining positive battery reserves.'
        : 'Subsystem power draw exceeded solar generation capacity, causing battery depletion during operations.',
      dataFraction >= 0.8
        ? 'The high-capacity communication subsystem successfully delivered the targeted observation science telemetry.'
        : 'Bandwidth constraints on the communication channel caused data backlogs in onboard memory.'
    ],
    recommendations: [
      'Maintain at least 15% mass margin to accommodate launch vehicle dispenser integration tolerances.',
      'In Sun-synchronous orbits, ensure solar panel articulation matches beta angle variations over time.'
    ],
    aerosolOpportunity: selectedObservation.aod55,
    targetSignalReturned: selectedObservation.aod55 * (dataFraction >= 0.8 ? 0.98 : 0.5),
    nasaPrecedent: {
      name: 'HARP (Hyper-Angular Rainbow Polarimeter)',
      agency: 'NASA / Earth Science Technology Office',
      summary: 'HARP proved that a 3U CubeSat carrying a wide-angle imaging polarimeter could observe aerosol particles and cloud droplets from low Earth orbit.',
      url: 'https://www.nasa.gov/mission/harp/'
    },
    assumptions: 'Educational model parameters. Not certified flight telemetry.'
  };
}

