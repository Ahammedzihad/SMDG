/**
 * Post-mission report generator for ORBITONE according to GAME_RULES section 10 and Addendum B7.
 * Produces plain-language "why" analysis, two concrete next steps, 5x5 risk matrix,
 * similar real-mission match from CubeSat 101, and scoring summary.
 */

import { realMissions } from './data.js';
import { scoreMission } from './scoring.js';
import type {
  RealMission,
  Report,
  RiskMatrixItem,
  ScoreBreakdown,
  SimResult
} from './types.js';

const CAUSE_TAG_EXPLANATIONS: Record<string, string> = {
  UNDERSIZED_BATTERY_LEO:
    'Your battery was too small for the LEO eclipses, so the camera shut off every orbit.',
  STORAGE_OVERFLOW_DATA_LOST:
    'Onboard memory buffer capacity was too small for the instrument data generation rate, causing storage overflow and permanent data loss.',
  INSUFFICIENT_SOLAR_POWER:
    'Solar panel generation fell below continuous subsystem draw, forcing payload instruments into power-saving standby and sacrificing science return.',
  SOLAR_STORM_COTS_REBOOT:
    'A high-energy solar particle event triggered processor upsets in the unshielded commercial flight computer, disrupting observation schedules.',
  GROUND_OUTAGE_DATA_LOSS:
    'A 24-hour ground station network outage forced telemetry to queue onboard, exceeding available memory buffer capacity.',
  LAUNCH_DELAY_BUDGET_STRAIN:
    'A 30-day primary payload launch slip burned operational reserves, reducing financial flexibility for extended mission phases.',
  ATMOSPHERIC_DRAG_DECAY:
    'Elevated atmospheric drag in low Earth orbit decelerated the spacecraft, accelerating orbit decay at the expense of mission lifetime.',
  THERMAL_DRIFT_NON_HERITAGE:
    'Thermal cycling fatigue caused sensor calibration drift in unproven non-heritage instrumentation, degrading data accuracy.',
  INVALID_DESIGN:
    'The spacecraft configuration failed pre-launch engineering rules, preventing launch approval.',
  ZERO_LIFETIME:
    'Mission operations duration was set to zero, preventing scientific data collection.',
  LOSS_OF_SPACECRAFT_HEALTH:
    'Severe subsystem degradation depleted overall spacecraft health, terminating orbital operations prematurely.',
  INSUFFICIENT_SCIENCE_COLLECTED:
    'Total transmitted scientific data failed to reach minimum threshold targets due to subsystem constraints.',
  THRESHOLD_SCIENCE_ACHIEVED:
    'Your mission satisfied threshold science targets, confirming concept feasibility while accepting reduced payload duty cycles.',
  BASELINE_SCIENCE_ACHIEVED:
    'Your spacecraft balanced power generation, battery reserves, and downlink bandwidth effectively, fulfilling all baseline scientific objectives.',
  BALANCED_DESIGN:
    'All electrical, thermal, and data subsystems operated stably within required margins throughout orbital operations.',
  HEALTHY_RESERVES:
    'Maintaining healthy engineering and budget reserves insulated the mission against unexpected operational anomalies.'
};

/**
 * Finds a similar real-world NASA or partner CubeSat mission from Addendum D.
 * Matches strictly by objective type and size class. Returns null if no match fits.
 */
export function findSimilarRealMission(
  objectiveId?: string,
  cubesatClassId?: string
): RealMission | null {
  if (!objectiveId || !cubesatClassId) {
    return null;
  }

  // Exact matching against missions_real.json entries from CubeSat 101
  const match = realMissions.find(
    (m) => m.size_class === cubesatClassId && m.objective_type === objectiveId
  );

  return match ?? null;
}

/**
 * Builds the comprehensive post-mission report from simulation results and scores.
 *
 * @param sim Simulation result object.
 * @param score Optional score breakdown (computed automatically if omitted).
 * @returns Complete post-mission Report.
 */
