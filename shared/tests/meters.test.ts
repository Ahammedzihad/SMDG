import { describe, expect, it } from 'vitest';
import { computeMeters } from '../src/meters.js';
import type { MeterId, MissionDesign } from '../src/types.js';

describe('ORBITONE Resource Meters (computeMeters)', () => {
  const baseValidDesign: MissionDesign = {
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
    fuel_mass_kg: 0.1,
    duty_cycle: 0.5,
    observe_time_fraction: 0.5,
    link_efficiency: 0.95
  };

  it('computes all six required meters: mass, power, budget, data, communications, time', () => {
    const meters = computeMeters(baseValidDesign);

    const expectedKeys: MeterId[] = ['mass', 'power', 'budget', 'data', 'communications', 'time'];
    for (const key of expectedKeys) {
      expect(meters[key]).toBeDefined();
      expect(meters[key].id).toBe(key);
      expect(typeof meters[key].label).toBe('string');
      expect(typeof meters[key].value).toBe('number');
      expect(typeof meters[key].limit).toBe('number');
      expect(typeof meters[key].unit).toBe('string');
      expect(['ok', 'warning', 'fail']).toContain(meters[key].state);
      expect(typeof meters[key].why).toBe('string');
      expect(meters[key].why.length).toBeGreaterThan(0);
    }
  });

  it('is deterministic: same input gives the same output', () => {
    const res1 = computeMeters(baseValidDesign);
    const res2 = computeMeters(baseValidDesign);
    const res3 = computeMeters(baseValidDesign);

    expect(res1).toEqual(res2);
    expect(res2).toEqual(res3);
  });

  it('an empty design does not throw and returns all meters in fail state with clear why', () => {
    const emptyDesign = {} as MissionDesign;
    let meters: ReturnType<typeof computeMeters>;

    expect(() => {
      meters = computeMeters(emptyDesign);
    }).not.toThrow();

    meters = computeMeters(emptyDesign);
    const keys: MeterId[] = ['mass', 'power', 'budget', 'data', 'communications', 'time'];

    for (const key of keys) {
      expect(meters[key].state).toBe('fail');
      expect(meters[key].why.length).toBeGreaterThan(10);
      expect(Number.isNaN(meters[key].value)).toBe(false);
      expect(Number.isNaN(meters[key].limit)).toBe(false);
    }
  });

  describe('Each meter reaches ok, warning, and fail states', () => {
    // 1. MASS METER
    it('mass meter reaches ok, warning, and fail', () => {
      // OK: mass ~2.8 kg well below 3U limit of 4.0 kg (margin ~30% >= 15%)
      const okDesign: MissionDesign = {
        ...baseValidDesign,
        fuel_mass_kg: 0.0
      };
      expect(computeMeters(okDesign).mass.state).toBe('ok');

      // WARNING: mass near 4.0 kg limit with margin < 15% (e.g. fuel pushes mass to 3.6 kg => margin 10%)
      const warningDesign: MissionDesign = {
        ...baseValidDesign,
        part_ids: [
          'struct_3u', // 0.70
          'solar_gainp_high_eff', // 0.80
          'solar_deployable_3u', // 0.45
          'batt_space_30wh', // 0.40
          'comms_sband_patch', // 0.35
          'obc_rad_hard', // 0.25
          'adcs_3axis_wheels', // 0.65
          'inst_xray_photometer' // 0.50 => total 4.10 parts!
        ],
        // Let's configure exact parts for ~3.55 kg:
        // 0.70 + 0.80 + 0.40 + 0.35 + 0.25 + 0.65 + 0.40 = 3.55 kg => margin (4.0 - 3.55)/4.0 = 11.25% < 15%
      };
      warningDesign.part_ids = [
        'struct_3u', // 0.70
        'solar_gainp_high_eff', // 0.80
        'batt_space_30wh', // 0.40
        'comms_sband_patch', // 0.35
        'obc_rad_hard', // 0.25
        'adcs_3axis_wheels', // 0.65
        'inst_multispectral_imager' // 0.40 => sum = 3.55 kg
      ];
      warningDesign.fuel_mass_kg = 0.05; // 3.60 kg => margin (4.0 - 3.60)/4.0 = 10%
      expect(computeMeters(warningDesign).mass.state).toBe('warning');

      // FAIL: mass exceeds 4.0 kg
      const failDesign: MissionDesign = {
        ...warningDesign,
        fuel_mass_kg: 1.0 // 4.55 kg > 4.0 kg
      };
      expect(computeMeters(failDesign).mass.state).toBe('fail');
    });

    // 2. POWER METER
    it('power meter reaches ok, warning, and fail', () => {
      // OK: base design has 10.368 W gen, duty cycle 0.7 uses ~3.7 W => margin > 60%
      expect(computeMeters(baseValidDesign).power.state).toBe('ok');

      // WARNING: power used close to power generated (margin < 15%)
      // Power gen = 0.06 * 240 * 0.72 = 10.368 W
      // Add parts to draw ~9.2 W => margin ~11% < 15%
      const warningDesign: MissionDesign = {
        ...baseValidDesign,
        part_ids: [
          'struct_3u',
          'solar_deployable_3u',
          'comms_sband_patch', // 4.0 W
          'adcs_3axis_wheels', // 3.5 W
          'inst_multispectral_imager', // 3.0 W => total draw = 10.5 W
          'obc_cots_mcu' // 0.8 W => total = 11.3 W
        ],
        duty_cycle: 0.82 // 11.3 * 0.82 = 9.266 W => margin (10.368 - 9.266)/10.368 = 10.6% < 15%
      };
      expect(computeMeters(warningDesign).power.state).toBe('warning');

      // FAIL: power used exceeds power generated
      const failDesign: MissionDesign = {
        ...warningDesign,
        duty_cycle: 1.0 // 11.3 W > 10.368 W
      };
      expect(computeMeters(failDesign).power.state).toBe('fail');
    });

    // 3. BUDGET METER
    it('budget meter reaches ok, warning, and fail', () => {
      // Cost is build (~0.8M) + launch (0.3M) + ops (0.02 * 12 = 0.24M) = ~1.34M
      // OK: budget = 2.0M => margin (2.0 - 1.34)/2.0 = 33% >= 10%
      expect(computeMeters(baseValidDesign).budget.state).toBe('ok');

      // WARNING: cost eats into the 10% reserve (margin < 10% but <= budget)
      // Total cost of baseValidDesign is 1.79M (build 1.25M + launch 0.30M + ops 0.24M).
      // With budget = 1.90M, margin is (1.90 - 1.79) / 1.90 = 5.79% < 10%.
      const warningDesign: MissionDesign = {
        ...baseValidDesign,
        budget_m: 1.90
      };
      expect(computeMeters(warningDesign).budget.state).toBe('warning');

      // FAIL: cost exceeds budget
      const failDesign: MissionDesign = {
        ...baseValidDesign,
        budget_m: 1.0
      };
      expect(computeMeters(failDesign).budget.state).toBe('fail');
    });

    // 4. DATA METER
    it('data meter reaches ok, warning, and fail', () => {
      // OK: COTS MCU has 4.0 GB storage. Imager at 0.5 observe fraction makes 1.0 GB/day => margin 75%
      const okDesign: MissionDesign = {
        ...baseValidDesign,
        part_ids: ['struct_3u', 'solar_deployable_3u', 'obc_cots_mcu', 'inst_multispectral_imager'],
        observe_time_fraction: 0.5 // 2.0 * 0.5 = 1.0 GB/day
      };
      expect(computeMeters(okDesign).data.state).toBe('ok');

      // WARNING: observation rate leaves < 15% buffer margin
      // 4.0 GB cap. Data made = 3.6 GB/day => margin (4.0 - 3.6)/4.0 = 10% < 15%
      const warningDesign: MissionDesign = {
        ...baseValidDesign,
        part_ids: [
          'struct_3u',
          'solar_deployable_3u',
          'obc_cots_mcu', // 4.0 GB cap
          'inst_multispectral_imager', // 2.0 GB/day
          'inst_xray_photometer', // 1.2 GB/day
          'inst_plasma_probe' // 0.8 GB/day => sum = 4.0 GB/day
        ],
        observe_time_fraction: 0.90 // 4.0 * 0.90 = 3.6 GB/day
      };
      expect(computeMeters(warningDesign).data.state).toBe('warning');

      // FAIL: data made exceeds storage capacity (e.g. 6.0 GB/day > 4.0 GB)
      const failDesign: MissionDesign = {
        ...warningDesign,
        part_ids: [
          ...warningDesign.part_ids,
          'inst_multispectral_imager' // +2.0 GB/day => total rate = 6.0 GB/day
        ],
        observe_time_fraction: 1.0 // 6.0 GB/day > 4.0 GB cap
      };
      expect(computeMeters(failDesign).data.state).toBe('fail');
    });

    // 5. COMMUNICATIONS METER
    it('communications meter reaches ok, warning, and fail', () => {
      // OK: S-Band downlink rate = 0.025 GB/min * 50 min * 0.95 = 1.1875 GB/day
      // Plasma probe makes 0.8 * 0.5 = 0.4 GB/day => downlink clears data with >15% margin
      const okDesign: MissionDesign = {
        ...baseValidDesign,
        part_ids: ['struct_3u', 'solar_deployable_3u', 'comms_sband_patch', 'inst_plasma_probe'],
        observe_time_fraction: 0.5
      };
      expect(computeMeters(okDesign).communications.state).toBe('ok');

      // WARNING: downlink clears data but margin is < 15%
      // Downlink = 1.1875 GB/day. If data made = 1.10 GB/day => margin (1.1875 - 1.10)/1.1875 = 7.3% < 15%
      const warningDesign: MissionDesign = {
        ...baseValidDesign,
        part_ids: ['struct_3u', 'solar_deployable_3u', 'comms_sband_patch', 'inst_multispectral_imager'],
        observe_time_fraction: 0.55 // 2.0 * 0.55 = 1.10 GB/day
      };
      expect(computeMeters(warningDesign).communications.state).toBe('warning');

      // FAIL: downlink is less than data made
      // UHF downlink = 0.001 * 50 * 0.95 = 0.0475 GB/day < 1.0 GB/day made
      const failDesign: MissionDesign = {
        ...baseValidDesign,
        part_ids: ['struct_3u', 'solar_deployable_3u', 'comms_uhf_vhf', 'inst_multispectral_imager'],
        observe_time_fraction: 0.5
      };
      expect(computeMeters(failDesign).communications.state).toBe('fail');
    });

    // 6. TIME METER
    it('time meter reaches ok, warning, and fail', () => {
      // In LEO: lifetime penalty = 0.20 => orbital limit = 24 * (1 - 0.20) = 19 months
      // OK: lifetime = 12 months <= 19 months (margin = (19 - 12)/19 = 36.8% >= 15%)
      const okDesign: MissionDesign = {
        ...baseValidDesign,
        orbit_id: 'leo',
        lifetime_months: 12
      };
      expect(computeMeters(okDesign).time.state).toBe('ok');

      // WARNING: lifetime = 18 months <= 19 months (margin = (19 - 18)/19 = 5.2% < 15%)
      const warningDesign: MissionDesign = {
        ...baseValidDesign,
        orbit_id: 'leo',
        lifetime_months: 18
      };
      expect(computeMeters(warningDesign).time.state).toBe('warning');

      // FAIL: lifetime = 24 months > 19 months limit
      const failDesign: MissionDesign = {
        ...baseValidDesign,
        orbit_id: 'leo',
        lifetime_months: 24
      };
      expect(computeMeters(failDesign).time.state).toBe('fail');
    });
  });

  it('why field is always one plain sentence naming cause and trade-off', () => {
    const meters = computeMeters(baseValidDesign);
    const keys: MeterId[] = ['mass', 'power', 'budget', 'data', 'communications', 'time'];

    for (const key of keys) {
      const why = meters[key].why;
      expect(why).toBeDefined();
      expect(why.endsWith('.')).toBe(true);

      // Verify it is a single sentence (does not have multiple sentences)
      const sentenceCount = why.split(/\.\s+/).filter((s) => s.trim().length > 0).length;
      expect(sentenceCount).toBe(1);

      // Verify it mentions trade-off / trading
      expect(why.toLowerCase()).toContain('trad');
    }
  });
});
