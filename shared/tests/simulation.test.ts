import { describe, expect, it } from 'vitest';
import { runSimulation } from '../src/simulation.js';
import type { MissionDesign } from '../src/types.js';

describe('ORBITONE Mission Simulation', () => {
  // A standard, legal 3U Earth Observation mission design
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
    lifetime_months: 12,
    budget_m: 2.0,
    fuel_mass_kg: 0.1,
    duty_cycle: 0.8,
    observe_time_fraction: 0.5,
    link_efficiency: 0.95
  };

  it('is deterministic: same design and seed give identical SimResult (deep equal)', () => {
    const res1 = runSimulation(validDesign, 12345, 2);
    const res2 = runSimulation(validDesign, 12345, 2);

    expect(res1).toEqual(res2);
    expect(res1.series).toEqual(res2.series);
    expect(res1.events_applied).toEqual(res2.events_applied);
    expect(res1.outcome).toBe(res2.outcome);
  });

  it('different seeds differ at Level 3 due to random events', () => {
    // Run multiple seeds at Level 3 where event probability is 40%
    const results = [
      runSimulation(validDesign, 100, 3),
      runSimulation(validDesign, 200, 3),
      runSimulation(validDesign, 300, 3),
      runSimulation(validDesign, 400, 3),
      runSimulation(validDesign, 500, 3)
    ];

    // Check that not all results are strictly identical across different seeds
    const allIdentical = results.every(
      (r) => JSON.stringify(r.series) === JSON.stringify(results[0].series)
    );
    expect(allIdentical).toBe(false);
  });

  it('Level 1 never produces events across multiple seeds', () => {
    const seeds = [1, 42, 1234, 9999, 'seed-a', 'seed-b'];
    for (const s of seeds) {
      const res = runSimulation(validDesign, s, 1);
      expect(res.events_applied.length).toBe(0);
      expect(res.events_applied).toEqual([]);
    }
  });

  it('an undersized battery in LEO produces a power-related cause tag and brownouts', () => {
    // 3U design with deployable panels (power balanced at 8.9 W) in LEO, but NO battery pack
    const leoDesignNoBattery: MissionDesign = {
      cubesat_class_id: '3U',
      orbit_id: 'leo',
      vehicle_id: 'rideshare_dispenser',
      objective_id: 'earth_observation',
      part_ids: [
        'struct_3u',
        'solar_deployable_3u', // 8.9 W generation in LEO
        'comms_uhf_vhf',
        'obc_cots_mcu',
        'adcs_passive_magnetorquer',
        'inst_multispectral_imager' // power draw ~5.7 W total, < 8.9 W gen
      ],
      lifetime_months: 6,
      budget_m: 1.5,
      fuel_mass_kg: 0.1
    };

    const sim = runSimulation(leoDesignNoBattery, 42, 1);
    expect(sim.cause_tags).toContain('UNDERSIZED_BATTERY_LEO');
  });

  it('storage overflow loses data and lowers science', () => {
    // 3U design with high-rate imager (2.0 GB/day) but slow UHF comms (0.05 GB/day)
    // and small 4 GB OBC storage buffer
    const designWithBufferOverflow: MissionDesign = {
      cubesat_class_id: '3U',
      orbit_id: 'sso',
      vehicle_id: 'rideshare_dispenser',
      objective_id: 'earth_observation',
      part_ids: [
        'struct_3u',
        'solar_deployable_3u',
        'batt_space_30wh',
        'comms_uhf_vhf', // very slow: 0.001 GB/min => ~1.5 GB/month
        'obc_cots_mcu', // small 4 GB storage
        'inst_multispectral_imager' // 2.0 GB/day => 60 GB/month
      ],
      lifetime_months: 6,
      budget_m: 1.5,
      fuel_mass_kg: 0.1
    };

    const sim = runSimulation(designWithBufferOverflow, 42, 1);
    expect(sim.data_lost_total_gb).toBeGreaterThan(0);
    expect(sim.cause_tags).toContain('STORAGE_OVERFLOW_DATA_LOST');

    // Science is lowered when data is lost
    expect(sim.data_transmitted_total_gb).toBeLessThan(sim.data_generated_total_gb);
  });

  describe('Edge Cases', () => {
    it('handles zero lifetime without throwing: returns error result', () => {
      const designZeroLifetime: MissionDesign = {
        ...validDesign,
        lifetime_months: 0
      };

      const result = runSimulation(designZeroLifetime, 42, 1);
      expect(result.outcome).toBe('failure');
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid lifetime');
      expect(result.cause_tags).toContain('ZERO_LIFETIME');
    });

    it('handles zero data rate without division by zero: science is zero', () => {
      // Structure and power only, no instruments
      const designZeroDataRate: MissionDesign = {
        cubesat_class_id: '1U',
        orbit_id: 'leo',
        vehicle_id: 'rideshare_dispenser',
        objective_id: 'earth_observation',
        part_ids: ['struct_1u', 'solar_body_1u', 'batt_liion_10wh', 'obc_cots_mcu'],
        lifetime_months: 6,
        budget_m: 1.0
      };

      const result = runSimulation(designZeroDataRate, 42, 1);
      expect(result.data_generated_total_gb).toBe(0);
      expect(result.data_transmitted_total_gb).toBe(0);
      expect(result.data_lost_total_gb).toBe(0);
      expect(Number.isNaN(result.science_collected)).toBe(false);
    });

    it('handles missing orbit data gracefully without throwing', () => {
      const designMissingOrbit: MissionDesign = {
        ...validDesign,
        orbit_id: 'non_existent_orbit_xyz'
      };

      const result = runSimulation(designMissingOrbit, 42, 1);
      expect(result.outcome).toBe('failure');
      expect(result.error).toContain('not found in database');
      expect(result.cause_tags).toContain('MISSING_ORBIT_DATA');
    });

    it('handles negative values in budget or fuel without throwing', () => {
      const designNegative: MissionDesign = {
        ...validDesign,
        budget_m: -1.0,
        fuel_mass_kg: -0.5
      };

      const result = runSimulation(designNegative, 42, 1);
      expect(result.outcome).toBe('failure');
      expect(result.error).toContain('Negative values are not permitted');
      expect(result.cause_tags).toContain('NEGATIVE_INPUTS');
    });

    it('does not simulate an invalid design that fails pre-launch checks', () => {
      // 1U design with total mass exceeding 1.33 kg limit
      const invalidMassDesign: MissionDesign = {
        cubesat_class_id: '1U',
        orbit_id: 'leo',
        vehicle_id: 'rideshare_dispenser',
        part_ids: [
          'struct_1u',
          'solar_deployable_3u', // 0.45 kg
          'solar_gainp_high_eff', // 0.80 kg
          'batt_space_30wh', // 0.40 kg => total > 1.8 kg (exceeds 1.33 kg)
          'obc_rad_hard'
        ],
        lifetime_months: 6,
        budget_m: 1.0
      };

      const result = runSimulation(invalidMassDesign, 42, 1);
      expect(result.outcome).toBe('failure');
      expect(result.error).toContain('Pre-launch hard check failed');
      expect(result.cause_tags).toContain('INVALID_DESIGN');
      expect(result.series.months).toEqual([0]);
    });
  });
});
