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
  baseline_science_target?: number;
  threshold_science_target?: number;
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

export interface RealMission {
  id: string;
  name: string;
  organization: string;
  objective_type: string;
  size_class: string;
  description: string;
  source: string;
  explanation: string;
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

export interface MissionDesign {
  cubesat_class_id: string;
  orbit_id: string;
  vehicle_id: string;
  part_ids: string[];
  objective_id?: string;
  fuel_mass_kg?: number;
  budget_m?: number;
  lifetime_months?: number;
  duty_cycle?: number;
  observe_time_fraction?: number;
  link_efficiency?: number;
}

export type MissionOutcome = 'failure' | 'threshold_met' | 'baseline_met';

export interface TimelineEntry {
  month: number;
  event: string;
  description: string;
}

export interface MonthlySeries {
  months: number[];
  power_w: number[];
  data_stored_gb: number[];
  budget_remaining_m: number[];
  health: number[];
}

export interface EventApplied {
  event_id: string;
  month: number;
  name: string;
  cause: string;
  mitigation_hint: string;
}

export interface SimResult {
  outcome: MissionOutcome;
  timeline: TimelineEntry[];
  series: MonthlySeries;
  events_applied: EventApplied[];
  cause_tags: string[];
  science_collected: number;
  data_generated_total_gb: number;
  data_transmitted_total_gb: number;
  data_lost_total_gb: number;
  final_health: number;
  lifetime_months: number;
  design: MissionDesign;
  error?: string;
}

export type MissionRank = 'Cadet' | 'Engineer' | 'Mission Lead' | 'Flight Director';

export interface ScoreBreakdown {
  mission_success: number;
  science_value: number;
  resource_efficiency: number;
  engineering_quality: number;
  team_coordination: number;
  total: number;
  rank: MissionRank;
  mode: 'solo' | 'team';
}

export interface RiskMatrixItem {
  risk: string;
  likelihood: number; // 1 to 5
  consequence: number; // 1 to 5
  mitigation: string;
}

export interface Report {
  result: MissionOutcome;
  timeline: TimelineEntry[];
  series: MonthlySeries;
  why: string[];
  what_to_try_next: [string, string];
  top_risks: RiskMatrixItem[];
  similar_real_mission: RealMission | null;
  score: ScoreBreakdown;
  rank: MissionRank;
}

export type MeterState = 'ok' | 'warning' | 'fail';
export type MeterId = 'mass' | 'power' | 'budget' | 'data' | 'communications' | 'time';

export interface MeterItem {
  id: MeterId;
  label: string;
  value: number;
  limit: number;
  unit: string;
  state: MeterState;
  why: string;
}

export interface Meters {
  mass: MeterItem;
  power: MeterItem;
  budget: MeterItem;
  data: MeterItem;
  communications: MeterItem;
  time: MeterItem;
}
