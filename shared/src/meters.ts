/**
 * Resource meters engine for ORBITONE.
 * Computes the six core mission resource meters (mass, power, budget, data,
 * communications, time) with green/yellow/red status and plain-language why explanations.
 */

import { BUDGET_RESERVE_MIN, TECH_MARGIN_L1 } from './config/balance.js';
import { cubesatClasses, orbits, parts as allParts, vehicles } from './data.js';
import {
  cost_total_m,
  data_made_per_day_gb,
  data_sent_per_day_gb,
  margin,
  power_generated_w,
  power_used_w,
  total_mass_kg
} from './formulas.js';
import type {
  MeterItem,
  Meters,
  MeterState,
  MissionDesign,
  Part
} from './types.js';

/**
 * Computes the six resource meters for a given mission design.
 * Safely handles incomplete or invalid designs by returning 'fail' meters without throwing.
 *
 * @param design Mission design configuration.
 * @returns Meters object containing mass, power, budget, data, communications, time.
 */
export function computeMeters(design: MissionDesign): Meters {
  // Safe defaults for empty or incomplete designs
  const safePartIds = design?.part_ids ?? [];
  const resolvedParts = safePartIds
    .map((id) => allParts.find((p) => p.id === id))
    .filter((p): p is Part => p !== undefined);

  const cubesatClass = cubesatClasses.find((c) => c.id === design?.cubesat_class_id);
  const orbit = orbits.find((o) => o.id === design?.orbit_id);
  const vehicle = vehicles.find((v) => v.id === design?.vehicle_id);

  // --------------------------------------------------------------------------
  // 1. MASS METER
  // --------------------------------------------------------------------------
  let massMeter: MeterItem;
  if (!cubesatClass || !vehicle || !orbit || resolvedParts.length === 0) {
    const totalMass = total_mass_kg(resolvedParts.map((p) => p.mass), design?.fuel_mass_kg ?? 0);
    massMeter = {
      id: 'mass',
      label: 'Mass',
      value: Number(totalMass.toFixed(2)),
      limit: cubesatClass ? cubesatClass.mass_limit_kg : (vehicle?.capacity_by_orbit?.[orbit?.id ?? ''] ?? 0),
      unit: 'kg',
      state: 'fail',
      why: 'Spacecraft mass cannot be verified because the structure, launch vehicle, or target orbit is missing, preventing launch clearance.'
    };
  } else {
    const totalMass = total_mass_kg(resolvedParts.map((p) => p.mass), design?.fuel_mass_kg ?? 0);
    const vehicleCap = vehicle.capacity_by_orbit?.[orbit.id] ?? 0;
    const massLimit = Math.min(cubesatClass.mass_limit_kg, vehicleCap > 0 ? vehicleCap : cubesatClass.mass_limit_kg);
    const massMarginVal = margin(totalMass, massLimit);

    let state: MeterState;
    let why: string;

    if (massLimit <= 0 || totalMass > massLimit) {
      state = 'fail';
      why = `Total spacecraft mass of ${totalMass.toFixed(2)} kg exceeds the ${massLimit.toFixed(2)} kg limit, so the launch vehicle cannot lift it.`;
    } else if (massMarginVal < TECH_MARGIN_L1) {
      state = 'warning';
      const pct = Math.round(massMarginVal * 100);
      why = `Mass margin of ${pct}% is below the 15% threshold, trading payload capacity against risk of launch vehicle mass penalty.`;
    } else {
      state = 'ok';
      why = `Spacecraft mass of ${totalMass.toFixed(2)} kg is within the ${massLimit.toFixed(2)} kg limit, trading payload mass against safe launch vehicle structural margin.`;
    }

    massMeter = {
      id: 'mass',
      label: 'Mass',
      value: Number(totalMass.toFixed(2)),
      limit: Number(massLimit.toFixed(2)),
      unit: 'kg',
      state,
      why
    };
  }

  // --------------------------------------------------------------------------
  // 2. POWER METER
  // --------------------------------------------------------------------------
  let powerMeter: MeterItem;
  const solarParts = resolvedParts.filter((p) => (p.solar_area_m2 ?? 0) > 0);
  const totalSolarArea = solarParts.reduce((sum, p) => sum + (p.solar_area_m2 ?? 0), 0);
  const solarEff = solarParts.length > 0
    ? Math.max(...solarParts.map((p) => p.solar_efficiency_w_per_m2 ?? 220))
    : 220;

  if (!orbit || solarParts.length === 0 || resolvedParts.length === 0) {
    const powerUse = power_used_w(resolvedParts.map((p) => p.power), design?.duty_cycle ?? 1.0);
    powerMeter = {
      id: 'power',
      label: 'Power',
      value: Number(powerUse.toFixed(2)),
      limit: 0,
      unit: 'W',
      state: 'fail',
      why: 'Power generation is zero because no solar panels or target orbit lighting are configured, so payload instruments cannot operate.'
    };
  } else {
    const powerGen = power_generated_w(totalSolarArea, solarEff, orbit.sunlight_fraction);
    const powerUse = power_used_w(resolvedParts.map((p) => p.power), design?.duty_cycle ?? 1.0);
    const powerMarginVal = margin(powerUse, powerGen);

    let state: MeterState;
    let why: string;

    if (powerGen <= 0 || powerUse > powerGen) {
      state = 'fail';
      why = `Power consumption of ${powerUse.toFixed(2)} W exceeds generated power of ${powerGen.toFixed(2)} W, so instruments must shut off.`;
    } else if (powerMarginVal < TECH_MARGIN_L1) {
      state = 'warning';
      const pct = Math.round(powerMarginVal * 100);
      why = `Power margin of ${pct}% is below the 15% threshold, trading instrument duty cycle against risk of orbital battery brownouts.`;
    } else {
      state = 'ok';
      why = `Power generation of ${powerGen.toFixed(2)} W reliably covers the ${powerUse.toFixed(2)} W consumption, trading solar array mass against continuous instrument uptime.`;
    }

    powerMeter = {
      id: 'power',
      label: 'Power',
      value: Number(powerUse.toFixed(2)),
      limit: Number(powerGen.toFixed(2)),
      unit: 'W',
      state,
      why
    };
  }

  // --------------------------------------------------------------------------
  // 3. BUDGET METER
  // --------------------------------------------------------------------------
  let budgetMeter: MeterItem;
  const buildCost = resolvedParts.reduce((sum, p) => sum + p.cost, 0);
  const launchCost = vehicle?.cost ?? 0;
  const opsCostPerMonth = 0.02;
  const lifetime = design?.lifetime_months ?? 0;
  const totalCost = cost_total_m(buildCost, launchCost, opsCostPerMonth, lifetime);
  const budget = design?.budget_m ?? 0;

  if (budget <= 0 || !vehicle || lifetime <= 0) {
    budgetMeter = {
      id: 'budget',
      label: 'Budget',
      value: Number(totalCost.toFixed(3)),
      limit: Number(budget.toFixed(3)),
      unit: '$M',
      state: 'fail',
      why: 'Mission lifecycle cost cannot be cleared because the budget, launch vehicle, or operations duration is unspecified.'
    };
  } else {
    const budgetMarginVal = margin(totalCost, budget);

    let state: MeterState;
    let why: string;

    if (totalCost > budget) {
      state = 'fail';
      why = `Total mission cost of $${totalCost.toFixed(3)}M exceeds the $${budget.toFixed(3)}M budget, so the mission cannot launch.`;
    } else if (budgetMarginVal < BUDGET_RESERVE_MIN) {
      state = 'warning';
      const pct = Math.round(budgetMarginVal * 100);
      why = `Remaining budget reserve of ${pct}% is below the mandatory 10% reserve, trading component quality against financial contingency cushion.`;
    } else {
      state = 'ok';
      why = `Total mission cost of $${totalCost.toFixed(3)}M preserves the required 10% financial reserve within the $${budget.toFixed(3)}M budget, trading initial part costs against fiscal resilience.`;
    }

    budgetMeter = {
      id: 'budget',
      label: 'Budget',
      value: Number(totalCost.toFixed(3)),
      limit: Number(budget.toFixed(3)),
      unit: '$M',
      state,
      why
    };
  }

  // --------------------------------------------------------------------------
  // 4. DATA METER
  // --------------------------------------------------------------------------
  let dataMeter: MeterItem;
  const instruments = resolvedParts.filter((p) => p.category === 'instrument');
  const computer = resolvedParts.find((p) => p.category === 'computer');
  const storageCap = computer?.id === 'obc_rad_hard' ? 32.0 : 4.0;
  const dataMade = data_made_per_day_gb(
    instruments.map((i) => i.data_rate),
    design?.observe_time_fraction ?? 1.0
  );

  if (instruments.length === 0) {
    dataMeter = {
      id: 'data',
      label: 'Data',
      value: 0,
      limit: storageCap,
      unit: 'GB/day',
      state: 'fail',
      why: 'Scientific data production cannot be determined because no instruments are configured, yielding zero science return.'
    };
  } else {
    const dataMarginVal = margin(dataMade, storageCap);
    let state: MeterState;
    let why: string;

    if (dataMade > storageCap) {
      state = 'fail';
      why = `Daily data creation of ${dataMade.toFixed(2)} GB/day exceeds onboard storage capacity of ${storageCap.toFixed(2)} GB, causing memory buffer overflow and data loss.`;
    } else if (dataMarginVal < TECH_MARGIN_L1) {
      state = 'warning';
      const pct = Math.round(dataMarginVal * 100);
      why = `Daily observation volume of ${dataMade.toFixed(2)} GB/day leaves a buffer margin of ${pct}% below the 15% threshold, trading observation rate against risk of buffer overflow.`;
    } else {
      state = 'ok';
      why = `Daily data generation of ${dataMade.toFixed(2)} GB/day fits safely within onboard storage capacity of ${storageCap.toFixed(2)} GB, trading observation rate against secure data retention.`;
    }

    dataMeter = {
      id: 'data',
      label: 'Data',
      value: Number(dataMade.toFixed(2)),
      limit: Number(storageCap.toFixed(2)),
      unit: 'GB/day',
      state,
      why
    };
  }

  // --------------------------------------------------------------------------
  // 5. COMMUNICATIONS METER
  // --------------------------------------------------------------------------
  let commsMeter: MeterItem;
  const commsPart = resolvedParts.find((p) => p.category === 'comms');
  const antennaRate = commsPart?.downlink_rate_gb_per_min ?? 0;
  const contactMin = orbit?.contact_min_per_day ?? 0;
  const dataSent = data_sent_per_day_gb(antennaRate, contactMin, design?.link_efficiency ?? 1.0);

  if (!commsPart || !orbit || dataSent <= 0) {
    commsMeter = {
      id: 'communications',
      label: 'Communications',
      value: 0,
      limit: Number(dataMade.toFixed(2)),
      unit: 'GB/day',
      state: 'fail',
      why: 'Downlink throughput cannot be calculated because no communications subsystem or ground contact is configured, preventing data transmission to Earth.'
    };
  } else if (dataMade > 0 && dataSent < dataMade) {
    commsMeter = {
      id: 'communications',
      label: 'Communications',
      value: Number(dataSent.toFixed(2)),
      limit: Number(dataMade.toFixed(2)),
      unit: 'GB/day',
      state: 'fail',
      why: `Downlink capacity of ${dataSent.toFixed(2)} GB/day cannot clear the ${dataMade.toFixed(2)} GB/day data generation rate, causing science data to backlog and be lost.`
    };
  } else {
    // dataSent >= dataMade
    const commMarginVal = dataSent > 0 && dataMade > 0 ? (dataSent - dataMade) / dataSent : 1.0;
    let state: MeterState;
    let why: string;

    if (commMarginVal < TECH_MARGIN_L1) {
      state = 'warning';
      const pct = Math.round(commMarginVal * 100);
      why = `Communications downlink margin of ${pct}% is below the 15% threshold, trading transmitter power against risk of ground contact data latency.`;
    } else {
      state = 'ok';
      why = `Downlink capacity of ${dataSent.toFixed(2)} GB/day reliably clears the ${dataMade.toFixed(2)} GB/day data generation rate, trading transmitter power against complete science return.`;
    }

    commsMeter = {
      id: 'communications',
      label: 'Communications',
      value: Number(dataSent.toFixed(2)),
      limit: Number(dataMade.toFixed(2)),
      unit: 'GB/day',
      state,
      why
    };
  }

  // --------------------------------------------------------------------------
  // 6. TIME METER
  // --------------------------------------------------------------------------
  let timeMeter: MeterItem;
  if (!orbit || lifetime <= 0) {
    timeMeter = {
      id: 'time',
      label: 'Time',
      value: Number(lifetime.toFixed(1)),
      limit: 0,
      unit: 'months',
      state: 'fail',
      why: 'Mission operations duration is unspecified or zero, preventing orbital science collection.'
    };
  } else {
    const orbitPenalty = orbit.lifetime_penalty ?? 0;
    const maxOrbitalLifetime = Math.round(24 * (1 - orbitPenalty));
    const timeMarginVal = margin(lifetime, maxOrbitalLifetime);

    let state: MeterState;
    let why: string;

    if (lifetime > maxOrbitalLifetime) {
      state = 'fail';
      why = `Planned mission lifetime of ${lifetime} months exceeds the ${maxOrbitalLifetime} month orbital limit, so atmospheric drag will de-orbit the spacecraft prematurely.`;
    } else if (timeMarginVal < TECH_MARGIN_L1) {
      state = 'warning';
      const pct = Math.round(timeMarginVal * 100);
      why = `Mission lifetime margin of ${pct}% is below the 15% threshold, trading extended science collection against accelerated orbital altitude decay.`;
    } else {
      state = 'ok';
      why = `Planned mission lifetime of ${lifetime} months is safely within the ${maxOrbitalLifetime} month orbital limit, trading mission duration against orbit stability.`;
    }

    timeMeter = {
      id: 'time',
      label: 'Time',
      value: Number(lifetime.toFixed(1)),
      limit: Number(maxOrbitalLifetime.toFixed(1)),
      unit: 'months',
      state,
      why
    };
  }

  return {
    mass: massMeter,
    power: powerMeter,
    budget: budgetMeter,
    data: dataMeter,
    communications: commsMeter,
    time: timeMeter
  };
}
