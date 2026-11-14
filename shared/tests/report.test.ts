import { describe, expect, it } from 'vitest';
import { buildReport, findSimilarRealMission } from '../src/report.js';
import { runSimulation } from '../src/simulation.js';
import type { MissionDesign, SimResult } from '../src/types.js';

describe('ORBITONE Post-Mission Report Generator', () => {
  it('the report always has 3 to 5 why sentences and exactly two next-step suggestions', () => {
    const validDesign: MissionDesign = {
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
      lifetime_months: 6,
      budget_m: 2.0
    };

    const sim = runSimulation(validDesign, 42, 1);
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
});
