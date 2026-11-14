/**
 * Commander Nova — ORBITONE Mascot & Mission Co-Pilot
 *
 * Implements the "Astronaut Nova" Co-Pilot speech module defined in
 * Stitch Project 1937526940901217389 (Orbital Cadet design system).
 *
 * Provides contextual, scientifically grounded guidance for cadets (ages 7–12)
 * using verified component metadata, game rules, and live engine evaluation results.
 */

import type {
  CubeSatClass,
  Meters,
  MissionDesign,
  MissionValidationResult,
  Objective,
  Orbit,
  Part,
  Report,
  ScoreBreakdown,
  SimResult,
  Vehicle
} from '@shared';
import { renderIcon } from './icons';

export interface ActiveSelectionContext {
  type: 'objective' | 'orbit' | 'vehicle' | 'class' | 'part' | 'check' | 'none';
  id?: string;
  name?: string;
}

export interface NovaMessage {
  eyebrow: string;
  speech: string;
  tradeoff?: string;
  engineImpact?: string;
  nasaFact?: string;
  status: 'ready' | 'caution' | 'alert' | 'celebrate';
  highlightAction?: string;
}

/**
 * Renders the Commander Nova vector avatar.
 * Adheres to Stitch design specification:
 * Young cartoon astronaut in high-tech white helmet, orange telemetry straps,
 * cosmic gold reflection visor, cyan headset, and active microphone status beacon.
 */
export function renderMascotAvatar(size: number = 56): string {
  return `
    <div class="nova-avatar-wrapper" style="width:${size}px; height:${size}px; position:relative; flex-shrink:0;">
      <div style="width:100%; height:100%; border-radius:50%; overflow:hidden; background:#131c2b; box-shadow:0 0 16px rgba(123,208,255,0.3); border:2px solid #7bd0ff;">
        <img src="/assets/stitch/asset_16.jpg" alt="Commander Nova" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.src='https://lh3.googleusercontent.com/aida-public/AB6AXuCpKtq-YIFqvpjTIhLNlv4do7yyXEHw1R6vbtb1_xM9p6XdgdmmRdtoHwJOxMUjz5dnbpX7SKmAhFcORnoiZCaSlHffpg6Yu4SfaDK6DaFuJE2UwyhMnVA3WkktogXzypVQhefeJTXJ-VXpEhdWrm9RWRVZwYaAgciW14KaiLPiOzQNFVkKY_hDC1pJ5RX9txyrzgzXJMYFdwc0DSvibXURomjLZ3ZWPTX8_hXCxKM';" />
      </div>
      <!-- Live Status Beacon -->
      <span class="nova-status-beacon" title="Commander Nova Online" style="position:absolute; bottom:-2px; right:-2px; width:${Math.max(16, Math.round(size * 0.28))}px; height:${Math.max(16, Math.round(size * 0.28))}px; border-radius:50%; background:#51e77b; border:2px solid #081120; display:flex; align-items:center; justify-content:center; box-shadow:0 0 8px #51e77b;">
        <span class="material-symbols-outlined" style="font-size:${Math.max(10, Math.round(size * 0.18))}px; color:#003915; font-weight:bold;">mic</span>
      </span>
    </div>
  `;
}

/**
 * Builds a dynamic, contextual explanation from Commander Nova based on the current
 * stage, player selections, and live engine results.
 */
