/**
 * Pure formula functions for ORBITONE mission calculations.
 * All functions are pure, deterministic, and enforce unit-explicit names
 * while exporting section 6 aliases.
 */

/**
 * Calculates total spacecraft mass in kilograms.
 * GAME_RULES section 6: total_mass = sum(part.mass) + fuel_mass
 *
 * @param part_masses_kg Array of individual component masses in kg.
 * @param fuel_mass_kg Propellant/fuel mass in kg (default 0).
 * @returns Total mass in kg (non-negative).
 */
export function total_mass_kg(part_masses_kg: number[], fuel_mass_kg: number = 0): number {
  const safeFuel = Math.max(0, fuel_mass_kg);
  const safePartsTotal = part_masses_kg.reduce((sum, mass) => sum + Math.max(0, mass), 0);
  return safePartsTotal + safeFuel;
}
export const total_mass = total_mass_kg;

/**
 * Calculates average electrical power generated in watts.
 * GAME_RULES section 6: power_generated = solar_area * efficiency * orbit.sunlight_fraction
 *
 * @param solar_area_m2 Total effective solar panel area in square meters.
 * @param efficiency_w_per_m2 Solar panel output rating in W/m^2 under direct sunlight.
 * @param sunlight_fraction Orbit sunlight fraction (0.0 to 1.0).
 * @returns Generated power in watts.
 */
export function power_generated_w(
  solar_area_m2: number,
  efficiency_w_per_m2: number,
  sunlight_fraction: number
): number {
  if (solar_area_m2 <= 0 || efficiency_w_per_m2 <= 0 || sunlight_fraction <= 0) {
    return 0;
  }
  const safeSunlight = Math.min(1.0, sunlight_fraction);
  return solar_area_m2 * efficiency_w_per_m2 * safeSunlight;
}
export const power_generated = power_generated_w;

/**
 * Calculates average electrical power used by spacecraft subsystems in watts.
 * GAME_RULES section 6: power_used = sum(part.power) * duty_cycle
 *
 * @param part_powers_w Array of individual component power draws in watts.
 * @param duty_cycle Subsystem duty cycle fraction (0.0 to 1.0, default 1.0).
 * @returns Power consumed in watts.
 */
export function power_used_w(part_powers_w: number[], duty_cycle: number = 1.0): number {
  if (duty_cycle <= 0) {
    return 0;
  }
  const safeDutyCycle = Math.min(1.0, duty_cycle);
  const partsSum = part_powers_w.reduce((sum, power) => sum + Math.max(0, power), 0);
  return partsSum * safeDutyCycle;
}
export const power_used = power_used_w;

/**
 * Calculates scientific data volume produced per day in gigabytes.
 * GAME_RULES section 6: data_made_per_day = sum(instrument.data_rate) * observe_time_fraction
 *
 * @param instrument_data_rates_gb_per_day Array of instrument data production rates in GB/day.
 * @param observe_time_fraction Duty fraction spent actively observing (0.0 to 1.0, default 1.0).
 * @returns Daily data created in GB/day.
 */
export function data_made_per_day_gb(
  instrument_data_rates_gb_per_day: number[],
  observe_time_fraction: number = 1.0
): number {
  if (observe_time_fraction <= 0) {
    return 0;
  }
  const safeObserveFraction = Math.min(1.0, observe_time_fraction);
  const sumRates = instrument_data_rates_gb_per_day.reduce((sum, rate) => sum + Math.max(0, rate), 0);
  return sumRates * safeObserveFraction;
}
export const data_made_per_day = data_made_per_day_gb;

/**
 * Calculates daily downlink capability to ground stations in gigabytes.
 * GAME_RULES section 6: data_sent_per_day = antenna.rate * ground_contact_minutes_per_day * link_efficiency
 *
 * @param antenna_rate_gb_per_min Downlink throughput in GB per minute.
 * @param ground_contact_minutes_per_day Total ground contact duration in minutes per day.
 * @param link_efficiency Communication link quality efficiency factor (0.0 to 1.0, default 1.0).
 * @returns Daily data sent in GB/day.
 */
export function data_sent_per_day_gb(
  antenna_rate_gb_per_min: number,
  ground_contact_minutes_per_day: number,
  link_efficiency: number = 1.0
): number {
  if (antenna_rate_gb_per_min <= 0 || ground_contact_minutes_per_day <= 0 || link_efficiency <= 0) {
    return 0;
  }
  const safeEfficiency = Math.min(1.0, link_efficiency);
  return antenna_rate_gb_per_min * ground_contact_minutes_per_day * safeEfficiency;
}
export const data_sent_per_day = data_sent_per_day_gb;

/**
 * Calculates total mission lifecycle cost in millions of game dollars ($M).
 * GAME_RULES section 6: cost_total = build_cost + launch_cost + ops_cost_per_month * lifetime_months
 *
 * @param build_cost_m Spacecraft manufacturing and parts build cost in $M.
 * @param launch_cost_m Launch vehicle contract cost in $M.
 * @param ops_cost_per_month_m Monthly mission operations and ground network cost in $M.
 * @param lifetime_months Planned mission operations duration in months.
 * @returns Total cost in $M.
 */
export function cost_total_m(
  build_cost_m: number,
  launch_cost_m: number,
  ops_cost_per_month_m: number,
  lifetime_months: number
): number {
  const safeBuild = Math.max(0, build_cost_m);
  const safeLaunch = Math.max(0, launch_cost_m);
  const safeOps = Math.max(0, ops_cost_per_month_m);
  const safeMonths = Math.max(0, lifetime_months);
  return safeBuild + safeLaunch + safeOps * safeMonths;
}
export const cost_total = cost_total_m;

/**
 * Calculates engineering margin as a fraction relative to the limit: (limit - value) / limit.
 *
 * @param value Current measured/designed value (e.g. mass, power, cost).
 * @param limit Maximum permissible limit (e.g. vehicle capacity, power generated, budget).
 * @returns Fractional margin (e.g. 0.20 for 20% margin, negative if over limit).
 */
export function margin(value: number, limit: number): number {
  if (limit <= 0) {
    if (value <= 0) return 0.0;
    return -Infinity;
  }
  const safeValue = Math.max(0, value);
  return (limit - safeValue) / limit;
}

/**
 * Computes time required to downlink a given data volume, guarding against division by zero.
 *
 * @param data_volume_gb Data volume in GB.
 * @param data_rate_gb_per_day Daily downlink throughput in GB/day.
 * @returns Downlink time in days (Infinity if data rate is 0 or negative).
 */
export function downlink_duration_days(data_volume_gb: number, data_rate_gb_per_day: number): number {
  if (data_volume_gb <= 0) {
    return 0;
  }
  if (data_rate_gb_per_day <= 0) {
    return Infinity;
  }
  return data_volume_gb / data_rate_gb_per_day;
}
