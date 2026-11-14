import { describe, expect, it } from 'vitest';
import {
  checkDataCanBeSent,
  checkMassFitsVehicle,
  checkMassUnderClassLimit,
  checkPowerBalanced,
  checkTechnicalMargins,
  checkWithinBudget,
  runAllChecks
} from '../src/checks.js';
import {
  cubesatClasses,
  events,
  getCubesatClasses,
  getEvents,
  getObjectives,
  getOrbits,
  getParts,
  getVehicles,
  objectives,
  orbits,
  parts,
  vehicles
} from '../src/data.js';
import { power_generated_w, power_used_w } from '../src/formulas.js';
import type { CubeSatClass, Vehicle } from '../src/types.js';

describe('ORBITONE Hard Checks and Validation', () => {
  const testVehicle: Vehicle = {
    id: 'rideshare_dispenser',
    name: 'SmallSat Rideshare Dispenser',
    cost: 0.30,
    capacity_by_orbit: {
      leo: 24.0,
      sso: 16.0
    },
    fairing_size: '3U/6U Canister Dispenser',
    source: 'game',
    sources: {
      cost: 'NASA CubeSat 101 p.11',
      'capacity_by_orbit.leo': 'game',
      'capacity_by_orbit.sso': 'game'
    },
    explanation: 'Commercial rideshare dispenser for low orbits.'
  };

  const test1UClass: CubeSatClass = {
    id: '1U',
    name: '1U CubeSat',
    mass_limit_kg: 1.33,
    height_mm: 113.5,
    source: 'NASA CubeSat 101 pp.79-83',
    sources: {
      mass_limit_kg: 'NASA CubeSat 101 pp.79-83',
      height_mm: 'NASA CubeSat 101 pp.79-83'
    },
    explanation: 'Standard 1U CubeSat form factor.'
  };

  describe('Check 1: massFitsVehicle', () => {
    it('fails when spacecraft mass exceeds vehicle capacity', () => {
      // 25 kg exceeds 24 kg capacity for LEO
      const check = checkMassFitsVehicle(25.0, testVehicle, 'leo');
      expect(check.passed).toBe(false);
      expect(check.id).toBe('massFitsVehicle');
      expect(check.reason).toContain('exceeds vehicle');
      expect(check.suggestedFix).toBeDefined();
      expect(check.suggestedFix.length).toBeGreaterThan(0);
    });

    it('passes when spacecraft mass is exactly at vehicle capacity', () => {
      // Exactly 24.0 kg matches LEO capacity
      const check = checkMassFitsVehicle(24.0, testVehicle, 'leo');
      expect(check.passed).toBe(true);
      expect(check.id).toBe('massFitsVehicle');
      expect(check.reason).toContain('is within vehicle');
    });

    it('handles missing orbit in vehicle.capacity_by_orbit without throwing', () => {
      // Vehicle does not have geo in capacity_by_orbit
      expect(() => checkMassFitsVehicle(10.0, testVehicle, 'geo')).not.toThrow();
      const check = checkMassFitsVehicle(10.0, testVehicle, 'geo');
      expect(check.passed).toBe(false);
      expect(check.reason).toContain('does not support orbit "geo"');
      expect(check.suggestedFix).toContain('Choose a launch vehicle');
    });

    it('handles negative mass inputs safely', () => {
      const check = checkMassFitsVehicle(-5.0, testVehicle, 'leo');
      expect(check.passed).toBe(false);
      expect(check.reason).toContain('cannot be negative');
    });
  });

  describe('Check 2: powerBalanced', () => {
    it('fails power check in an eclipse-heavy orbit with small solar area', () => {
      // Small 1U solar panel (0.01 m^2) in eclipse-heavy LEO (sunlight fraction 0.62)
      // Generates only 1.364 W
      const generated = power_generated_w(0.01, 220, 0.62);
      // Payload uses 4.5 W
      const used = power_used_w([0.8, 1.5, 3.0], 1.0); // 5.3 W

      const check = checkPowerBalanced(used, generated);
      expect(check.passed).toBe(false);
      expect(check.id).toBe('powerBalanced');
      expect(check.reason).toContain('Power consumption');
      expect(check.reason).toContain('exceeds generated power');
      expect(check.suggestedFix).toContain('Increase solar panel area');
    });

    it('passes when generated power covers power consumption', () => {
      const generated = power_generated_w(0.06, 240, 0.72); // 10.368 W
      const used = power_used_w([0.8, 1.5, 3.0], 0.7); // 3.71 W
      const check = checkPowerBalanced(used, generated);
      expect(check.passed).toBe(true);
    });

    it('handles negative power inputs', () => {
      const check = checkPowerBalanced(-1, 5);
      expect(check.passed).toBe(false);
      expect(check.reason).toContain('cannot be negative');
    });
  });

  describe('Check 3: withinBudget (with 10% reserve)', () => {
    it('fails when total cost exceeds available budget minus 10% reserve', () => {
      // Budget = $1.0M. With 10% reserve, max allowable cost is $0.90M.
      // Total cost of $0.95M must fail!
      const check = checkWithinBudget(0.95, 1.0, 0.10);
      expect(check.passed).toBe(false);
      expect(check.id).toBe('withinBudget');
      expect(check.reason).toContain('exceeds maximum allowable spend');
      expect(check.reason).toContain('10%');
      expect(check.suggestedFix).toBeDefined();
    });

    it('passes when total cost is within budget after holding 10% reserve', () => {
      // Cost $0.85M <= $0.90M allowed
      const check = checkWithinBudget(0.85, 1.0, 0.10);
      expect(check.passed).toBe(true);
    });

    it('fails when cost is over total budget entirely', () => {
      const check = checkWithinBudget(1.20, 1.0, 0.10);
      expect(check.passed).toBe(false);
    });

    it('handles zero or negative budget safely', () => {
      const checkZero = checkWithinBudget(0.5, 0);
      expect(checkZero.passed).toBe(false);
      expect(checkZero.reason).toContain('must be greater than zero');

      const checkNegCost = checkWithinBudget(-0.2, 1.0);
      expect(checkNegCost.passed).toBe(false);
      expect(checkNegCost.reason).toContain('cannot be negative');
    });
  });

  describe('Check 4: massUnderClassLimit', () => {
    it('fails when a 1U design of 1.5 kg exceeds 1.33 kg class limit', () => {
      const check = checkMassUnderClassLimit(1.5, test1UClass);
      expect(check.passed).toBe(false);
      expect(check.id).toBe('massUnderClassLimit');
      expect(check.reason).toContain('exceeds the 1U class limit (1.33 kg)');
      expect(check.suggestedFix).toContain('stay under 1.33 kg');
    });

    it('passes when spacecraft mass is under the class limit', () => {
      const check = checkMassUnderClassLimit(1.20, test1UClass);
      expect(check.passed).toBe(true);
      expect(check.reason).toContain('is within the 1U limit');
    });

    it('handles negative mass safely', () => {
      const check = checkMassUnderClassLimit(-0.5, test1UClass);
      expect(check.passed).toBe(false);
      expect(check.reason).toContain('cannot be negative');
    });
  });

  describe('Check 5: dataCanBeSent (non-blocking warning)', () => {
    it('returns warning when daily downlink throughput is less than data made', () => {
      const check = checkDataCanBeSent(1.0, 2.5);
      expect(check.id).toBe('dataCanBeSent');
      expect(check.passed).toBe(false);
      expect(check.isWarning).toBe(true);
      expect(check.reason).toContain('less than instrument data generation');
      expect(check.suggestedFix).toContain('Upgrade to a higher-frequency transmitter');
    });

    it('passes when downlink throughput exceeds data made', () => {
      const check = checkDataCanBeSent(3.0, 2.5);
      expect(check.passed).toBe(true);
      expect(check.isWarning).toBe(true);
    });
  });

  describe('Soft warnings: checkTechnicalMargins', () => {
    it('warns when mass, power, or budget margins are below Level 1 threshold (15%)', () => {
      const warnings = checkTechnicalMargins({
        mass_margin: 0.08, // 8% < 15%
        power_margin: 0.12, // 12% < 15%
        budget_margin: 0.25 // 25% >= 15% (ok)
      }, 0.15);

      expect(warnings.length).toBe(2);
      expect(warnings.some((w) => w.id === 'lowMassMargin')).toBe(true);
      expect(warnings.some((w) => w.id === 'lowPowerMargin')).toBe(true);
      expect(warnings.every((w) => w.isWarning === true)).toBe(true);
    });
  });

  describe('runAllChecks master runner', () => {
    it('returns overall passed when all hard checks succeed', () => {
      const result = runAllChecks({
        total_mass_kg: 1.10,
        cubesat_class: test1UClass,
        vehicle: testVehicle,
        orbit_id: 'leo',
        power_used_w: 2.0,
        power_generated_w: 3.5,
        cost_total_m: 0.70,
        budget_m: 1.0,
        data_sent_per_day_gb: 2.0,
        data_made_per_day_gb: 1.5
      });

      expect(result.passed).toBe(true);
      expect(result.checks.length).toBe(5);
    });

    it('is deterministic: same input gives same output', () => {
      const input = {
        total_mass_kg: 1.10,
        cubesat_class: test1UClass,
        vehicle: testVehicle,
        orbit_id: 'leo',
        power_used_w: 2.0,
        power_generated_w: 3.5,
        cost_total_m: 0.70,
        budget_m: 1.0,
        data_sent_per_day_gb: 2.0,
        data_made_per_day_gb: 1.5
      };

      const res1 = runAllChecks(input);
      const res2 = runAllChecks(input);
      expect(res1).toEqual(res2);
    });
  });

  describe('Data Integrity: every JSON file loads and every number has a source', () => {
    it('loads cubesat_classes.json with valid numbers, sources, and explanations', () => {
      const classes = getCubesatClasses();
      expect(classes.length).toBeGreaterThanOrEqual(5);

      const u1 = classes.find((c) => c.id === '1U');
      expect(u1).toBeDefined();
      expect(u1?.mass_limit_kg).toBe(1.33);
      expect(u1?.height_mm).toBe(113.5);
      expect(u1?.source).toBe('NASA CubeSat 101 pp.79-83');

      const u1_5 = classes.find((c) => c.id === '1.5U');
      expect(u1_5?.mass_limit_kg).toBe(2.00);
      expect(u1_5?.height_mm).toBe(170.2);

      const u2 = classes.find((c) => c.id === '2U');
      expect(u2?.mass_limit_kg).toBe(2.66);
      expect(u2?.height_mm).toBe(227.0);

      const u3 = classes.find((c) => c.id === '3U');
      expect(u3?.mass_limit_kg).toBe(4.00);
      expect(u3?.height_mm).toBe(340.5);

      const u3plus = classes.find((c) => c.id === '3U+');
      expect(u3plus?.mass_limit_kg).toBe(4.00);
      expect(u3plus?.height_mm).toBe(340.5);

      const u6 = classes.find((c) => c.id === '6U');
      expect(u6).toBeDefined();
      expect(u6?.source).toBe('game');
      expect(u6?.sources.mass_limit_kg).toBe('game');
      expect(u6?.sources.height_mm).toBe('game');
      expect(u6?.explanation).not.toContain('twin-column');
      expect(u6?.explanation).toBe(
        'A 6U size exists (CubeSat 101 p.4); its mass and dimensions here are game values.'
      );

      for (const item of classes) {
        expect(item.explanation).toBeDefined();
        expect(item.explanation.length).toBeGreaterThan(0);
        expect(typeof item.mass_limit_kg).toBe('number');
        expect(typeof item.height_mm).toBe('number');
        expect(item.sources.mass_limit_kg).toBeDefined();
        expect(item.sources.height_mm).toBeDefined();
      }
    });

    it('loads objectives.json: 3 objectives with sources and explanations', () => {
      const objs = getObjectives();
      expect(objs.length).toBe(3);

      for (const obj of objs) {
        expect(obj.id).toBeDefined();
        expect(obj.name).toBeDefined();
        expect(obj.explanation).toBeDefined();
        expect(obj.source).toBeDefined();
        expect(obj.sources).toBeDefined();
        expect(typeof obj.min_level).toBe('number');
        expect(typeof obj.target_data_gb_per_day).toBe('number');
        expect(obj.sources.min_level).toBeDefined();
        expect(obj.sources.target_data_gb_per_day).toBeDefined();
      }
    });

    it('loads orbits.json: 4 orbits (LEO, SSO, GEO, high-energy) with sources and explanations', () => {
      const orbs = getOrbits();
      expect(orbs.length).toBe(4);

      const ids = orbs.map((o) => o.id);
      expect(ids).toContain('leo');
      expect(ids).toContain('sso');
      expect(ids).toContain('geo');
      expect(ids).toContain('high_energy');

      for (const orb of orbs) {
        expect(orb.explanation).toBeDefined();
        expect(orb.source).toBeDefined();
        expect(orb.sources).toBeDefined();
        expect(typeof orb.altitude_km).toBe('number');
        expect(typeof orb.sunlight_fraction).toBe('number');
        expect(typeof orb.contact_min_per_day).toBe('number');
        expect(typeof orb.launch_energy).toBe('number');
        expect(typeof orb.lifetime_penalty).toBe('number');
        expect(typeof orb.launch_period_days).toBe('number');

        expect(orb.sources.altitude_km).toBeDefined();
        expect(orb.sources.sunlight_fraction).toBeDefined();
        expect(orb.sources.contact_min_per_day).toBeDefined();
        expect(orb.sources.launch_energy).toBeDefined();
        expect(orb.sources.lifetime_penalty).toBeDefined();
        expect(orb.sources.launch_period_days).toBeDefined();
      }
    });

    it('loads vehicles.json: 3 vehicles with sources and explanations', () => {
      const vehs = getVehicles();
      expect(vehs.length).toBe(3);

      for (const v of vehs) {
        expect(v.explanation).toBeDefined();
        expect(v.source).toBeDefined();
        expect(v.sources).toBeDefined();
        expect(typeof v.cost).toBe('number');
        expect(v.sources.cost).toBeDefined();

        for (const [orbitId, capacity] of Object.entries(v.capacity_by_orbit)) {
          expect(typeof capacity).toBe('number');
          expect(v.sources[`capacity_by_orbit.${orbitId}`]).toBeDefined();
        }
      }
    });

    it('loads parts.json: ~15 parts across 7 categories with heritage flag, sources, and explanations', () => {
      const prts = getParts();
      expect(prts.length).toBeGreaterThanOrEqual(14);
      expect(prts.length).toBeLessThanOrEqual(18);

      const categories = new Set(prts.map((p) => p.category));
      expect(categories.has('structure')).toBe(true);
      expect(categories.has('power')).toBe(true);
      expect(categories.has('battery')).toBe(true);
      expect(categories.has('comms')).toBe(true);
      expect(categories.has('computer')).toBe(true);
      expect(categories.has('adcs')).toBe(true);
      expect(categories.has('instrument')).toBe(true);

      for (const part of prts) {
        expect(typeof part.heritage).toBe('boolean');
        expect(part.explanation).toBeDefined();
        expect(part.source).toBeDefined();
        expect(part.sources).toBeDefined();

        expect(typeof part.mass).toBe('number');
        expect(typeof part.power).toBe('number');
        expect(typeof part.cost).toBe('number');
        expect(typeof part.data_rate).toBe('number');
        expect(typeof part.level_unlocked).toBe('number');

        expect(part.sources.mass).toBeDefined();
        expect(part.sources.power).toBeDefined();
        expect(part.sources.cost).toBeDefined();
        expect(part.sources.data_rate).toBeDefined();
        expect(part.sources.level_unlocked).toBeDefined();
      }
    });

    it('loads events.json: 5 events with sources and explanations', () => {
      const evts = getEvents();
      expect(evts.length).toBe(5);

      for (const event of evts) {
        expect(event.explanation).toBeDefined();
        expect(event.source).toBeDefined();
        expect(event.sources).toBeDefined();
        expect(typeof event.min_level).toBe('number');
        expect(event.sources.min_level).toBeDefined();
      }
    });

    it('verifies exported data constants match loader functions', () => {
      expect(cubesatClasses).toEqual(getCubesatClasses());
      expect(objectives).toEqual(getObjectives());
      expect(orbits).toEqual(getOrbits());
      expect(vehicles).toEqual(getVehicles());
      expect(parts).toEqual(getParts());
      expect(events).toEqual(getEvents());
    });

    it('enforces rule: if any numeric field has source "game", top-level source must be "game"', () => {
      const datasets = [
        { name: 'cubesat_classes', items: getCubesatClasses() },
        { name: 'objectives', items: getObjectives() },
        { name: 'orbits', items: getOrbits() },
        { name: 'vehicles', items: getVehicles() },
        { name: 'parts', items: getParts() },
        { name: 'events', items: getEvents() }
      ];

      for (const { name, items } of datasets) {
        for (const item of items as any[]) {
          if (item.sources && typeof item.sources === 'object') {
            const sourceValues = Object.values(item.sources) as string[];
            const hasGameNumericSource = sourceValues.some((s) => s.toLowerCase() === 'game');

            if (hasGameNumericSource) {
              expect(
                item.source.toLowerCase().startsWith('nasa'),
                `${name} item "${item.id}" has numeric fields with source "game", so top-level source must not be NASA (was "${item.source}")`
              ).toBe(false);
              expect(item.source).toBe('game');
            } else if (item.source.toLowerCase().startsWith('nasa')) {
              for (const [field, src] of Object.entries(item.sources)) {
                expect(
                  (src as string).toLowerCase().startsWith('nasa'),
                  `${name} item "${item.id}" top-level source is NASA, but field "${field}" source is "${src}"`
                ).toBe(true);
              }
            }
          }
        }
      }
    });
  });
});