export function getNovaContextMessage(
  stage: number,
  design: MissionDesign,
  meters: Meters,
  validation: MissionValidationResult,
  selection: ActiveSelectionContext | null,
  catalogs: {
    objectives: Objective[];
    orbits: Orbit[];
    vehicles: Vehicle[];
    classes: CubeSatClass[];
    parts: Part[];
  },
  simResult?: SimResult | null,
  score?: ScoreBreakdown | null,
  report?: Report | null
): NovaMessage {
  // 1. Critical Hard Failure Override: If hard constraints fail, prioritize helpful guidance!
  const failedHardChecks = validation.checks.filter((c) => !c.passed && !c.isWarning);
  if (failedHardChecks.length > 0 && stage >= 4 && stage <= 6) {
    const primaryFail = failedHardChecks[0];
    return {
      eyebrow: 'NOVA // RANGE SAFETY ADVISORY',
      speech: `Hold countdown, Cadet! Pre-flight checks caught a constraint violation: ${primaryFail.reason}`,
      tradeoff: 'Rocket payloads must strictly respect mechanical, power, and budget limits to fly.',
      engineImpact: `Constraint flagged: ${primaryFail.id}`,
      nasaFact: 'NASA CubeSat Launch Initiative will not manifest spacecraft exceeding the dispenser mass limit.',
      status: 'alert',
      highlightAction: primaryFail.suggestedFix
    };
  }

  // 2. Active selection specific context
  if (selection && selection.type === 'part' && selection.id) {
    const part = catalogs.parts.find((p) => p.id === selection.id);
    if (part) {
      const isEquipped = (design.part_ids || []).includes(part.id);
      const actionText = isEquipped ? 'Equipped on your spacecraft' : 'In catalog (click to equip)';
      const netPower = part.power >= 0 ? `Consumes ${part.power.toFixed(1)} W` : `Generates ${Math.abs(part.power).toFixed(1)} W`;

      return {
        eyebrow: `NOVA // COMPONENT BRIEFING: ${part.name.toUpperCase()}`,
        speech: `“${part.explanation}”`,
        tradeoff: `Adding ${part.name} adds ${part.mass.toFixed(2)} kg to total spacecraft mass and draws $${part.cost.toFixed(2)}M from our project budget.`,
        engineImpact: `Mass: +${part.mass.toFixed(2)} kg | Power: ${netPower} | Status: ${actionText}`,
        nasaFact: part.heritage
          ? '✓ FLIGHT HERITAGE: This design has proven flight history on prior NASA missions, significantly reducing anomaly risk.'
          : '★ NEW TECHNOLOGY: Cutting-edge subsystem! Offers higher performance but carries development risk.',
        status: isEquipped ? 'ready' : 'caution'
      };
    }
  }

  if (selection && selection.type === 'objective' && selection.id) {
    const obj = catalogs.objectives.find((o) => o.id === selection.id);
    if (obj) {
      return {
        eyebrow: `NOVA // SCIENCE TARGET: ${obj.name.toUpperCase()}`,
        speech: `“Great scientific ambition, Cadet! For ${obj.name}, our primary goal is: ${obj.baseline_science}”`,
        tradeoff: `High data rate objectives require dedicated downlink antennas and orbital passes with long ground station contact times.`,
        engineImpact: `Target Data: ${obj.target_data_gb_per_day} GB/day | Recommended Orbits: ${obj.recommended_orbits.join(', ').toUpperCase()}`,
        nasaFact: 'NASA Principle: Scientific questions always come first. The objective determines the instrument, which determines the spacecraft bus.',
        status: 'ready'
      };
    }
  }

  if (selection && selection.type === 'orbit' && selection.id) {
    const orbit = catalogs.orbits.find((o) => o.id === selection.id);
    if (orbit) {
      const sunPct = Math.round(orbit.sunlight_fraction * 100);
      return {
        eyebrow: `NOVA // ORBITAL DYNAMICS: ${orbit.name.toUpperCase()}`,
        speech: `“${orbit.explanation}”`,
        tradeoff: `At ${orbit.altitude_km} km altitude, your solar panels receive ${sunPct}% sunlight per orbit. During the ${100 - sunPct}% shadow eclipse, batteries must carry all onboard power!`,
        engineImpact: `Altitude: ${orbit.altitude_km} km | Ground Contact: ${orbit.contact_min_per_day} min/day | Manifest: ${orbit.manifest_flexibility}`,
        nasaFact: 'CubeSat 101: Flexible launch date and orbit requirements make finding a rideshare slot much faster and cheaper.',
        status: 'ready'
      };
    }
  }

  if (selection && selection.type === 'vehicle' && selection.id) {
    const veh = catalogs.vehicles.find((v) => v.id === selection.id);
    if (veh) {
      return {
        eyebrow: `NOVA // LAUNCH VEHICLE: ${veh.name.toUpperCase()}`,
        speech: `“${veh.explanation}”`,
        tradeoff: `Dedicated launchers offer custom launch windows directly into your exact target orbit, but cost significantly more than commercial rideshare slots.`,
        engineImpact: `Launch Cost: $${veh.cost.toFixed(2)}M | Fairing Envelope: ${veh.fairing_size.toUpperCase()}`,
        nasaFact: 'NASA CSLI covers launch costs for selected educational satellites, typically matching payloads to secondary rideshare adapters.',
        status: 'ready'
      };
    }
  }

  if (selection && selection.type === 'class' && selection.id) {
    const cls = catalogs.classes.find((c) => c.id === selection.id);
    if (cls) {
      return {
        eyebrow: `NOVA // FORM FACTOR: ${cls.name}`,
        speech: `“${cls.explanation}”`,
        tradeoff: `A larger chassis fits deployable solar panels and bigger scientific cameras, but demands higher structural mass and costs more to launch.`,
        engineImpact: `Mass Limit: ${cls.mass_limit_kg.toFixed(2)} kg | Height: ${cls.height_mm} mm`,
        nasaFact: `CubeSat standard: 1U is a 10 cm cube with mass under 1.33 kg. 3U allows up to 4.00 kg. (Source: CubeSat 101, p. 4)`,
        status: 'ready'
      };
    }
  }

  // 3. Stage-level default context
  switch (stage) {
    case 1: {
      const obj = catalogs.objectives.find((o) => o.id === design.objective_id) || catalogs.objectives[0];
      return {
        eyebrow: 'NOVA // YOUR CO-PILOT',
        speech: `“Welcome to the Mission Design Lab, Cadet! What science shall we investigate? Selected: ${obj?.name}.”`,
        tradeoff: 'Scientific goals drive sensor requirements, which in turn drive power, mass, and downlink demands.',
        engineImpact: `Target Data: ${obj?.target_data_gb_per_day ?? 1} GB/day | Recommended: ${(obj?.recommended_orbits ?? ['sso']).join(', ').toUpperCase()}`,
        nasaFact: 'NASA SmallSat Principle: Begin with the end in mind. Always state your science question before building hardware!',
        status: 'ready'
      };
    }
    case 2: {
      return {
        eyebrow: 'NOVA // SYSTEMS ENGINEERING',
        speech: `“Here we break down our science goal into NASA Level-1 engineering requirements. Every single requirement must have a measurable verification method!”`,
        tradeoff: 'More rigorous requirements guarantee mission success, but increase test complexity and delivery schedule.',
        engineImpact: `All 5 Core Verification Tracks Monitored`,
        nasaFact: 'NASA SmallSat Institute mandates verification by Test, Analysis, Inspection, or Demonstration.',
        status: 'ready'
      };
    }
    case 3: {
      const orb = catalogs.orbits.find((o) => o.id === design.orbit_id);
      const veh = catalogs.vehicles.find((v) => v.id === design.vehicle_id);
      return {
        eyebrow: 'NOVA // ARCHITECTURE TRADES',
        speech: `“Now we explore our trade space! We are balancing orbital illumination in ${orb?.name || 'SSO'} against launch cost on ${veh?.name || 'our rocket'}.”`,
        tradeoff: 'Higher orbits have longer line-of-sight communication with ground stations, but require more delta-V to reach.',
        engineImpact: `Launch Cost: $${(veh?.cost ?? 12).toFixed(2)}M | Orbit Altitude: ${orb?.altitude_km ?? 550} km`,
        nasaFact: 'CubeSat 101: Rideshares must accept the primary payload’s schedule. If your CubeSat is late, the rocket leaves without it!',
        status: 'ready'
      };
    }
    case 4: {
      const classObj = catalogs.classes.find((c) => c.id === design.cubesat_class_id);
      const massVal = meters.mass.value.toFixed(2);
      const massLim = (classObj?.mass_limit_kg ?? 4.0).toFixed(2);
      const netPower = (meters.power.limit - meters.power.value).toFixed(1);
      return {
        eyebrow: 'NOVA // SATELLITE HANGAR',
        speech: `“Welcome to the modular spacecraft workbench! Equip subsystems from each category. Watch our 3D model assemble live on the turntable!”`,
        tradeoff: 'Every added instrument enhances science yield, but consumes electric power and adds mass toward the dispenser limit.',
        engineImpact: `Mass: ${massVal} / ${massLim} kg | Net Daylight Power: +${netPower} W | Parts: ${(design.part_ids || []).length} equipped`,
        nasaFact: 'NASA CML 4 requires an assembly-level Master Equipment List (MEL) with tracked mass and power margins.',
        status: meters.mass.state === 'fail' || meters.power.state === 'fail' ? 'caution' : 'ready'
      };
    }
    case 5: {
      const allPassed = validation.passed;
      return {
        eyebrow: 'NOVA // FLIGHT READINESS REVIEW',
        speech: allPassed
          ? `“All systems green, Flight Director! All mandatory structural, electrical, and budgetary hard constraints passed. Clear to proceed to the launchpad!”`
          : `“Attention Cadet! We have constraint warnings flagged below. Review the suggested engineering fixes to grant flight clearance.”`,
        tradeoff: 'Strict checks guarantee launch safety and mission survival in the harsh thermal vacuum of space.',
        engineImpact: `Hard Checks: ${allPassed ? 'ALL PASSED (GREEN)' : 'HOLD COUNTDOWN'} | Advisories: ${validation.warnings.length}`,
        nasaFact: 'Before any launch, NASA flight directors hold a formal Flight Readiness Review (FRR) where every subsystem lead signs off.',
        status: allPassed ? 'ready' : 'alert'
      };
    }
    case 6: {
      return {
        eyebrow: 'NOVA // LAUNCH CONTROL',
        speech: `“Ignition sequence start! Rocket ascent trajectory confirmed. Watch the telemetry gauges as we ascend through the atmosphere into orbit!”`,
        tradeoff: 'Dispenser deployment must wait until upper-stage cutoff to avoid payload collisions.',
        engineImpact: `Target Orbit: ${(catalogs.orbits.find((o) => o.id === design.orbit_id)?.name || 'SSO').toUpperCase()}`,
        nasaFact: 'CubeSat 101 commissioning: Deployment timers ensure antennas deploy after 30 minutes and radio beacons activate at 45 minutes.',
        status: 'ready'
      };
    }
    case 7:
    default: {
      const rank = score?.rank || 'Cadet';
      const outcome = report?.result || 'threshold_met';
      const outcomeStr = outcome === 'baseline_met' ? 'Full Baseline Mission Success' : outcome === 'threshold_met' ? 'Threshold Mission Success' : 'Mission Lost';
      return {
        eyebrow: 'NOVA // POST-FLIGHT DEBRIEF',
        speech: `“Congratulations Cadet! Our mission completed with: ${outcomeStr}! Final Score: ${score?.total ?? 75}/100. Rank achieved: ${rank.toUpperCase()}!”`,
        tradeoff: 'Review our flight debrief and 5x5 risk matrix to see where our design balanced science against engineering reserves.',
        engineImpact: `Score: ${score?.total ?? 75}/100 | Rank: ${rank}`,
        nasaFact: 'Real CubeSat missions like STMSat-1 and MinXSS proved that small university and school teams can conduct authentic NASA space science.',
        status: 'celebrate'
      };
    }
  }
}

