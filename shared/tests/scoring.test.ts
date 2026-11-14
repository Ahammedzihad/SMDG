import { describe, expect, it } from 'vitest';
import {
  SCORE_WEIGHTS_SOLO,
  SCORE_WEIGHTS_TEAM
} from '../src/config/balance.js';
import { getRankFromScore, scoreMission } from '../src/scoring.js';
import type { SimResult } from '../src/types.js';

describe('ORBITONE Mission Scoring', () => {
  it('score weights sum to 100 in both solo and team modes', () => {
    const teamSum =
      SCORE_WEIGHTS_TEAM.mission_success +
      SCORE_WEIGHTS_TEAM.science_value +
      SCORE_WEIGHTS_TEAM.resource_efficiency +
      SCORE_WEIGHTS_TEAM.engineering_quality +
      SCORE_WEIGHTS_TEAM.team_coordination;

    expect(teamSum).toBe(100);

    const soloSum =
      SCORE_WEIGHTS_SOLO.mission_success +
      SCORE_WEIGHTS_SOLO.science_value +
      SCORE_WEIGHTS_SOLO.resource_efficiency +
      SCORE_WEIGHTS_SOLO.engineering_quality +
      SCORE_WEIGHTS_SOLO.team_coordination;

    expect(soloSum).toBe(100);
  });

  it('solo mode moves the 15 team coordination points into engineering quality', () => {
    expect(SCORE_WEIGHTS_TEAM.engineering_quality).toBe(15);
    expect(SCORE_WEIGHTS_TEAM.team_coordination).toBe(15);

    expect(SCORE_WEIGHTS_SOLO.engineering_quality).toBe(30);
    expect(SCORE_WEIGHTS_SOLO.team_coordination).toBe(0);
  });

  it('correctly maps ranks across exact boundary thresholds: 39/40, 59/60, 79/80', () => {
    // Cadet: 0 to 39
    expect(getRankFromScore(0)).toBe('Cadet');
    expect(getRankFromScore(20)).toBe('Cadet');
    expect(getRankFromScore(39)).toBe('Cadet');

    // Boundary 39 / 40 -> Engineer
    expect(getRankFromScore(40)).toBe('Engineer');
    expect(getRankFromScore(50)).toBe('Engineer');
    expect(getRankFromScore(59)).toBe('Engineer');

    // Boundary 59 / 60 -> Mission Lead
    expect(getRankFromScore(60)).toBe('Mission Lead');
    expect(getRankFromScore(70)).toBe('Mission Lead');
    expect(getRankFromScore(79)).toBe('Mission Lead');

    // Boundary 79 / 80 -> Flight Director
    expect(getRankFromScore(80)).toBe('Flight Director');
    expect(getRankFromScore(95)).toBe('Flight Director');
    expect(getRankFromScore(100)).toBe('Flight Director');
  });

  it('scores a successful simulation appropriately and returns full breakdown', () => {
    const mockSuccessSim: SimResult = {
      outcome: 'baseline_met',
      timeline: [],
      series: {
        months: [1, 2, 3],
        power_w: [10, 10, 10],
        data_stored_gb: [1, 1, 1],
        budget_remaining_m: [0.5, 0.4, 0.3],
        health: [100, 100, 100]
      },
      events_applied: [],
      cause_tags: ['BASELINE_SCIENCE_ACHIEVED'],
      science_collected: 100.0,
      data_generated_total_gb: 50.0,
      data_transmitted_total_gb: 50.0,
      data_lost_total_gb: 0.0,
      final_health: 100.0,
      lifetime_months: 12,
      design: {
        cubesat_class_id: '3U',
        orbit_id: 'sso',
        vehicle_id: 'rideshare_dispenser',
        part_ids: ['struct_3u', 'solar_deployable_3u', 'batt_space_30wh', 'obc_rad_hard']
      }
    };

    const soloScore = scoreMission(mockSuccessSim, 'solo');
    expect(soloScore.mode).toBe('solo');
    expect(soloScore.total).toBeGreaterThanOrEqual(80);
    expect(soloScore.rank).toBe('Flight Director');
    expect(soloScore.team_coordination).toBe(0);

    const teamScore = scoreMission(mockSuccessSim, 'team');
    expect(teamScore.mode).toBe('team');
    expect(teamScore.total).toBeGreaterThanOrEqual(80);
    expect(teamScore.team_coordination).toBe(15);
  });
});
