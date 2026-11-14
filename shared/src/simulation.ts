/**
 * Deterministic mission simulation for ORBITONE.
 * Simulates month-by-month power balance, eclipse battery discharge, data generation,
 * storage buffer accumulation/overflow, random events, and science collection.
 */

import {
  EVENT_PROBABILITY_L1,
  EVENT_PROBABILITY_L2,
  EVENT_PROBABILITY_L3
} from './config/balance.js';
import {
  cubesatClasses,
  events as allEvents,
  objectives,
  orbits,
  parts as allParts,
  vehicles
} from './data.js';
import {
  data_made_per_day_gb,
  data_sent_per_day_gb,
  power_generated_w,
  power_used_w
} from './formulas.js';
import { runAllChecks } from './checks.js';
import { createRNG } from './rng.js';
import type {
  EventApplied,
  MissionDesign,
  MonthlySeries,
  Objective,
  Orbit,
  Part,
  SimResult,
  TimelineEntry,
  Vehicle
} from './types.js';

/**
 * Validates whether the design is safe and physically legal to simulate.
 * Returns null if valid, or a descriptive error message if invalid.
 */
function validateDesignForSimulation(
  design: MissionDesign
): { valid: boolean; error?: string; cause_tags: string[] } {
  if (!design) {
    return { valid: false, error: 'No mission design provided.', cause_tags: ['INVALID_DESIGN'] };
  }

  // Check lifetime
  if (design.lifetime_months === undefined || design.lifetime_months <= 0) {
    return {
      valid: false,
      error: `Invalid lifetime (${design.lifetime_months} months): must be at least 1 month.`,
      cause_tags: ['INVALID_DESIGN', 'ZERO_LIFETIME']
    };
  }

  // Check negative numbers
  if (
    (design.budget_m !== undefined && design.budget_m < 0) ||
    (design.fuel_mass_kg !== undefined && design.fuel_mass_kg < 0) ||
    (design.duty_cycle !== undefined && design.duty_cycle < 0) ||
    (design.observe_time_fraction !== undefined && design.observe_time_fraction < 0) ||
    (design.link_efficiency !== undefined && design.link_efficiency < 0)
  ) {
    return {
      valid: false,
      error: 'Negative values are not permitted in mission design parameters.',
      cause_tags: ['INVALID_DESIGN', 'NEGATIVE_INPUTS']
    };
  }

  // Check presence in database
  const orbit = orbits.find((o) => o.id === design.orbit_id);
  if (!orbit) {
    return {
      valid: false,
      error: `Target orbit "${design.orbit_id}" not found in database.`,
      cause_tags: ['INVALID_DESIGN', 'MISSING_ORBIT_DATA']
    };
  }

  const vehicle = vehicles.find((v) => v.id === design.vehicle_id);
  if (!vehicle) {
    return {
      valid: false,
      error: `Launch vehicle "${design.vehicle_id}" not found in database.`,
      cause_tags: ['INVALID_DESIGN', 'MISSING_VEHICLE_DATA']
    };
  }

  const cubesatClass = cubesatClasses.find((c) => c.id === design.cubesat_class_id);
  if (!cubesatClass) {
    return {
      valid: false,
      error: `CubeSat class "${design.cubesat_class_id}" not found in database.`,
      cause_tags: ['INVALID_DESIGN', 'MISSING_CLASS_DATA']
    };
  }

  // Run hard checks
  const resolvedParts = (design.part_ids ?? [])
    .map((id) => allParts.find((p) => p.id === id))
    .filter((p): p is Part => p !== undefined);

  const totalMass = resolvedParts.reduce((sum, p) => sum + p.mass, 0) + (design.fuel_mass_kg ?? 0);
  const totalBuildCost = resolvedParts.reduce((sum, p) => sum + p.cost, 0);
  const opsCostPerMonth = 0.02; // Game standard ops cost
  const totalCost = totalBuildCost + vehicle.cost + opsCostPerMonth * design.lifetime_months;
  const budget = design.budget_m ?? totalCost * 1.2;

  const solarParts = resolvedParts.filter((p) => (p.solar_area_m2 ?? 0) > 0);
  const totalSolarArea = solarParts.reduce((sum, p) => sum + (p.solar_area_m2 ?? 0), 0);
  const solarEff = solarParts.length > 0
    ? Math.max(...solarParts.map((p) => p.solar_efficiency_w_per_m2 ?? 220))
    : 220;

  const powerGen = power_generated_w(totalSolarArea, solarEff, orbit.sunlight_fraction);
  const powerUse = power_used_w(resolvedParts.map((p) => p.power), design.duty_cycle ?? 1.0);

  const commsPart = resolvedParts.find((p) => p.category === 'comms');
  const antennaRate = commsPart?.downlink_rate_gb_per_min ?? 0.001;
  const dataSent = data_sent_per_day_gb(antennaRate, orbit.contact_min_per_day, design.link_efficiency ?? 1.0);

  const instruments = resolvedParts.filter((p) => p.category === 'instrument');
  const dataMade = data_made_per_day_gb(instruments.map((i) => i.data_rate), design.observe_time_fraction ?? 1.0);

  const checkResults = runAllChecks({
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

  if (!checkResults.passed) {
    const failedHard = checkResults.checks.filter((c) => !c.passed && !c.isWarning);
    const reasons = failedHard.map((c) => c.reason).join(' ');
    const tags = failedHard.map((c) => `CHECK_FAILED_${c.id.toUpperCase()}`);
    return {
      valid: false,
      error: `Pre-launch hard check failed: ${reasons}`,
      cause_tags: ['INVALID_DESIGN', ...tags]
    };
  }

  return { valid: true, cause_tags: [] };
}

/**
 * Runs a deterministic mission simulation over the planned lifetime.
 *
 * @param design Mission design configuration.
 * @param seed RNG seed (number or string).
 * @param level Difficulty level (1 = Office Hours, 2 = Trade Study, 3 = Point Design).
 * @returns SimResult with series, timeline, events, and outcome.
 */
export function runSimulation(
  design: MissionDesign,
  seed: number | string = 42,
  level: number = 1
): SimResult {
  // Edge case check: invalid design handling
  const validation = validateDesignForSimulation(design);
  if (!validation.valid) {
    const errorMsg = validation.error ?? 'Invalid mission design.';
    return {
      outcome: 'failure',
      timeline: [
        {
          month: 0,
          event: 'Pre-launch Validation Failed',
          description: errorMsg
        }
      ],
      series: {
        months: [0],
        power_w: [0],
        data_stored_gb: [0],
        budget_remaining_m: [0],
        health: [0]
      },
      events_applied: [],
      cause_tags: validation.cause_tags,
      science_collected: 0,
      data_generated_total_gb: 0,
      data_transmitted_total_gb: 0,
      data_lost_total_gb: 0,
      final_health: 0,
      lifetime_months: design?.lifetime_months ?? 0,
      design,
      error: errorMsg
    };
  }

  const rng = createRNG(seed);
  const lifetime = design.lifetime_months!;

  // Resolve target objects
  const orbit = orbits.find((o) => o.id === design.orbit_id)!;
  const vehicle = vehicles.find((v) => v.id === design.vehicle_id)!;
  const cubesatClass = cubesatClasses.find((c) => c.id === design.cubesat_class_id)!;
  const objective = objectives.find((o) => o.id === design.objective_id) ?? objectives[0];

  const resolvedParts = (design.part_ids ?? [])
    .map((id) => allParts.find((p) => p.id === id))
    .filter((p): p is Part => p !== undefined);

  // Subsystem properties
  const solarParts = resolvedParts.filter((p) => (p.solar_area_m2 ?? 0) > 0);
  const totalSolarArea = solarParts.reduce((sum, p) => sum + (p.solar_area_m2 ?? 0), 0);
  const solarEff = solarParts.length > 0
    ? Math.max(...solarParts.map((p) => p.solar_efficiency_w_per_m2 ?? 220))
    : 220;

  const batteryParts = resolvedParts.filter((p) => (p.capacity_wh ?? 0) > 0);
  const totalBatteryCapacityWh = batteryParts.reduce((sum, p) => sum + (p.capacity_wh ?? 0), 0);

  // Storage buffer capacity: COTS MCU = 4 GB, Rad-Hard = 32 GB, fallback = 4 GB
  const computerPart = resolvedParts.find((p) => p.category === 'computer');
  const storageCapGb = computerPart?.id === 'obc_rad_hard' ? 32.0 : 4.0;

  // Comms and data rates
  const commsPart = resolvedParts.find((p) => p.category === 'comms');
  const antennaRateGbPerMin = commsPart?.downlink_rate_gb_per_min ?? 0.001;
  const baseDailyDownlinkGb = data_sent_per_day_gb(
    antennaRateGbPerMin,
    orbit.contact_min_per_day,
    design.link_efficiency ?? 1.0
  );

  const instrumentParts = resolvedParts.filter((p) => p.category === 'instrument');
  const baseDailyDataMadeGb = data_made_per_day_gb(
    instrumentParts.map((i) => i.data_rate),
    design.observe_time_fraction ?? 1.0
  );

  const basePowerUse = power_used_w(resolvedParts.map((p) => p.power), design.duty_cycle ?? 1.0);
  const basePowerGen = power_generated_w(totalSolarArea, solarEff, orbit.sunlight_fraction);

  // Eclipses calculation:
  // LEO period ~92 min (1.53 hr), eclipse fraction = 1 - sunlight_fraction
  const orbitPeriodHours = orbit.id === 'geo' ? 24.0 : orbit.id === 'high_energy' ? 72.0 : 1.54;
  const eclipseHours = orbitPeriodHours * Math.max(0, 1.0 - orbit.sunlight_fraction);
  const energyNeededPerEclipseWh = basePowerUse * eclipseHours;

  const isBatteryUndersized = totalBatteryCapacityWh < energyNeededPerEclipseWh;

  // Budget setup
  const totalBuildCost = resolvedParts.reduce((sum, p) => sum + p.cost, 0);
  const opsCostPerMonth = 0.02;
  const initialBudget = design.budget_m ?? totalBuildCost + vehicle.cost + opsCostPerMonth * lifetime * 1.2;
  let remainingBudget = initialBudget - (totalBuildCost + vehicle.cost);

  // Simulation state tracking
  let currentStorageGb = 0.0;
  let currentHealth = 100.0;
  let totalDataGeneratedGb = 0.0;
  let totalDataTransmittedGb = 0.0;
  let totalDataLostGb = 0.0;
  let sciencePoints = 0.0;

  const series: MonthlySeries = {
    months: [],
    power_w: [],
    data_stored_gb: [],
    budget_remaining_m: [],
    health: []
  };

  const timeline: TimelineEntry[] = [
    {
      month: 1,
      event: 'Launch and Orbit Insertion',
      description: `Spacecraft launched aboard ${vehicle.name} into ${orbit.name}. Subsystems initialized.`
    }
  ];

  const eventsApplied: EventApplied[] = [];
  const causeTags = new Set<string>();

  // Determine event probability by level
  const eventProb = level === 1
    ? EVENT_PROBABILITY_L1
    : level === 2
      ? EVENT_PROBABILITY_L2
      : EVENT_PROBABILITY_L3;

  // Monthly simulation loop
  for (let month = 1; month <= lifetime; month++) {
    let monthlyPowerMultiplier = 1.0;
    let monthlyDataRateMultiplier = 1.0;
    let monthlyDownlinkMultiplier = 1.0;
    let monthlyOpsCost = opsCostPerMonth;

    // Check battery eclipse performance
    if (isBatteryUndersized && orbit.sunlight_fraction < 0.90) {
      causeTags.add('UNDERSIZED_BATTERY_LEO');
      // Instruments shut down during eclipses, reducing science throughput
      monthlyDataRateMultiplier *= orbit.sunlight_fraction;
      monthlyPowerMultiplier *= orbit.sunlight_fraction;
      currentHealth = Math.max(0, currentHealth - 1.5);
    }

    // Check random events for this month
    if (eventProb > 0 && rng.next() < eventProb) {
      const eligibleEvents = allEvents.filter((e) => e.min_level <= level);
      if (eligibleEvents.length > 0) {
        const eventIdx = rng.nextInt(0, eligibleEvents.length - 1);
        const selectedEvent = eligibleEvents[eventIdx];

        if (selectedEvent.id === 'solar_storm') {
          const hasRadHardOBC = resolvedParts.some((p) => p.id === 'obc_rad_hard');
          if (!hasRadHardOBC) {
            monthlyDataRateMultiplier *= 0.75;
            currentHealth = Math.max(0, currentHealth - 10.0);
            causeTags.add('SOLAR_STORM_COTS_REBOOT');
            eventsApplied.push({
              event_id: selectedEvent.id,
              month,
              name: selectedEvent.name,
              cause: 'Solar coronal mass ejection caused single-event upsets in the unshielded COTS flight computer, triggering emergency processor reboots.',
              mitigation_hint: 'Upgrade to a radiation-hardened flight computer (Rad-Hard SoC) to maintain continuous uptime during solar particle events.'
            });
            timeline.push({
              month,
              event: selectedEvent.name,
              description: 'COTS processor rebooted due to solar radiation particle spike. Payload data collection paused.'
            });
          }
        } else if (selectedEvent.id === 'ground_station_outage') {
          // Downlink blocked for 24h (~3.3% of month)
          monthlyDownlinkMultiplier *= 0.90;
          eventsApplied.push({
            event_id: selectedEvent.id,
            month,
            name: selectedEvent.name,
            cause: 'Severe weather and antenna maintenance disabled the primary ground station for 24 hours, buffering observations onboard.',
            mitigation_hint: 'Add onboard memory capacity to buffer observation data safely during ground station network outages.'
          });
          timeline.push({
            month,
            event: selectedEvent.name,
            description: 'Ground station maintenance pass outage. Data buffered in onboard memory.'
          });
        } else if (selectedEvent.id === 'launch_delay') {
          monthlyOpsCost += 0.03;
          causeTags.add('LAUNCH_DELAY_BUDGET_STRAIN');
          eventsApplied.push({
            event_id: selectedEvent.id,
            month,
            name: selectedEvent.name,
            cause: 'Primary customer payload integration slipped the rideshare launch schedule by 30 days, consuming reserve operations funding.',
            mitigation_hint: 'Maintain at least a 10% budget reserve to cushion against launch provider manifesting slips.'
          });
          timeline.push({
            month,
            event: selectedEvent.name,
            description: 'Launch window slip absorbed additional ground operations funding.'
          });
        } else if (selectedEvent.id === 'atmospheric_drag_surge') {
          if (orbit.id === 'leo') {
            currentHealth = Math.max(0, currentHealth - 12.0);
            causeTags.add('ATMOSPHERIC_DRAG_DECAY');
            eventsApplied.push({
              event_id: selectedEvent.id,
              month,
              name: selectedEvent.name,
              cause: 'Geomagnetic storm heating caused upper atmosphere expansion, increasing drag on the low-altitude orbit.',
              mitigation_hint: 'Choose a higher orbit like Sun-Synchronous Orbit (SSO) or equip micro-propulsion for drag compensation.'
            });
            timeline.push({
              month,
              event: selectedEvent.name,
              description: 'Thermospheric density spike induced drag deceleration and altitude loss.'
            });
          }
        } else if (selectedEvent.id === 'instrument_thermal_drift') {
          const hasNonHeritageInstrument = instrumentParts.some((p) => !p.heritage);
          if (hasNonHeritageInstrument) {
            monthlyDataRateMultiplier *= 0.80;
            causeTags.add('THERMAL_DRIFT_NON_HERITAGE');
            eventsApplied.push({
              event_id: selectedEvent.id,
              month,
              name: selectedEvent.name,
              cause: 'Repeated orbital day-night thermal transitions caused thermal drift in unproven non-heritage sensor optics.',
              mitigation_hint: 'Select flight-proven instruments with flight heritage or add autonomous thermal recalibration routines.'
            });
            timeline.push({
              month,
              event: selectedEvent.name,
              description: 'Non-heritage instrument experienced thermal cycling sensor drift.'
            });
          }
        }
      }
    }

    // Monthly data calculations (30 days/month)
    const monthDataMade = baseDailyDataMadeGb * 30 * monthlyDataRateMultiplier;
    const monthDownlinkCap = baseDailyDownlinkGb * 30 * monthlyDownlinkMultiplier;

    totalDataGeneratedGb += monthDataMade;

    // Buffer accumulation and storage cap check
    const totalDataToStore = currentStorageGb + monthDataMade;
    let dataTransmittedThisMonth = 0.0;
    let dataLostThisMonth = 0.0;

    if (totalDataToStore > storageCapGb) {
      // Data exceeds storage capacity: overflow occurs!
      const overflow = totalDataToStore - storageCapGb;
      dataLostThisMonth = overflow;
      totalDataLostGb += overflow;
      causeTags.add('STORAGE_OVERFLOW_DATA_LOST');

      // Send whatever is buffered up to downlink cap
      dataTransmittedThisMonth = Math.min(storageCapGb, monthDownlinkCap);
      currentStorageGb = Math.max(0, storageCapGb - dataTransmittedThisMonth);
    } else {
      // Buffer fits in storage
      dataTransmittedThisMonth = Math.min(totalDataToStore, monthDownlinkCap);
      currentStorageGb = Math.max(0, totalDataToStore - dataTransmittedThisMonth);
    }

    totalDataTransmittedGb += dataTransmittedThisMonth;

    // Science collection scales directly with successfully transmitted data
    // (lost data produces no science!)
    const targetMonthlyData = (objective.target_data_gb_per_day ?? 2.0) * 30;
    const scienceRatio = targetMonthlyData > 0
      ? Math.min(1.5, dataTransmittedThisMonth / targetMonthlyData)
      : 0;
    const monthlySciencePoints = ((objective.baseline_science_target ?? 100.0) / lifetime) * scienceRatio;
    sciencePoints += monthlySciencePoints;

    // Budget tracking
    remainingBudget = Math.max(0, remainingBudget - monthlyOpsCost);

    // Record series data
    series.months.push(month);
    series.power_w.push(Number((basePowerGen * monthlyPowerMultiplier).toFixed(2)));
    series.data_stored_gb.push(Number(currentStorageGb.toFixed(3)));
    series.budget_remaining_m.push(Number(remainingBudget.toFixed(3)));
    series.health.push(Number(currentHealth.toFixed(1)));

    // Check for catastrophic health loss
    if (currentHealth <= 0) {
      timeline.push({
        month,
        event: 'Loss of Mission',
        description: 'Spacecraft health depleted. Subsystems became unrecoverable.'
      });
      break;
    }
  }

  // Final timeline entry
  if (currentHealth > 0) {
    timeline.push({
      month: lifetime,
      event: 'End of Planned Mission',
      description: `Completed ${lifetime} months of orbital operations. Science payload decommissioned.`
    });
  }

  // Determine outcome
  const baselineTarget = objective.baseline_science_target ?? 100.0;
  const thresholdTarget = objective.threshold_science_target ?? 30.0;

  let outcome: 'failure' | 'threshold_met' | 'baseline_met';
  if (currentHealth <= 0) {
    outcome = 'failure';
    causeTags.add('LOSS_OF_SPACECRAFT_HEALTH');
  } else if (sciencePoints >= baselineTarget) {
    outcome = 'baseline_met';
    causeTags.add('BASELINE_SCIENCE_ACHIEVED');
  } else if (sciencePoints >= thresholdTarget) {
    outcome = 'threshold_met';
    causeTags.add('THRESHOLD_SCIENCE_ACHIEVED');
  } else {
    outcome = 'failure';
    causeTags.add('INSUFFICIENT_SCIENCE_COLLECTED');
  }

  if (causeTags.size === 0) {
    causeTags.add('BALANCED_DESIGN');
  }

  return {
    outcome,
    timeline,
    series,
    events_applied: eventsApplied,
    cause_tags: Array.from(causeTags),
    science_collected: Number(sciencePoints.toFixed(2)),
    data_generated_total_gb: Number(totalDataGeneratedGb.toFixed(3)),
    data_transmitted_total_gb: Number(totalDataTransmittedGb.toFixed(3)),
    data_lost_total_gb: Number(totalDataLostGb.toFixed(3)),
    final_health: Number(currentHealth.toFixed(1)),
    lifetime_months: lifetime,
    design
  };
}
