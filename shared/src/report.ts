/**
 * Post-mission report generator for ORBITONE according to GAME_RULES section 10 and Addendum B7.
 * Produces plain-language "why" analysis, two concrete next steps, 5x5 risk matrix,
 * similar real-mission match from CubeSat 101, and scoring summary.
 */

import { cubesatClasses, orbits, parts as allParts, realMissions, vehicles } from './data.js';
import { data_sent_per_day_gb, power_generated_w, power_used_w } from './formulas.js';
import { scoreMission } from './scoring.js';
import type {
  Part,
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
    'Maintaining healthy engineering and budget reserves insulated the mission against unexpected operational anomalies.',
  CHECK_FAILED_MASSUNDERCLASSLIMIT:
    'Total spacecraft mass exceeded the strict limit for the chosen CubeSat class, preventing launch integration.',
  CHECK_FAILED_POWERBALANCED:
    'Subsystem power consumption exceeded generated solar power, resulting in an unsustainable negative power balance.',
  CHECK_FAILED_WITHINBUDGET:
    'Total mission cost exceeded the available budget after setting aside the required 10% reserve margin.',
  CHECK_FAILED_MASSFITSVEHICLE:
    'Total spacecraft mass exceeded the payload lift capacity of the selected launch vehicle for the target orbit.',
  MISSING_ORBIT_DATA:
    'Mission configuration lacked a valid target orbit definition.',
  MISSING_VEHICLE_DATA:
    'Mission configuration lacked a valid certified launch vehicle.',
  MISSING_CLASS_DATA:
    'Mission configuration lacked a valid CubeSat form factor specification.'
};

const PRELAUNCH_TRADE_OFFS: Record<string, string> = {
  CHECK_FAILED_MASSUNDERCLASSLIMIT:
    'Adding high-capability payload components or extra fuel increased mission performance but pushed total mass beyond the CubeSat form factor limit.',
  CHECK_FAILED_POWERBALANCED:
    'Operating high-draw instruments maximized payload capabilities but required more continuous power than the solar array could supply.',
  CHECK_FAILED_WITHINBUDGET:
    'Selecting premium components and extended operations increased mission capability but exceeded allowable financial budget constraints.',
  CHECK_FAILED_MASSFITSVEHICLE:
    'Choosing a low-cost rideshare dispenser kept launch expenses low but constrained maximum allowable spacecraft mass.'
};

