import { describe, expect, it } from 'vitest';
import { buildReport, findSimilarRealMission } from '../src/report.js';
import { runSimulation } from '../src/simulation.js';
import type { MissionDesign, SimResult } from '../src/types.js';

describe('ORBITONE Post-Mission Report Generator', () => {
  it('the report always has 3 to 5 why sentences and next-step suggestions when demonstrated upgrades exist', () => {
    const upgradableDesign: MissionDesign = {
      cubesat_class_id: '3U',
      orbit_id: 'sso',
      vehicle_id: 'rideshare_dispenser',
      objective_id: 'earth_observation',
      part_ids: [
        'struct_3u',
        'solar_deployable_3u',
        'batt_liion_10wh',
        'comms_uhf_vhf',
        'obc_rad_hard',
        'adcs_3axis_wheels',
        'inst_multispectral_imager'
      ],
      lifetime_months: 6,
      budget_m: 2.0
    };

    const sim = runSimulation(upgradableDesign, 42, 1);
    const report = buildReport(sim);

    expect(report.why.length).toBeGreaterThanOrEqual(3);
    expect(report.why.length).toBeLessThanOrEqual(5);
    expect(report.what_to_try_next.length).toBe(2);
    expect(report.what_to_try_next[0].length).toBeGreaterThan(0);
    expect(report.what_to_try_next[1].length).toBeGreaterThan(0);
  });

  it('an undersized battery in LEO produces a why sentence that mentions the battery', () => {
    const leoDesignNoBattery: MissionDesign = {
      cubesat_class_id: '3U',
      orbit_id: 'leo',
      vehicle_id: 'rideshare_dispenser',
      objective_id: 'earth_observation',
      part_ids: [
        'struct_3u',
        'solar_deployable_3u',
        'comms_uhf_vhf',
        'obc_cots_mcu',
        'adcs_passive_magnetorquer',
        'inst_multispectral_imager'
      ],
      lifetime_months: 6,
      budget_m: 1.5,
      fuel_mass_kg: 0.1
    };

    const sim = runSimulation(leoDesignNoBattery, 42, 1);
    expect(sim.cause_tags).toContain('UNDERSIZED_BATTERY_LEO');

    const report = buildReport(sim);

    const hasBatterySentence = report.why.some((s) =>
      s.toLowerCase().includes('battery') && s.toLowerCase().includes('leo')
    );
    expect(hasBatterySentence).toBe(true);

    const batterySentence = report.why.find((s) => s.toLowerCase().includes('battery'));
    expect(batterySentence).toBe(
      'Your battery was too small for the LEO eclipses, so the camera shut off every orbit.'
    );
  });

  it('matches a similar real mission from CubeSat 101 by objective type and size class', () => {
    const match1U = findSimilarRealMission('earth_observation', '1U');
    expect(match1U).toBeDefined();
    expect(match1U?.name).toBe('STMSat-1');
    expect(match1U?.source).toBe('NASA CubeSat 101 p. 17');

    const match3USpaceWeather = findSimilarRealMission('space_weather', '3U');
    expect(match3USpaceWeather).toBeDefined();
    expect(match3USpaceWeather?.name).toBe('MinXSS');
    expect(match3USpaceWeather?.source).toBe('NASA CubeSat 101 p. 30');
  });

  it('no real-mission match is returned when none fits', () => {
    // 2U biology or 12U does not exist in Addendum D
    const noMatchSize = findSimilarRealMission('earth_observation', '12U');
    expect(noMatchSize).toBeNull();

    const noMatchObjective = findSimilarRealMission('interplanetary_mining', '1U');
    expect(noMatchObjective).toBeNull();

    const noMatchUndefined = findSimilarRealMission(undefined, undefined);
    expect(noMatchUndefined).toBeNull();
  });

  it('generates a 5x5 risk matrix with valid ratings and mitigations', () => {
    const mockSim: SimResult = {
      outcome: 'threshold_met',
      timeline: [],
      series: {
        months: [1],
        power_w: [5],
        data_stored_gb: [2],
        budget_remaining_m: [0.5],
        health: [90]
      },
      events_applied: [],
      cause_tags: ['UNDERSIZED_BATTERY_LEO', 'STORAGE_OVERFLOW_DATA_LOST'],
      science_collected: 50.0,
      data_generated_total_gb: 20.0,
      data_transmitted_total_gb: 15.0,
      data_lost_total_gb: 5.0,
      final_health: 90.0,
      lifetime_months: 6,
      design: {
        cubesat_class_id: '1U',
        orbit_id: 'leo',
        vehicle_id: 'rideshare_dispenser',
        part_ids: ['struct_1u', 'solar_body_1u', 'comms_uhf_vhf', 'obc_cots_mcu']
      }
    };

    const report = buildReport(mockSim);
    expect(report.top_risks.length).toBeGreaterThanOrEqual(3);

    for (const r of report.top_risks) {
      expect(r.risk).toBeDefined();
      expect(r.likelihood).toBeGreaterThanOrEqual(1);
      expect(r.likelihood).toBeLessThanOrEqual(5);
      expect(r.consequence).toBeGreaterThanOrEqual(1);
      expect(r.consequence).toBeLessThanOrEqual(5);
      expect(r.mitigation.length).toBeGreaterThan(0);
    }
  });

  it('pre-launch hard check failures do not claim no anomalies occurred and give actionable next steps', () => {
    // Design that exceeds mass limit
    const overweightDesign: MissionDesign = {
      cubesat_class_id: '3U',
      orbit_id: 'sso',
      vehicle_id: 'rideshare_dispenser',
      objective_id: 'earth_observation',
      part_ids: [
        'struct_3u',
        'solar_deployable_3u',
        'batt_space_30wh',
        'comms_sband_patch',
        'obc_rad_hard',
        'adcs_3axis_wheels',
        'inst_multispectral_imager'
      ],
      lifetime_months: 12,
      budget_m: 2.5,
      fuel_mass_kg: 1.0 // 3.2 kg parts + 1.0 kg fuel = 4.2 kg > 4.0 kg limit
    };

    const sim = runSimulation(overweightDesign, 42, 1);
    expect(sim.outcome).toBe('failure');
    expect(sim.cause_tags).toContain('CHECK_FAILED_MASSUNDERCLASSLIMIT');

    const report = buildReport(sim);

    // 1. Must NOT claim no anomalies occurred
    const hasNoAnomaliesSentence = report.why.some((s) =>
      s.toLowerCase().includes('no anomalies or adverse cause tags occurred during this flight')
    );
    expect(hasNoAnomaliesSentence).toBe(false);

    // 2. Must explain the failure cause and trade-off in 3 to 5 sentences
    expect(report.why.length).toBeGreaterThanOrEqual(3);
    expect(report.why.length).toBeLessThanOrEqual(5);
    const mentionsMass = report.why.some((s) => s.toLowerCase().includes('mass'));
    expect(mentionsMass).toBe(true);

    // 3. Must provide actionable next steps matching the failure
    expect(report.what_to_try_next.length).toBe(2);
    const nextStepsText = report.what_to_try_next.join(' ').toLowerCase();
    expect(nextStepsText).toMatch(/mass|chassis|descope/);
  });

  it('pre-launch power-starved failure provides actionable power next steps and trade-off explanation', () => {
    const powerStarvedDesign: MissionDesign = {
      cubesat_class_id: '3U',
      orbit_id: 'sso',
      vehicle_id: 'rideshare_dispenser',
      objective_id: 'earth_observation',
      part_ids: [
        'struct_3u',
        'solar_body_1u', // 1.58 W generated vs ~18.5 W draw
        'batt_space_30wh',
        'comms_sband_patch',
        'obc_rad_hard',
        'adcs_3axis_wheels',
        'inst_multispectral_imager'
      ],
      lifetime_months: 12,
      budget_m: 2.5,
      fuel_mass_kg: 0.1
    };

    const sim = runSimulation(powerStarvedDesign, 42, 1);
    expect(sim.outcome).toBe('failure');
    expect(sim.cause_tags).toContain('CHECK_FAILED_POWERBALANCED');

    const report = buildReport(sim);

    expect(report.why.some((s) => s.includes('No anomalies'))).toBe(false);
    expect(report.why.length).toBeGreaterThanOrEqual(3);
    expect(report.why.length).toBeLessThanOrEqual(5);
    expect(report.why.some((s) => s.toLowerCase().includes('power'))).toBe(true);

    expect(report.what_to_try_next.length).toBe(2);
    const nextStepsText = report.what_to_try_next.join(' ').toLowerCase();
    expect(nextStepsText).toMatch(/solar|power|duty cycle/);
  });

  it('pre-launch budget failure provides actionable budget next steps and trade-off explanation', () => {
    const overBudgetDesign: MissionDesign = {
      cubesat_class_id: '3U',
      orbit_id: 'sso',
      vehicle_id: 'rideshare_dispenser',
      objective_id: 'earth_observation',
      part_ids: [
        'struct_3u',
        'solar_deployable_3u',
        'batt_space_30wh',
        'comms_sband_patch',
        'obc_rad_hard',
        'adcs_3axis_wheels',
        'inst_multispectral_imager'
      ],
      lifetime_months: 12,
      budget_m: 1.5, // Total cost $1.79M > $1.5M * 0.9 = $1.35M
      fuel_mass_kg: 0.1
    };

    const sim = runSimulation(overBudgetDesign, 42, 1);
    expect(sim.outcome).toBe('failure');
    expect(sim.cause_tags).toContain('CHECK_FAILED_WITHINBUDGET');

    const report = buildReport(sim);

    expect(report.why.some((s) => s.includes('No anomalies'))).toBe(false);
    expect(report.why.length).toBeGreaterThanOrEqual(3);
    expect(report.why.length).toBeLessThanOrEqual(5);
    expect(report.why.some((s) => s.toLowerCase().includes('budget') || s.toLowerCase().includes('cost'))).toBe(true);

    expect(report.what_to_try_next.length).toBe(2);
    const nextStepsText = report.what_to_try_next.join(' ').toLowerCase();
    expect(nextStepsText).toMatch(/cost|budget|launcher/);
  });

  it('exact baseline report does not recommend S-Band Patch Transceiver or battery upgrade when already installed and keeps suggestions actionable', () => {
    const baselineDesign: MissionDesign = {
      objective_id: 'earth_observation',
      orbit_id: 'sso',
      vehicle_id: 'rideshare_dispenser',
      cubesat_class_id: '3U',
      part_ids: [
        'struct_3u',
        'solar_deployable_3u',
        'batt_space_30wh',
        'comms_sband_patch',
        'obc_rad_hard',
        'adcs_3axis_wheels',
        'inst_multispectral_imager'
      ],
      lifetime_months: 12,
      budget_m: 2.5,
      fuel_mass_kg: 0.1,
      duty_cycle: 0.5,
      observe_time_fraction: 0.5,
      link_efficiency: 0.95
    };

    const sim = runSimulation(baselineDesign, 42, 1);
    expect(sim.outcome).toBe('threshold_met');

    const report = buildReport(sim);

    // 1. Must NOT recommend upgrading to S-Band Patch Transceiver because it is already installed
    const recommendsSBand = report.what_to_try_next.some((s) =>
      s.toLowerCase().includes('s-band patch transceiver')
    );
    expect(recommendsSBand).toBe(false);

    // 2. Must NOT recommend a battery upgrade when 30Wh pack (max in catalog) is already installed
    const recommendsBatteryUpgrade = report.what_to_try_next.some((s) =>
      s.toLowerCase().includes('upgrade from the 10wh') ||
      s.toLowerCase().includes('install a 30wh')
    );
    expect(recommendsBatteryUpgrade).toBe(false);

    // 3. Must NOT contain percentage-specific margin recommendations without typed difficulty on the engine
    const hasPercentageMargin = report.what_to_try_next.some((s) =>
      s.includes('35%') || s.includes('15%')
    );
    expect(hasPercentageMargin).toBe(false);

    // 4. Must NOT recommend ambiguous observation duty cycle (confusing observe_time_fraction with duty_cycle)
    const recommendsDutyCycle = report.what_to_try_next.some((s) =>
      s.toLowerCase().includes('duty cycle')
    );
    expect(recommendsDutyCycle).toBe(false);

    // 5. Must NOT recommend selecting a higher-capacity launch vehicle when launcher is not limiting (3.3 kg vs 16 kg SSO capacity)
    const recommendsLauncher = report.what_to_try_next.some((s) =>
      s.toLowerCase().includes('launch vehicle') || s.toLowerCase().includes('launcher')
    );
    expect(recommendsLauncher).toBe(false);

    // 6. Must NOT fill the report with generic advice
    const hasGenericFiller = report.what_to_try_next.some((s) =>
      s.toLowerCase().includes('optimize payload scheduling') ||
      s.toLowerCase().includes('maintain healthy mass and power')
    );
    expect(hasGenericFiller).toBe(false);

    // 7. Must NOT recommend more solar power when power is already generating 10.37 W vs 6.4 W load (38.3% margin)
    const recommendsSolar = report.what_to_try_next.some((s) =>
      s.toLowerCase().includes('solar')
    );
    expect(recommendsSolar).toBe(false);

    // 8. Must NOT emit limitation statements as next-step recommendations
    const hasLimitationStatement = report.what_to_try_next.some((s) =>
      s.toLowerCase().includes('no further catalog upgrades')
    );
    expect(hasLimitationStatement).toBe(false);

    // 9. Returns exactly two distinct, validated suggestions derived from engine calculations
    expect(report.what_to_try_next).toHaveLength(2);
    expect(report.what_to_try_next[0].length).toBeGreaterThan(0);
    expect(report.what_to_try_next[1].length).toBeGreaterThan(0);
    expect(report.what_to_try_next[0]).not.toEqual(report.what_to_try_next[1]);

    // 10. First suggestion validates increasing observe_time_fraction to 0.53 within flash buffer limit
    expect(report.what_to_try_next[0]).toContain('observe_time_fraction');
    expect(report.what_to_try_next[0]).toContain('0.53');
    expect(report.what_to_try_next[0]).toContain('381.6 GB');
    expect(report.what_to_try_next[0]).toContain('32 GB');

    // 11. Second suggestion validates reducing inactive propellant to expand 3U class mass margin
    expect(report.what_to_try_next[1]).toContain('fuel_mass_kg');
    expect(report.what_to_try_next[1]).toContain('0.0 kg');
    expect(report.what_to_try_next[1]).toContain('3.20 kg');
    expect(report.what_to_try_next[1]).toContain('20.0%');
  });

  it('recommends battery upgrade to 30Wh Space-Grade Battery only when smaller 10Wh battery is installed', () => {
    const battery10WhDesign: MissionDesign = {
      objective_id: 'earth_observation',
      orbit_id: 'sso',
      vehicle_id: 'rideshare_dispenser',
      cubesat_class_id: '3U',
      part_ids: [
        'struct_3u',
        'solar_deployable_3u',
        'batt_liion_10wh',
        'comms_sband_patch',
        'obc_rad_hard',
        'adcs_3axis_wheels',
        'inst_multispectral_imager'
      ],
      lifetime_months: 12,
      budget_m: 2.5,
      fuel_mass_kg: 0.1,
      duty_cycle: 0.5,
      observe_time_fraction: 0.5,
      link_efficiency: 0.95
    };

    const sim = runSimulation(battery10WhDesign, 42, 1);
    const report = buildReport(sim);

    expect(
      report.what_to_try_next.some((s) =>
        s.includes('30Wh Space-Grade Battery')
      )
    ).toBe(true);
  });

  it('recommends S-Band Patch Transceiver when comms_uhf_vhf is installed instead', () => {
    const uhfDesign: MissionDesign = {
      objective_id: 'earth_observation',
      orbit_id: 'sso',
      vehicle_id: 'rideshare_dispenser',
      cubesat_class_id: '3U',
      part_ids: [
        'struct_3u',
        'solar_deployable_3u',
        'batt_space_30wh',
        'comms_uhf_vhf',
        'obc_rad_hard',
        'adcs_3axis_wheels',
        'inst_multispectral_imager'
      ],
      lifetime_months: 12,
      budget_m: 2.5,
      fuel_mass_kg: 0.1,
      duty_cycle: 0.5,
      observe_time_fraction: 0.5,
      link_efficiency: 0.95
    };

    const sim = runSimulation(uhfDesign, 42, 1);
    const report = buildReport(sim);

    // When S-Band is NOT installed, upgrading to S-Band is recommended
    expect(
      report.what_to_try_next.some((s) => s.includes('S-Band Patch Transceiver'))
    ).toBe(true);
  });
});