export function buildReport(sim: SimResult, score?: ScoreBreakdown): Report {
  const finalScore = score ?? scoreMission(sim, 'solo');

  // Generate 3 to 5 plain "why" sentences from cause tags
  const whySentences: string[] = [];
  const tags = sim.cause_tags ?? [];

  // Match recognized cause tags
  for (const tag of tags) {
    if (CAUSE_TAG_EXPLANATIONS[tag]) {
      whySentences.push(CAUSE_TAG_EXPLANATIONS[tag]);
    }
  }

  // If no specific anomaly cause tags applied, report honestly
  const anomalyTags = tags.filter((t) =>
    ['UNDERSIZED_BATTERY_LEO', 'STORAGE_OVERFLOW_DATA_LOST', 'INSUFFICIENT_SOLAR_POWER', 'SOLAR_STORM_COTS_REBOOT', 'LOSS_OF_SPACECRAFT_HEALTH'].includes(t)
  );

  if (anomalyTags.length === 0) {
    whySentences.unshift('No anomalies or adverse cause tags occurred during this flight.');
  }

  // Ensure between 3 and 5 complete sentences
  const contextualFillers = [
    'Payload instrument selection directly traded observation data volume against downlink contact time over ground stations.',
    'Selecting flight-proven components balanced unit manufacturing costs against reliability in the space environment.',
    'Maintaining healthy engineering reserves insulated the mission against eclipse power drains and communication latencies.'
  ];

  for (const filler of contextualFillers) {
    if (whySentences.length >= 3) break;
    if (!whySentences.includes(filler)) {
      whySentences.push(filler);
    }
  }

  // Cap at 5 sentences
  const trimmedWhy = whySentences.slice(0, 5);

  // Generate exactly two concrete "what to try next" suggestions
  const suggestions: string[] = [];

  if (tags.includes('UNDERSIZED_BATTERY_LEO')) {
    suggestions.push(
      'Install a 30Wh Space-Grade Battery to power subsystems continuously through the 35-minute LEO orbital night.'
    );
  }

  if (tags.includes('STORAGE_OVERFLOW_DATA_LOST')) {
    suggestions.push(
      'Upgrade to a Rad-Hardened SoC flight computer with 32 GB of onboard flash storage to prevent memory buffer overflow.'
    );
  }

  if (tags.includes('INSUFFICIENT_SOLAR_POWER')) {
    suggestions.push(
      'Upgrade from body-mounted cells to a 3U Deployable Solar Array to more than double electrical power generation.'
    );
  }

  if (tags.includes('SOLAR_STORM_COTS_REBOOT')) {
    suggestions.push(
      'Replace the commercial microcontroller with a radiation-tolerant flight computer to eliminate single-event upsets.'
    );
  }

  if (tags.includes('ATMOSPHERIC_DRAG_DECAY')) {
    suggestions.push(
      'Switch from 400 km LEO to 550 km Sun-Synchronous Orbit (SSO) to substantially reduce atmospheric drag.'
    );
  }

  // Fallback high-value recommendations if primary list has fewer than 2
  const standardSuggestions = [
    'Upgrade your ground link to an S-Band Patch Transceiver to increase downlink throughput by a factor of 25.',
    'Increase battery storage capacity to maintain 35% technical energy margin during maximum eclipse seasons.',
    'Select a higher-capacity launch vehicle to accommodate multi-sensor payloads without mass limit pressure.'
  ];

  for (const fallback of standardSuggestions) {
    if (suggestions.length >= 2) break;
    if (!suggestions.includes(fallback)) {
      suggestions.push(fallback);
    }
  }

  const whatToTryNext: [string, string] = [suggestions[0], suggestions[1]];

  // 5x5 Likelihood x Consequence Risk Matrix items (CML 4 format, Addendum B7)
  const topRisks: RiskMatrixItem[] = [
    {
      risk: 'Orbital Eclipse Battery Depletion',
      likelihood: tags.includes('UNDERSIZED_BATTERY_LEO') ? 4 : 2,
      consequence: 4,
      mitigation: 'Size battery storage to sustain bus operations across maximum shadow duration with 35% margin.'
    },
    {
      risk: 'Onboard Memory Buffer Overflow',
      likelihood: tags.includes('STORAGE_OVERFLOW_DATA_LOST') ? 4 : 2,
      consequence: 3,
      mitigation: 'Equip high-capacity solid-state storage and upgrade to directional S-Band downlink transceiver.'
    },
    {
      risk: 'Solar Particle Radiation Upsets',
      likelihood: tags.includes('SOLAR_STORM_COTS_REBOOT') ? 4 : 2,
      consequence: 4,
      mitigation: 'Deploy radiation-hardened system-on-chip avionics with dual-redundant watchdog circuitry.'
    },
    {
      risk: 'Atmospheric Aerodynamic Drag Decay',
      likelihood: sim.design?.orbit_id === 'leo' ? 3 : 1,
      consequence: 3,
      mitigation: 'Raise orbital insertion altitude to 550 km SSO or integrate pulsed plasma micro-thrusters.'
    },
    {
      risk: 'Launch Manifest Schedule Slip',
      likelihood: 2,
      consequence: 5,
      mitigation: 'Maintain a minimum 10% budget reserve to absorb unexpected launch provider delays.'
    }
  ];

  // Match real mission from CubeSat 101 (Addendum D)
  const realMission = findSimilarRealMission(
    sim.design?.objective_id,
    sim.design?.cubesat_class_id
  );

  return {
    result: sim.outcome,
    timeline: sim.timeline,
    series: sim.series,
    why: trimmedWhy,
    what_to_try_next: whatToTryNext,
    top_risks: topRisks,
    similar_real_mission: realMission,
    score: finalScore,
    rank: finalScore.rank
  };
}