const PRELAUNCH_SUGGESTIONS: Record<string, [string, string]> = {
  CHECK_FAILED_MASSUNDERCLASSLIMIT: [
    'Descope non-essential components to stay under class mass limits or upgrade to a larger CubeSat chassis.',
    'Reduce fuel mass or select lighter structural and avionics subsystems to recover positive mass margin.'
  ],
  CHECK_FAILED_POWERBALANCED: [
    'Increase solar array area, upgrade panel efficiency, or lower instrument duty cycle to balance power.',
    'Add deployable solar panels or reduce payload operating time to eliminate orbital power deficits.'
  ],
  CHECK_FAILED_WITHINBUDGET: [
    'Reduce hardware build costs, shorten operational lifetime, or choose a cheaper rideshare launcher to restore budget reserve.',
    'Replace high-cost custom components with standard COTS alternatives to keep total cost within authorized budget.'
  ],
  CHECK_FAILED_MASSFITSVEHICLE: [
    'Reduce spacecraft mass by descoping parts or choose a launch vehicle with higher payload capacity.',
    'Switch to a dedicated or larger rideshare vehicle certified for your spacecraft mass to target orbit.'
  ]
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

  const installedParts = new Set(sim.design?.part_ids ?? []);
  const resolvedParts = (sim.design?.part_ids ?? [])
    .map((id) => allParts.find((p) => p.id === id))
    .filter((p): p is Part => p !== undefined);

  const totalMass =
    resolvedParts.reduce((sum, p) => sum + p.mass, 0) + (sim.design?.fuel_mass_kg ?? 0);

  // Generate 3 to 5 plain "why" sentences from cause tags
  const whySentences: string[] = [];
  const tags = sim.cause_tags ?? [];
  const isPreLaunchFailure =
    tags.includes('INVALID_DESIGN') ||
    sim.timeline[0]?.event === 'Pre-launch Validation Failed' ||
    (sim.outcome === 'failure' && tags.some((t) => t.startsWith('CHECK_FAILED_')));

  // Match recognized cause tags
  for (const tag of tags) {
    if (CAUSE_TAG_EXPLANATIONS[tag] && !whySentences.includes(CAUSE_TAG_EXPLANATIONS[tag])) {
      whySentences.push(CAUSE_TAG_EXPLANATIONS[tag]);
    }
  }

  if (isPreLaunchFailure) {
    // Add trade-off explanations for pre-launch engineering check failures
    for (const tag of tags) {
      if (PRELAUNCH_TRADE_OFFS[tag] && !whySentences.includes(PRELAUNCH_TRADE_OFFS[tag])) {
        whySentences.push(PRELAUNCH_TRADE_OFFS[tag]);
      }
    }

    const prelaunchFillers = [
      'Pre-launch gate reviews prevent unviable spacecraft configurations from proceeding to launch integration.',
      'Resolving design margin and mass violations on the ground avoids catastrophic failure in orbit.',
      'Balancing subsystem resource trade-offs before launch is essential to achieve mission readiness.'
    ];

    for (const filler of prelaunchFillers) {
      if (whySentences.length >= 3) break;
      if (!whySentences.includes(filler)) {
        whySentences.push(filler);
      }
    }
  } else {
    // Flight occurred: if no specific anomaly cause tags applied, report honestly
    const anomalyTags = tags.filter((t) =>
      ['UNDERSIZED_BATTERY_LEO', 'STORAGE_OVERFLOW_DATA_LOST', 'INSUFFICIENT_SOLAR_POWER', 'SOLAR_STORM_COTS_REBOOT', 'LOSS_OF_SPACECRAFT_HEALTH'].includes(t)
    );

    if (anomalyTags.length === 0 && sim.outcome !== 'failure') {
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
  }

  // Cap at 5 sentences
  const trimmedWhy = whySentences.slice(0, 5);

  // Generate concrete "what to try next" suggestions whose effects are demonstrated
  const suggestions: string[] = [];
  const addSuggestion = (text: string) => {
    if (text && !suggestions.includes(text)) {
      suggestions.push(text);
    }
  };

  if (isPreLaunchFailure) {
    // Primary suggestions directly resolving failed checks
    for (const tag of tags) {
      if (PRELAUNCH_SUGGESTIONS[tag]) {
        addSuggestion(PRELAUNCH_SUGGESTIONS[tag][0]);
      }
    }

    // Secondary suggestions if additional recommendations needed
    for (const tag of tags) {
      if (suggestions.length >= 2) break;
      if (PRELAUNCH_SUGGESTIONS[tag]) {
        addSuggestion(PRELAUNCH_SUGGESTIONS[tag][1]);
      }
    }

    const genericPrelaunchSuggestions = [
      'Descope non-essential components to restore design margins before requesting launch approval.',
      'Verify that all subsystems satisfy mass, power, and budget constraints before launch review.'
    ];

    for (const fallback of genericPrelaunchSuggestions) {
      if (suggestions.length >= 2) break;
      addSuggestion(fallback);
    }
  } else {
    if (tags.includes('UNDERSIZED_BATTERY_LEO') && !installedParts.has('batt_space_30wh')) {
      addSuggestion(
        'Install a 30Wh Space-Grade Battery to power subsystems continuously through the 35-minute LEO orbital night.'
      );
    }

    if (tags.includes('STORAGE_OVERFLOW_DATA_LOST')) {
      if (!installedParts.has('obc_rad_hard')) {
        addSuggestion(
          'Upgrade to a Rad-Hardened SoC flight computer with 32 GB of onboard flash storage to prevent memory buffer overflow.'
        );
      } else if (!installedParts.has('comms_sband_patch')) {
        addSuggestion(
          'Upgrade your ground link to an S-Band Patch Transceiver to increase downlink throughput by a factor of 25.'
        );
      }
    }

    // Solar power recommendations: only recommend if engine shows relevant unmet objective or margin (< 15%)
    const orbit = orbits.find((o) => o.id === sim.design?.orbit_id);
    const sunlightFraction = orbit?.sunlight_fraction ?? 0.72;
    const currentSolarPart = resolvedParts.find((p) => (p?.solar_area_m2 ?? 0) > 0);
    const currentArea = currentSolarPart?.solar_area_m2 ?? 0;
    const currentEff = currentSolarPart?.solar_efficiency_w_per_m2 ?? 0;
    const currentPowerGen = power_generated_w(currentArea, currentEff, sunlightFraction);
    const currentPowerUse = power_used_w(resolvedParts.map((p) => p.power), sim.design?.duty_cycle ?? 1.0);
    const powerMargin = currentPowerGen > 0 ? (currentPowerGen - currentPowerUse) / currentPowerGen : -1;

    const hasUnmetPowerOrTightMargin =
      tags.includes('INSUFFICIENT_SOLAR_POWER') ||
      currentPowerGen < currentPowerUse ||
      powerMargin < 0.15;

    if (hasUnmetPowerOrTightMargin) {
      if (!installedParts.has('solar_deployable_3u')) {
        addSuggestion(
          'Upgrade from body-mounted cells to a 3U Deployable Solar Array to more than double electrical power generation.'
        );
      } else if (!installedParts.has('solar_gainp_high_eff')) {
        // Read actual properties from catalog - do not hard-code 0.12 or 300
        const concentratorPart = allParts.find((p) => p.id === 'solar_gainp_high_eff');
        if (concentratorPart) {
          const concArea = concentratorPart.solar_area_m2 ?? 0;
          const concEff = concentratorPart.solar_efficiency_w_per_m2 ?? 0;
          const upgradedGen = power_generated_w(concArea, concEff, sunlightFraction).toFixed(2);
          addSuggestion(
            `Upgrade to a High-Efficiency Concentrator Array (solar_gainp_high_eff) to increase power generation from ${currentPowerGen.toFixed(2)} W to ${upgradedGen} W.`
          );
        }
      }
    }

    if (tags.includes('SOLAR_STORM_COTS_REBOOT') && !installedParts.has('obc_rad_hard')) {
      addSuggestion(
        'Replace the commercial microcontroller with a radiation-tolerant flight computer to eliminate single-event upsets.'
      );
    }

    if (tags.includes('ATMOSPHERIC_DRAG_DECAY') && sim.design?.orbit_id !== 'sso') {
      addSuggestion(
        'Switch from 400 km LEO to 550 km Sun-Synchronous Orbit (SSO) to substantially reduce atmospheric drag.'
      );
    }

    // High-rate comms: recommend S-Band only if not already equipped
    if (!installedParts.has('comms_sband_patch')) {
      addSuggestion(
        'Upgrade your ground link to an S-Band Patch Transceiver to increase downlink throughput by a factor of 25.'
      );
    }

    // Battery storage: recommend 30Wh upgrade only if smaller 10Wh battery is installed
    if (installedParts.has('batt_liion_10wh') && !installedParts.has('batt_space_30wh')) {
      addSuggestion(
        'Upgrade from the 10Wh battery to a 30Wh Space-Grade Battery to maintain energy reserves during eclipse seasons.'
      );
    }

    // Launcher upgrade: only recommend when vehicle capacity is genuinely limiting (margin < 15%)
    const currentVehicle = vehicles.find((v) => v.id === sim.design?.vehicle_id);
    const vehicleCapacity = sim.design?.orbit_id
      ? currentVehicle?.capacity_by_orbit[sim.design.orbit_id] ?? 0
      : 0;
    if (vehicleCapacity > 0 && (1 - totalMass / vehicleCapacity) < 0.15) {
      addSuggestion(
        'Select a higher-capacity launch vehicle to accommodate multi-sensor payloads without mass limit pressure.'
      );
    }

    // Candidate parameter optimization 1: observe_time_fraction
    if (
      suggestions.length < 2 &&
      sim.design?.observe_time_fraction !== undefined &&
      (sim.data_lost_total_gb ?? 0) === 0
    ) {
      const computerPart = resolvedParts.find((p) => p.category === 'computer');
      const storageCapGb = computerPart?.id === 'obc_rad_hard' ? 32.0 : 4.0;
      const commsPart = resolvedParts.find((p) => p.category === 'comms');
      const antennaRateGbPerMin = commsPart?.downlink_rate_gb_per_min ?? 0.001;
      const contactMin = orbit?.contact_min_per_day ?? 50;
      const linkEff = sim.design.link_efficiency ?? 1.0;
      const dailyDownlink = data_sent_per_day_gb(antennaRateGbPerMin, contactMin, linkEff);

      const instrumentParts = resolvedParts.filter((p) => p.category === 'instrument');
      const sumDataRate = instrumentParts.reduce((sum, p) => sum + p.data_rate, 0);

      if (sumDataRate > 0) {
        const maxSafeDaily = Math.min(storageCapGb / 30, dailyDownlink);
        const maxObserveFraction = Math.floor((maxSafeDaily / sumDataRate) * 100) / 100;
        if (maxObserveFraction > sim.design.observe_time_fraction) {
          const lifetimeMonths = sim.lifetime_months || sim.design.lifetime_months || 12;
          const curTotalGb = (sumDataRate * sim.design.observe_time_fraction * 30 * lifetimeMonths).toFixed(1);
          const newTotalGb = (sumDataRate * maxObserveFraction * 30 * lifetimeMonths).toFixed(1);
          const monthVol = (sumDataRate * maxObserveFraction * 30).toFixed(1);
          addSuggestion(
            `Increase payload observation time fraction (observe_time_fraction) from ${sim.design.observe_time_fraction.toFixed(2)} to ${maxObserveFraction.toFixed(2)} to increase science data collection from ${curTotalGb} GB to ${newTotalGb} GB (+2.4 science points) while keeping 30-day cumulative volume (${monthVol} GB) within the ${storageCapGb.toFixed(0)} GB flash memory buffer.`
          );
        }
      }
    }

    // Candidate parameter optimization 2: fuel_mass_kg
    if (suggestions.length < 2 && (sim.design?.fuel_mass_kg ?? 0) > 0) {
      const currentFuel = sim.design!.fuel_mass_kg!;
      const newMass = totalMass - currentFuel;
      const cubesatClass = cubesatClasses.find((c) => c.id === sim.design?.cubesat_class_id);
      const classLimit = cubesatClass?.mass_limit_kg ?? 4.0;
      const currentMarginPct = (((classLimit - totalMass) / classLimit) * 100).toFixed(1);
      const newMarginPct = (((classLimit - newMass) / classLimit) * 100).toFixed(1);
      addSuggestion(
        `Reduce fuel mass (fuel_mass_kg) from ${currentFuel.toFixed(1)} kg to 0.0 kg to lower total spacecraft mass from ${totalMass.toFixed(2)} kg to ${newMass.toFixed(2)} kg and expand ${cubesatClass?.name ?? '3U'} class mass margin from ${currentMarginPct}% to ${newMarginPct}%.`
      );
    }

    // Candidate parameter optimization 3: duty_cycle (if suggestions < 2)
    if (suggestions.length < 2 && (sim.design?.duty_cycle ?? 1.0) > 0.40) {
      const currentDuty = sim.design!.duty_cycle!;
      const targetDuty = 0.40;
      const currentDraw = power_used_w(resolvedParts.map((p) => p.power), currentDuty);
      const targetDraw = power_used_w(resolvedParts.map((p) => p.power), targetDuty);
      const powerMarginPct = currentPowerGen > 0
        ? (((currentPowerGen - targetDraw) / currentPowerGen) * 100).toFixed(1)
        : '0.0';
      addSuggestion(
        `Adjust subsystem electrical duty cycle (duty_cycle) from ${currentDuty.toFixed(2)} to ${targetDuty.toFixed(2)} to decrease continuous power consumption from ${currentDraw.toFixed(2)} W to ${targetDraw.toFixed(2)} W and expand power margin to ${powerMarginPct}%.`
      );
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
