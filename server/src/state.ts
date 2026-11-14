/**
 * Authoritative in-memory state models and helpers for ORBITONE game rooms.
 */

import {
  computeMeters,
  cost_total_m,
  cubesatClasses,
  data_made_per_day_gb,
  data_sent_per_day_gb,
  orbits,
  parts,
  power_generated_w,
  power_used_w,
  runAllChecks,
  total_mass_kg,
  vehicles,
  type ActiveDecisionState,
  type Meters,
  type MissionDesign,
  type MissionValidationResult,
  type Part,
  type StateUpdatePayload,
  type TeamPlayer,
  type TeamRole
} from '@orbitone/shared';

export interface ServerPlayer extends TeamPlayer {
  token: string;
  connected: boolean;
  socketId?: string;
}

export interface RoomState {
  code: string;
  players: ServerPlayer[];
  design: MissionDesign;
  meters: Meters;
  validation: MissionValidationResult;
  activeDecision: ActiveDecisionState | null;
  simStatus: 'idle' | 'running' | 'completed';
  version: number;
  lastActiveAt: number;
  cleanupTimer?: NodeJS.Timeout;
}

export const DEFAULT_INITIAL_DESIGN: MissionDesign = {
  cubesat_class_id: '3U',
  orbit_id: 'sso',
  vehicle_id: 'rideshare_dispenser',
  objective_id: 'earth_observation',
  part_ids: ['struct_3u'],
  fuel_mass_kg: 0,
  budget_m: 2.5,
  lifetime_months: 12,
  duty_cycle: 0.5,
  observe_time_fraction: 0.5,
  link_efficiency: 0.95
};

/**
 * Recomputes resource meters and pre-launch checks for a mission design.
 */
export function evaluateDesign(design: MissionDesign): {
  meters: Meters;
  validation: MissionValidationResult;
} {
  const meters = computeMeters(design);

  const cubesatClass = cubesatClasses.find((c) => c.id === design.cubesat_class_id);
  const orbit = orbits.find((o) => o.id === design.orbit_id);
  const vehicle = vehicles.find((v) => v.id === design.vehicle_id);

  const resolvedParts = (design.part_ids ?? [])
    .map((id) => parts.find((p) => p.id === id))
    .filter((p): p is Part => p !== undefined);

  if (!cubesatClass || !orbit || !vehicle) {
    return {
      meters,
      validation: {
        checks: [
          {
            id: 'configurationComplete',
            passed: false,
            reason: 'Mission design is missing a valid CubeSat class, orbit, or launch vehicle.',
            suggestedFix: 'Configure class, orbit, and vehicle.'
          }
        ],
        passed: false,
        warnings: []
      }
    };
  }

  const totalMass = total_mass_kg(resolvedParts.map((p) => p.mass), design.fuel_mass_kg ?? 0);
  const solarParts = resolvedParts.filter((p) => (p.solar_area_m2 ?? 0) > 0);
  const totalSolarArea = solarParts.reduce((sum, p) => sum + (p.solar_area_m2 ?? 0), 0);
  const solarEff =
    solarParts.length > 0 ? Math.max(...solarParts.map((p) => p.solar_efficiency_w_per_m2 ?? 220)) : 220;
  const powerGen = power_generated_w(totalSolarArea, solarEff, orbit.sunlight_fraction);
  const powerUse = power_used_w(resolvedParts.map((p) => p.power), design.duty_cycle ?? 1.0);

  const buildCost = resolvedParts.reduce((sum, p) => sum + p.cost, 0);
  const totalCost = cost_total_m(buildCost, vehicle.cost, 0.02, design.lifetime_months ?? 12);

  const commsPart = resolvedParts.find((p) => p.category === 'comms');
  const antennaRate = commsPart?.downlink_rate_gb_per_min ?? 0;
  const dataSent = data_sent_per_day_gb(
    antennaRate,
    orbit.contact_min_per_day,
    design.link_efficiency ?? 1.0
  );

  const instruments = resolvedParts.filter((p) => p.category === 'instrument');
  const dataMade = data_made_per_day_gb(
    instruments.map((i) => i.data_rate),
    design.observe_time_fraction ?? 1.0
  );

  const validation = runAllChecks({
    total_mass_kg: totalMass,
    cubesat_class: cubesatClass,
    vehicle,
    orbit_id: orbit.id,
    power_used_w: powerUse,
    power_generated_w: powerGen,
    cost_total_m: totalCost,
    budget_m: design.budget_m ?? 2.5,
    data_sent_per_day_gb: dataSent,
    data_made_per_day_gb: dataMade
  });

  return { meters, validation };
}

/**
 * Sanitizes server players into public client players (removes token and socketId).
 */
export function toClientPlayers(players: ServerPlayer[]): TeamPlayer[] {
  return players.map((p) => ({
    id: p.id,
    role: p.role,
    name: p.name
  }));
}

/**
 * Creates the broadcast payload for a state update.
 */
export function toStateUpdatePayload(room: RoomState): StateUpdatePayload {
  return {
    roomCode: room.code,
    players: toClientPlayers(room.players),
    design: room.design,
    meters: room.meters,
    validation: room.validation,
    activeDecision: room.activeDecision,
    simStatus: room.simStatus,
    version: room.version
  };
}
