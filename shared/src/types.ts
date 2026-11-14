/**
 * Type definitions for ORBITONE shared package.
 */

export interface CubeSatClass {
  id: string;
  name: string;
  mass_limit_kg: number;
  height_mm: number;
  source: string;
  sources: Record<string, string>;
  explanation: string;
}

export interface Objective {
  id: string;
  name: string;
  description: string;
  needs: string[];
  recommended_orbits: string[];
  min_level: number;
  target_data_gb_per_day: number;
  baseline_science: string;
  threshold_science: string;
  critical_checklist_items: string[];
  source: string;
  sources: Record<string, string>;
  explanation: string;
}

export interface Orbit {
  id: string;
  name: string;
  altitude_km: number;
  sunlight_fraction: number;
  contact_min_per_day: number;
  launch_energy: number;
  lifetime_penalty: number;
  manifest_flexibility: string;
  launch_period_days: number;
  source: string;
  sources: Record<string, string>;
  explanation: string;
}

export interface Vehicle {
  id: string;
  name: string;
  cost: number;
  capacity_by_orbit: Record<string, number>;
  fairing_size: string;
  source: string;
  sources: Record<string, string>;
  explanation: string;
}

export type PartCategory =
  | 'structure'
  | 'power'
  | 'battery'
  | 'comms'
  | 'computer'
  | 'adcs'
  | 'instrument';

export interface Part {
  id: string;
  name: string;
  category: PartCategory;
  mass: number;
  power: number;
  cost: number;
  data_rate: number;
  solar_area_m2?: number;
  solar_efficiency_w_per_m2?: number;
  capacity_wh?: number;
  downlink_rate_gb_per_min?: number;
  level_unlocked: number;
  requires: string[];
  heritage: boolean;
  descopable: boolean;
  material: string;
  source: string;
  sources: Record<string, string>;
  explanation: string;
}

export interface MissionEvent {
  id: string;
  name: string;
  trigger: string;
  effect: string;
  explanation: string;
  min_level: number;
  source: string;
  sources: Record<string, string>;
  [key: string]: unknown;
}

export interface CheckResult {
  id: string;
  passed: boolean;
  reason: string;
  suggestedFix: string;
  isWarning?: boolean;
}

export interface MissionValidationResult {
  checks: CheckResult[];
  passed: boolean;
  warnings: CheckResult[];
}
