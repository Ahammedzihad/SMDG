/**
 * Mission scoring system for ORBITONE according to GAME_RULES section 8.
 * Returns categorical score breakdown and assigned rank.
 */

import {
  RANK_THRESHOLDS,
  SCORE_WEIGHTS_SOLO,
  SCORE_WEIGHTS_TEAM
} from './config/balance.js';
import { parts as allParts } from './data.js';
import type { MissionRank, Part, ScoreBreakdown, SimResult } from './types.js';

/**
 * Determines player rank based on total score and official thresholds.
 * Cadet (0-39), Engineer (40-59), Mission Lead (60-79), Flight Director (80-100).
 */
export function getRankFromScore(totalScore: number): MissionRank {
  if (totalScore <= RANK_THRESHOLDS.CADET_MAX) {
    return 'Cadet';
  }
  if (totalScore <= RANK_THRESHOLDS.ENGINEER_MAX) {
    return 'Engineer';
  }
  if (totalScore <= RANK_THRESHOLDS.MISSION_LEAD_MAX) {
    return 'Mission Lead';
  }
  return 'Flight Director';
}

/**
 * Calculates official mission score and breakdown.
 *
 * @param sim Simulation result object.
 * @param mode 'solo' (default) or 'team'. In solo mode the 15 team points move to engineering quality.
 * @returns ScoreBreakdown with total and rank.
 */
export function scoreMission(
  sim: SimResult,
  mode: 'solo' | 'team' = 'solo'
): ScoreBreakdown {
  const isSolo = mode === 'solo';
  const weights = isSolo ? SCORE_WEIGHTS_SOLO : SCORE_WEIGHTS_TEAM;

  // 1. Mission Success (Weight: 30)
  let missionSuccessScore = 0;
  if (sim.outcome === 'baseline_met') {
    missionSuccessScore = weights.mission_success;
  } else if (sim.outcome === 'threshold_met') {
    missionSuccessScore = Math.round(weights.mission_success * 0.67);
  } else {
    // Failure
    missionSuccessScore = sim.final_health > 50 ? Math.round(weights.mission_success * 0.20) : 0;
  }

  // 2. Science Value (Weight: 20)
  // Science collected against nominal 100 baseline
  const scienceRatio = Math.min(1.0, Math.max(0, sim.science_collected / 100.0));
  const scienceValueScore = Math.round(scienceRatio * weights.science_value);

  // 3. Resource Efficiency (Weight: 20)
  // Evaluates data downlink ratio, health preservation, and budget margin
  const dataTotal = sim.data_generated_total_gb;
  const dataRatio = dataTotal > 0 ? Math.min(1.0, sim.data_transmitted_total_gb / dataTotal) : 1.0;
  const healthRatio = Math.min(1.0, Math.max(0, sim.final_health / 100.0));
  const hasRemainingBudget = (sim.series?.budget_remaining_m?.slice(-1)[0] ?? 0) > 0;

  const resourceEfficiencyScore = Math.round(
    (dataRatio * 0.50 + healthRatio * 0.30 + (hasRemainingBudget ? 0.20 : 0.05)) *
      weights.resource_efficiency
  );

  // 4. Engineering Quality (Weight: 30 in solo, 15 in team)
  const resolvedParts = (sim.design?.part_ids ?? [])
    .map((id) => allParts.find((p) => p.id === id))
    .filter((p): p is Part => p !== undefined);

  const heritageCount = resolvedParts.filter((p) => p.heritage).length;
  const heritageRatio = resolvedParts.length > 0 ? heritageCount / resolvedParts.length : 0.5;

  const penaltyTags = ['UNDERSIZED_BATTERY_LEO', 'STORAGE_OVERFLOW_DATA_LOST', 'INVALID_DESIGN'];
  const hasSeverePenalty = sim.cause_tags?.some((t) => penaltyTags.includes(t)) ?? false;
  const penaltyFactor = hasSeverePenalty ? 0.70 : 1.0;

  const engineeringQualityScore = Math.round(
    ((heritageRatio * 0.40 + healthRatio * 0.60) * penaltyFactor) *
      weights.engineering_quality
  );

  // 5. Team Coordination (Weight: 0 in solo, 15 in team)
  let teamCoordinationScore = 0;
  if (!isSolo) {
    teamCoordinationScore = weights.team_coordination;
  }

  const totalRaw =
    missionSuccessScore +
    scienceValueScore +
    resourceEfficiencyScore +
    engineeringQualityScore +
    teamCoordinationScore;

  const total = Math.min(100, Math.max(0, totalRaw));
  const rank = getRankFromScore(total);

  return {
    mission_success: missionSuccessScore,
    science_value: scienceValueScore,
    resource_efficiency: resourceEfficiencyScore,
    engineering_quality: engineeringQualityScore,
    team_coordination: teamCoordinationScore,
    total,
    rank,
    mode
  };
}
