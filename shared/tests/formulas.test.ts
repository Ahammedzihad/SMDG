import { describe, expect, it } from 'vitest';
import {
  cost_total,
  cost_total_m,
  data_made_per_day,
  data_made_per_day_gb,
  data_sent_per_day,
  data_sent_per_day_gb,
  downlink_duration_days,
  margin,
  power_generated,
  power_generated_w,
  power_used,
  power_used_w,
  total_mass,
  total_mass_kg
} from '../src/formulas.js';

describe('ORBITONE Formulas Engine', () => {
  describe('total_mass and total_mass_kg', () => {
    it('correctly calculates total mass from parts and fuel', () => {
      const partMasses = [0.2, 0.1, 0.15, 0.12, 0.08, 0.4];
      const fuelMass = 0.05;
      const result = total_mass_kg(partMasses, fuelMass);
      expect(result).toBeCloseTo(1.10, 5);
      expect(total_mass(partMasses, fuelMass)).toBe(result);
    });

    it('is pure and deterministic: same input gives same output', () => {
      const parts = [0.5, 0.3, 0.2];
      const fuel = 0.1;
      const res1 = total_mass_kg(parts, fuel);
      const res2 = total_mass_kg(parts, fuel);
      const res3 = total_mass_kg(parts, fuel);
      expect(res1).toBe(res2);
      expect(res2).toBe(res3);
    });

    it('handles negative inputs safely by clamping to zero', () => {
      const result = total_mass_kg([-0.5, 0.2, -0.1], -1.0);
      expect(result).toBeCloseTo(0.2, 5);
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  describe('power_generated and power_generated_w', () => {
    it('calculates generated power according to section 6 formula', () => {
      // 0.06 m^2 solar area, 240 W/m^2 efficiency, SSO sunlight fraction 0.72
      const result = power_generated_w(0.06, 240, 0.72);
      expect(result).toBeCloseTo(10.368, 3);
      expect(power_generated(0.06, 240, 0.72)).toBe(result);
    });

    it('produces low power for eclipse-heavy orbit with small solar area', () => {
      // LEO sunlight fraction 0.62, 1U panel 0.01 m^2, 220 W/m^2
      const result = power_generated_w(0.01, 220, 0.62);
      expect(result).toBeCloseTo(1.364, 3);
      expect(result).toBeLessThan(2.0);
    });

    it('is deterministic: same input gives same output', () => {
      const r1 = power_generated_w(0.1, 200, 0.8);
      const r2 = power_generated_w(0.1, 200, 0.8);
      expect(r1).toBe(r2);
    });

    it('handles negative inputs safely', () => {
      expect(power_generated_w(-0.01, 220, 0.62)).toBe(0);
      expect(power_generated_w(0.01, -220, 0.62)).toBe(0);
      expect(power_generated_w(0.01, 220, -0.5)).toBe(0);
    });
  });

  describe('power_used and power_used_w', () => {
    it('calculates subsystem power consumption with duty cycle', () => {
      const draws = [0.8, 1.5, 3.0]; // OBC, Comms, Imager = 5.3 W total
      const result = power_used_w(draws, 0.8);
      expect(result).toBeCloseTo(4.24, 3);
      expect(power_used(draws, 0.8)).toBe(result);
    });

    it('is deterministic: same input gives same output', () => {
      const draws = [1.0, 2.0];
      expect(power_used_w(draws, 0.5)).toBe(power_used_w(draws, 0.5));
    });

    it('handles negative inputs gracefully', () => {
      expect(power_used_w([-1.0, 2.0], 0.5)).toBeCloseTo(1.0, 5);
      expect(power_used_w([1.0, 2.0], -0.5)).toBe(0);
    });
  });

  describe('data_made_per_day and data_made_per_day_gb', () => {
    it('calculates daily data creation based on instrument rate and observe fraction', () => {
      const rates = [2.0, 0.8]; // 2.8 GB/day at 100%
      const result = data_made_per_day_gb(rates, 0.75);
      expect(result).toBeCloseTo(2.1, 5);
      expect(data_made_per_day(rates, 0.75)).toBe(result);
    });

    it('handles negative inputs safely', () => {
      expect(data_made_per_day_gb([-2.0, 1.0], 0.5)).toBeCloseTo(0.5, 5);
      expect(data_made_per_day_gb([2.0], -0.5)).toBe(0);
    });
  });

  describe('data_sent_per_day and data_sent_per_day_gb', () => {
    it('calculates daily data downlink volume', () => {
      // 0.025 GB/min (S-band), 50 min contact per day, link efficiency 0.90
      const result = data_sent_per_day_gb(0.025, 50, 0.9);
      expect(result).toBeCloseTo(1.125, 4);
      expect(data_sent_per_day(0.025, 50, 0.9)).toBe(result);
    });

    it('handles zero or negative inputs', () => {
      expect(data_sent_per_day_gb(0, 50, 0.9)).toBe(0);
      expect(data_sent_per_day_gb(0.025, -10, 0.9)).toBe(0);
      expect(data_sent_per_day_gb(-0.01, 50, 0.9)).toBe(0);
    });
  });

  describe('downlink_duration_days and division by zero guard', () => {
    it('calculates transfer time when data rate is positive', () => {
      const days = downlink_duration_days(5.0, 2.5);
      expect(days).toBeCloseTo(2.0, 5);
    });

    it('guards against division by zero in data rate without throwing or returning NaN', () => {
      const daysZeroRate = downlink_duration_days(5.0, 0);
      expect(daysZeroRate).toBe(Infinity);
      expect(Number.isNaN(daysZeroRate)).toBe(false);

      const daysNegativeRate = downlink_duration_days(5.0, -1.5);
      expect(daysNegativeRate).toBe(Infinity);
      expect(Number.isNaN(daysNegativeRate)).toBe(false);

      const daysZeroVolume = downlink_duration_days(0, 0);
      expect(daysZeroVolume).toBe(0);
    });
  });

  describe('cost_total and cost_total_m', () => {
    it('calculates lifecycle cost: build + launch + ops * lifetime', () => {
      const result = cost_total_m(0.25, 0.30, 0.02, 12);
      expect(result).toBeCloseTo(0.79, 4);
      expect(cost_total(0.25, 0.30, 0.02, 12)).toBe(result);
    });

    it('handles negative cost inputs safely without NaN', () => {
      const result = cost_total_m(-0.1, 0.3, -0.01, 10);
      expect(result).toBeCloseTo(0.3, 4);
    });
  });

  describe('margin(value, limit)', () => {
    it('calculates positive margin when under limit', () => {
      expect(margin(8, 10)).toBeCloseTo(0.20, 5);
    });

    it('calculates zero margin when exactly at limit', () => {
      expect(margin(10, 10)).toBeCloseTo(0.00, 5);
    });

    it('calculates negative margin when over limit', () => {
      expect(margin(12, 10)).toBeCloseTo(-0.20, 5);
    });

    it('guards against division by zero when limit is 0', () => {
      expect(margin(0, 0)).toBe(0.0);
      const res = margin(5, 0);
      expect(res).toBe(-Infinity);
      expect(Number.isNaN(res)).toBe(false);
    });

    it('handles negative inputs without producing NaN', () => {
      const res = margin(-5, 10);
      expect(res).toBeCloseTo(1.0, 5);
      expect(Number.isNaN(res)).toBe(false);
    });
  });
});
