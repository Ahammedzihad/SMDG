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
  type: 'objective' | 'orbit' | 'vehicle' | 'class' | 'part' | 'check' | 'parameter' | 'none';
  id?: string;
  name?: string;
}

export interface LastActionNotice {
  type: 'add' | 'remove' | 'replace' | 'undo' | 'reset';
  partId?: string;
  oldPartId?: string;
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
 * Scientifically grounded, child-friendly dialogue data for all 16 shared catalogue components.
 * Formatted for cadets aged 7–12: short, natural sentences, clear explanations of technical terms,
 * and verified real-world space facts.
 */
export const COMPONENT_DIALOGUES: Record<
  string,
  { speech: string; tradeoff: string; nasaFact: string }
> = {
  struct_1u: {
    speech: 'This standard 1U frame is a compact 10-centimeter cube. It is super lightweight and fits easily into standard rocket dispensers!',
    tradeoff: 'It is light and easy to fly, but the small space inside limits how many instruments you can pack in.',
    nasaFact: 'A standard 1U CubeSat measures 10 cm on each side and has a mass limit of 1.33 kg. (Source: CubeSat 101)'
  },
  struct_3u: {
    speech: 'This 3U frame is three cubes long! It gives us extra room inside for bigger cameras, instruments, and unfolding solar panels.',
    tradeoff: 'It gives us three times the room, but it weighs more and takes a bigger bite out of our weight budget.',
    nasaFact: 'NASA regularly launches 3U CubeSats because the extra volume fits precision steering wheels and scientific sensors.'
  },
  solar_body_1u: {
    speech: 'These solar panels glue flat against the satellite walls. They have no moving parts, so there is nothing to get stuck in space!',
    tradeoff: 'Because they stay flat against the satellite, they catch less sunlight and make a modest amount of power.',
    nasaFact: 'Flat body-mounted solar panels are very dependable because they never need mechanical hinges to unfold.'
  },
  solar_deployable_3u: {
    speech: 'These solar wings fold up for launch and spring open in space! They catch lots of sunlight to power all our instruments.',
    tradeoff: 'Unfolding wings generate plenty of electricity, but spring hinges add weight and have mechanical parts.',
    nasaFact: 'Engineers test unfolding solar wings in special vacuum chambers on Earth to ensure the hinges open smoothly in space.'
  },
  solar_gainp_high_eff: {
    speech: 'These high-tech solar cells are made of special crystal layers that soak up extra sunlight. They give us maximum power in a small space!',
    tradeoff: 'They produce the most electricity, but advanced materials make them more expensive.',
    nasaFact: 'Multi-junction solar cells stack different semiconductor layers to convert multiple colors of sunlight into electricity.'
  },
  batt_liion_10wh: {
    speech: 'A handy rechargeable lithium-ion battery. It stores power in the sunshine so our satellite stays awake when Earth blocks the Sun!',
    tradeoff: 'It is lightweight and reliable, but it holds only enough energy for basic computers and low-power instruments.',
    nasaFact: 'Space batteries use small built-in heaters to stay warm when traveling through the freezing shadow of Earth.'
  },
  batt_space_30wh: {
    speech: 'This heavy-duty battery holds three times more energy! It easily powers scientific cameras and transmitters through the orbital night.',
    tradeoff: 'It gives us extra energy in the dark, but the protective shielding adds extra weight.',
    nasaFact: 'Space-grade battery packs use specialized safety circuits to bypass any individual cell that wears out in orbit.'
  },
  comms_uhf_vhf: {
    speech: 'A simple whip antenna that sends out basic radio signals. It uses very little power and tells ground stations that our satellite is healthy!',
    tradeoff: 'This sends basic health signals, but big files take much longer to download.',
    nasaFact: 'Many university CubeSats use amateur radio bands so students and radio operators around the world can listen in.'
  },
  comms_sband_patch: {
    speech: 'A high-speed flat dish antenna that beams scientific data down to Earth in a flash! It sends big photos and measurements down quickly.',
    tradeoff: 'It downlinks data fast, but it uses more battery power and must point toward the ground station.',
    nasaFact: 'NASA ground stations use S-band radio frequencies to download scientific images from orbiting spacecraft.'
  },
  obc_cots_mcu: {
    speech: 'A compact computer chip like the ones in gadgets on Earth. It runs our satellite software and keeps mission costs low!',
    tradeoff: 'It is cheap and easy to program, but it has less shielding against space radiation.',
    nasaFact: 'NASA has flown commercial microcontrollers on CubeSats to test low-cost technology in low Earth orbit.'
  },
  obc_rad_hard: {
    speech: 'A radiation-shielded space computer built with triple backup circuits! If a stray cosmic ray flips a number, the computer fixes it instantly.',
    tradeoff: 'It keeps our satellite safe from space radiation, but costs more than an everyday computer chip.',
    nasaFact: 'Radiation-hardened computers run three calculations at the same time and vote on the correct answer to block cosmic ray errors.'
  },
  adcs_passive_magnetorquer: {
    speech: 'Magnetic coils that gently push against Earth magnetic field, just like a compass needle! It keeps the satellite upright with zero moving parts.',
    tradeoff: 'It is simple and will never wear out, but it turns the satellite slowly and cannot point at targets with high precision.',
    nasaFact: 'Magnetic attitude control has been used since early space missions because it uses Earth natural magnetic field.'
  },
  adcs_3axis_wheels: {
    speech: 'Electric motors spin heavy wheels inside! Speeding up or slowing down a wheel uses conservation of angular momentum to rotate the satellite smoothly in the opposite direction without rocket thrusters.',
    tradeoff: 'They give us pinpoint pointing for sharp pictures, but spinning wheels draw continuous electrical power.',
    nasaFact: 'Reaction wheels use the law of conservation of angular momentum: spinning a wheel one way turns the spacecraft the opposite way.'
  },
  inst_multispectral_imager: {
    speech: 'A space camera that captures visible light and invisible infrared light! It snaps colorful photos of forests, lakes, and farmland from orbit.',
    tradeoff: 'It takes amazing photos of Earth, but creates large data files that need lots of time and power to send down.',
    nasaFact: 'Multispectral cameras on NASA Landsat satellites have monitored Earth forests, crops, and fresh water for over 50 years.'
  },
  inst_plasma_probe: {
    speech: 'A sensor that reaches out into space to count charged particles called ions and electrons! It measures space weather around our satellite.',
    tradeoff: 'It measures the electric space environment, but works best on the night side of Earth where sunlight does not interfere.',
    nasaFact: 'Langmuir probes have flown on NASA sounding rockets and satellites to measure electric currents in the upper atmosphere.'
  },
  inst_xray_photometer: {
    speech: 'A solar sensor that stares right at the Sun to detect high-energy X-rays! It watches for powerful solar flares.',
    tradeoff: 'It collects valuable solar flare data, but our satellite must stay pointed directly at the Sun.',
    nasaFact: 'NASA MinXSS CubeSat used a miniaturized X-ray detector to study how solar flares warm Earth upper atmosphere.'
  }
};

/**
 * Stage introduction dialogues for all 7 stages.
 * Child-friendly, encouraging, and natural for young space cadets.
 */
export const STAGE_INTRO_DIALOGUES: Record<
  number,
  { title: string; speech: string; tradeoff: string; nasaFact: string }
> = {
  1: {
    title: 'CHOOSE YOUR MISSION',
    speech: 'Welcome to Orbit Mission Academy, Cadet! Every space mission starts with a big question. Pick what you want to explore from space!',
    tradeoff: 'Bigger science goals collect more data, so we will need stronger radios and more battery power!',
    nasaFact: 'NASA begins every robotic mission with clear science goals before building any spacecraft hardware.'
  },
  2: {
    title: 'MISSION REQUIREMENTS',
    speech: 'Time to set our mission guidelines! In space engineering, teams define core project requirements so everyone agrees on what our satellite must accomplish.',
    tradeoff: 'Clear requirements keep our project focused, but we must make sure every target can be tested.',
    nasaFact: 'Educational space projects use clear mission requirements inspired by NASA systems engineering practices to guide their designs.'
  },
  3: {
    title: 'ORBIT & ROCKET CHOICES',
    speech: 'Let us compare our choices and find the best orbit and rocket! We need to balance sunlight, altitude, and our budget.',
    tradeoff: 'Flying higher gives our satellite more time to talk to ground stations, but rockets cost more to get there.',
    nasaFact: 'Most small satellites hitch a ride on larger rockets, so they have to follow the main mission launch schedule!'
  },
  4: {
    title: 'BUILD YOUR SPACECRAFT',
    speech: 'Welcome to the cleanroom! Pick the parts for your CubeSat and watch the 3D model assemble right before your eyes.',
    tradeoff: 'Adding powerful instruments collects more science, but uses up electric power and adds weight.',
    nasaFact: 'Real spacecraft are built in spotless cleanrooms so dust specks never harm delicate solar cells or sensors.'
  },
  5: {
    title: 'SAFETY CHECK & REVIEW',
    speech: 'Time for our flight safety check! We make sure our satellite is not too heavy, has enough power, and stays within budget before launch.',
    tradeoff: 'Checking every detail now prevents surprises once our satellite is high in orbit!',
    nasaFact: 'Before every launch, NASA holds a Flight Readiness Review where team leaders verify that the spacecraft is safe to fly.'
  },
  6: {
    title: 'LAUNCH & ORBIT INSERTION',
    speech: '3, 2, 1... Liftoff! Watch the rocket soar into the sky and release our CubeSat safely into orbit!',
    tradeoff: 'Our satellite waits until the rocket is safely clear before springing away into its own orbit.',
    nasaFact: 'CubeSat dispensers use a gentle spring to push satellites smoothly into space once the rocket engine shuts off.'
  },
  7: {
    title: 'MISSION RESULTS',
    speech: 'Mission complete, Cadet! Check out the science data we collected, the photos sent home, and your final score. Great job!',
    tradeoff: 'Compare your final score with your choices to see how balancing power and weight helped your mission succeed.',
    nasaFact: 'Data beamed down by small satellites helps scientists on Earth study our planet climate and space weather.'
  }
};

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
  report?: Report | null,
  lastAction?: LastActionNotice
): NovaMessage {
  // 1. Dynamic Action Responses (Add, Remove, Replace, Undo, Reset)
  if (lastAction) {
    if (lastAction.type === 'replace' && lastAction.partId && lastAction.oldPartId) {
      const oldPart = catalogs.parts.find((p) => p.id === lastAction.oldPartId);
      const newPart = catalogs.parts.find((p) => p.id === lastAction.partId);
      const intel = COMPONENT_DIALOGUES[lastAction.partId];
      return {
        eyebrow: `NOVA // SUBSYSTEM SWAPPED: ${newPart?.name?.toUpperCase() ?? 'NEW MODULE'}`,
        speech: `Swapped out ${oldPart?.name ?? 'previous component'} for ${newPart?.name ?? 'the new module'}! ${intel?.speech ?? ''}`,
        tradeoff: intel?.tradeoff ?? 'Swapping parts changes how much power our satellite uses and how much weight it carries.',
        engineImpact: `Equipped: ${newPart?.name ?? 'Module'} (Mass: ${newPart?.mass.toFixed(2)} kg, Cost: $${newPart?.cost.toFixed(2)}M)`,
        nasaFact: intel?.nasaFact ?? 'NASA engineers test many part combinations to find the safest and most efficient design.',
        status: 'ready'
      };
    }

    if (lastAction.type === 'add' && lastAction.partId) {
      const part = catalogs.parts.find((p) => p.id === lastAction.partId);
      const intel = COMPONENT_DIALOGUES[lastAction.partId];
      return {
        eyebrow: `NOVA // EQUIPPED: ${part?.name?.toUpperCase() ?? 'SUBSYSTEM'}`,
        speech: `Installed the ${part?.name ?? 'component'}! ${intel?.speech ?? (part?.explanation ?? '')}`,
        tradeoff: intel?.tradeoff ?? `Adds ${part?.mass.toFixed(2) ?? 0} kg of weight to our satellite.`,
        engineImpact: `Mass: +${part?.mass.toFixed(2) ?? 0} kg | Power: ${part && part.power >= 0 ? `-${part.power.toFixed(1)} W` : `+${Math.abs(part?.power ?? 0).toFixed(1)} W`}`,
        nasaFact: intel?.nasaFact ?? 'Every flight part is tested on shaking tables and in vacuum chambers before launch.',
        status: 'ready'
      };
    }

    if (lastAction.type === 'remove' && lastAction.partId) {
      const part = catalogs.parts.find((p) => p.id === lastAction.partId);
      return {
        eyebrow: `NOVA // REMOVED: ${part?.name?.toUpperCase() ?? 'SUBSYSTEM'}`,
        speech: `Removed the ${part?.name ?? 'module'} from our satellite! That freed up weight and electric power.`,
        tradeoff: 'Taking a part off saves weight and money, but removes what that part did for our mission.',
        engineImpact: `Freed Mass: -${part?.mass.toFixed(2) ?? 0} kg | Budget Saved: $${part?.cost.toFixed(2) ?? 0}M`,
        nasaFact: 'If a spacecraft gets too heavy, engineers simplify the design by removing non-essential parts.',
        status: 'caution'
      };
    }

    if (lastAction.type === 'undo') {
      return {
        eyebrow: 'NOVA // ACTION UNDONE',
        speech: 'Undid your last change! Your spacecraft is back to how it was right before that step.',
        tradeoff: 'You can try out new ideas and undo them anytime without losing your progress!',
        engineImpact: `Active Parts: ${(design.part_ids || []).length} modules slotted | Mass: ${meters.mass.value.toFixed(2)} kg`,
        nasaFact: 'Spacecraft designers test multiple computer models before building the actual satellite.',
        status: 'ready'
      };
    }

    if (lastAction.type === 'reset') {
      return {
        eyebrow: 'NOVA // ASSEMBLY RESET',
        speech: 'Reset your spacecraft back to the starting setup! You have a fresh cleanroom ready for new parts.',
        tradeoff: 'The starting design has balanced weight and power so you always have a working baseline.',
        engineImpact: `Class: ${design.cubesat_class_id} | Active Parts: ${(design.part_ids || []).length} baseline modules`,
        nasaFact: 'Real space teams use proven baseline designs as a safe foundation when starting a new mission.',
        status: 'ready'
      };
    }
  }

  // 2. Critical Hard Failure Override: If hard constraints fail, prioritize helpful guidance!
  const failedHardChecks = validation.checks.filter((c) => !c.passed && !c.isWarning);
  if (failedHardChecks.length > 0 && stage >= 4 && stage <= 6) {
    const primaryFail = failedHardChecks[0];
    return {
      eyebrow: 'NOVA // RANGE SAFETY ADVISORY',
      speech: `Hold the countdown, Cadet! Our pre-flight safety check found an issue: ${primaryFail.reason}`,
      tradeoff: 'Every satellite must stay within weight, power, and cost limits to be cleared for launch.',
      engineImpact: `Constraint flagged: ${primaryFail.id}`,
      nasaFact: 'Safety inspectors check every satellite before launch to ensure it will not damage the rocket.',
      status: 'alert',
      highlightAction: primaryFail.suggestedFix
    };
  }

  // 3. Active selection specific context
  if (selection && selection.type === 'part' && selection.id) {
    const part = catalogs.parts.find((p) => p.id === selection.id);
    if (part) {
      const isEquipped = (design.part_ids || []).includes(part.id);
      const actionText = isEquipped ? 'Equipped on your spacecraft' : 'In catalog (click to equip)';
      const netPower = part.power >= 0 ? `Consumes ${part.power.toFixed(1)} W` : `Generates ${Math.abs(part.power).toFixed(1)} W`;
      const intel = COMPONENT_DIALOGUES[part.id];

      return {
        eyebrow: `NOVA // COMPONENT INTEL: ${part.name.toUpperCase()}`,
        speech: intel?.speech ?? `“${part.explanation}”`,
        tradeoff: intel?.tradeoff ?? `Adding ${part.name} adds ${part.mass.toFixed(2)} kg to satellite weight and costs $${part.cost.toFixed(2)}M.`,
        engineImpact: `Mass: +${part.mass.toFixed(2)} kg | Power: ${netPower} | Status: ${actionText}`,
        nasaFact: intel?.nasaFact ?? (part.heritage
          ? '✓ Flight Proven: This design has successfully flown on real space missions.'
          : '★ New Technology: Cutting-edge subsystem that offers higher performance.'),
        status: isEquipped ? 'ready' : 'caution'
      };
    }
  }

  if (selection && selection.type === 'objective' && selection.id) {
    const obj = catalogs.objectives.find((o) => o.id === selection.id);
    if (obj) {
      return {
        eyebrow: `NOVA // SCIENCE TARGET: ${obj.name.toUpperCase()}`,
        speech: `“Great choice, Cadet! For ${obj.name}, our main goal is: ${obj.baseline_science}”`,
        tradeoff: 'Big science missions collect lots of data, so we will need a fast radio antenna and good ground station contact!',
        engineImpact: `Target Data: ${obj.target_data_gb_per_day} GB/day | Recommended Orbits: ${obj.recommended_orbits.join(', ').toUpperCase()}`,
        nasaFact: 'NASA Principle: Scientific questions always come first. Your science goal determines what instruments your satellite needs.',
        status: 'ready'
      };
    }
  }

  if (selection && selection.type === 'parameter' && selection.id === 'observe_time_fraction') {
    const fraction = design.observe_time_fraction ?? 0.50;
    const pct = Math.round(fraction * 100);
    return {
      eyebrow: `NOVA // OBSERVATION TIME: ${pct}%`,
      speech: `Setting observation time to ${pct}% lets our camera take pictures during ${pct}% of each orbit. Longer observation takes more photos, but our radio needs enough ground station time to beam them all down!`,
      tradeoff: 'Taking more photos gathers more science data, but if our memory fills up before we can download it, extra data is lost!',
      engineImpact: `Observe Time: ${(fraction).toFixed(2)} (${pct}%) | Daily Data: ${meters.data.value.toFixed(2)} GB/day`,
      nasaFact: 'NASA Earth-observing satellites schedule observation times carefully to ensure memory never overflows before reaching ground antennas.',
      status: fraction > 0.53 ? 'caution' : 'ready'
    };
  }

  if (selection && selection.type === 'orbit' && selection.id) {
    const orbit = catalogs.orbits.find((o) => o.id === selection.id);
    if (orbit) {
      const sunPct = Math.round(orbit.sunlight_fraction * 100);
      return {
        eyebrow: `NOVA // ORBITAL DYNAMICS: ${orbit.name.toUpperCase()}`,
        speech: `“${orbit.explanation}”`,
        tradeoff: `In this orbit, your satellite gets ${sunPct}% sunlight. During the ${100 - sunPct}% night shadow, your batteries must supply all the power!`,
        engineImpact: `Altitude: ${orbit.altitude_km} km | Ground Contact: ${orbit.contact_min_per_day} min/day | Manifest: ${orbit.manifest_flexibility}`,
        nasaFact: 'Small satellites that are flexible about their orbit can easily hitch rides on scheduled rockets.',
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
        tradeoff: 'A dedicated rocket takes you right to your exact orbit, but costs more than sharing a ride with other satellites.',
        engineImpact: `Launch Cost: $${veh.cost.toFixed(2)}M | Fairing Envelope: ${veh.fairing_size.toUpperCase()}`,
        nasaFact: 'NASA CubeSat Launch Initiative helps educational satellites find launch slots on rockets.',
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
        tradeoff: 'A bigger satellite fits larger cameras and unfolding solar panels, but weighs more and takes more rocket fuel to launch.',
        engineImpact: `Mass Limit: ${cls.mass_limit_kg.toFixed(2)} kg | Height: ${cls.height_mm} mm`,
        nasaFact: 'A 1U CubeSat is a 10 cm cube with mass under 1.33 kg. A 3U CubeSat is three cubes long and allows up to 4.0 kg. (Source: CubeSat 101)',
        status: 'ready'
      };
    }
  }

  // 4. Stage-level default context
  const stageIntro = STAGE_INTRO_DIALOGUES[stage];
  switch (stage) {
    case 1: {
      const obj = catalogs.objectives.find((o) => o.id === design.objective_id) || catalogs.objectives[0];
      return {
        eyebrow: `NOVA // STAGE 1: ${stageIntro?.title ?? 'CHOOSE YOUR MISSION'}`,
        speech: stageIntro?.speech ?? `Welcome to the Mission Design Lab, Cadet! What science shall we investigate? Selected: ${obj?.name}.`,
        tradeoff: stageIntro?.tradeoff ?? 'Scientific goals drive sensor requirements, which in turn drive power, mass, and downlink demands.',
        engineImpact: `Target Data: ${obj?.target_data_gb_per_day ?? 1} GB/day | Recommended: ${(obj?.recommended_orbits ?? ['sso']).join(', ').toUpperCase()}`,
        nasaFact: stageIntro?.nasaFact ?? 'NASA begins every robotic mission with clear science goals before building any spacecraft hardware.',
        status: 'ready'
      };
    }
    case 2: {
      return {
        eyebrow: `NOVA // STAGE 2: ${stageIntro?.title ?? 'MISSION REQUIREMENTS'}`,
        speech: stageIntro?.speech ?? 'Time to set our mission guidelines! In space engineering, teams define core project requirements so everyone agrees on what our satellite must accomplish.',
        tradeoff: stageIntro?.tradeoff ?? 'Clear requirements keep our project focused, but we must make sure every target can be tested.',
        engineImpact: 'All 5 Core Verification Tracks Monitored',
        nasaFact: stageIntro?.nasaFact ?? 'Educational space projects use clear mission requirements inspired by NASA systems engineering practices to guide their designs.',
        status: 'ready'
      };
    }
    case 3: {
      const orb = catalogs.orbits.find((o) => o.id === design.orbit_id);
      const veh = catalogs.vehicles.find((v) => v.id === design.vehicle_id);
      return {
        eyebrow: `NOVA // STAGE 3: ${stageIntro?.title ?? 'ORBIT & ROCKET CHOICES'}`,
        speech: stageIntro?.speech ?? `Let us compare our choices and find the best orbit and rocket! Balancing ${orb?.name || 'SSO'} orbit with launch on ${veh?.name || 'our rocket'}.`,
        tradeoff: stageIntro?.tradeoff ?? 'Flying higher gives our satellite more time to talk to ground stations, but rockets cost more to get there.',
        engineImpact: `Launch Cost: $${(veh?.cost ?? 12).toFixed(2)}M | Orbit Altitude: ${orb?.altitude_km ?? 550} km`,
        nasaFact: stageIntro?.nasaFact ?? 'Most small satellites hitch a ride on larger rockets, so they have to follow the main mission launch schedule!',
        status: 'ready'
      };
    }
    case 4: {
      const classObj = catalogs.classes.find((c) => c.id === design.cubesat_class_id);
      const massVal = meters.mass.value.toFixed(2);
      const massLim = (classObj?.mass_limit_kg ?? 4.0).toFixed(2);
      const netPower = (meters.power.limit - meters.power.value).toFixed(1);
      return {
        eyebrow: `NOVA // STAGE 4: ${stageIntro?.title ?? 'BUILD YOUR SPACECRAFT'}`,
        speech: stageIntro?.speech ?? 'Welcome to the cleanroom! Pick the parts for your CubeSat and watch the 3D model assemble right before your eyes.',
        tradeoff: stageIntro?.tradeoff ?? 'Adding powerful instruments collects more science, but uses up electric power and adds weight.',
        engineImpact: `Mass: ${massVal} / ${massLim} kg | Net Daylight Power: +${netPower} W | Parts: ${(design.part_ids || []).length} equipped`,
        nasaFact: stageIntro?.nasaFact ?? 'Real spacecraft are built in spotless cleanrooms so dust specks never harm delicate solar cells or sensors.',
        status: meters.mass.state === 'fail' || meters.power.state === 'fail' ? 'caution' : 'ready'
      };
    }
    case 5: {
      const allPassed = validation.passed;
      return {
        eyebrow: `NOVA // STAGE 5: ${stageIntro?.title ?? 'SAFETY CHECK & REVIEW'}`,
        speech: allPassed
          ? 'All systems green, Flight Director! Our satellite passed all weight, power, and cost checks. We are cleared for the launchpad!'
          : 'Attention Cadet! Our safety check found some warnings below. Let us check the suggested fixes so we can clear our spacecraft for launch.',
        tradeoff: stageIntro?.tradeoff ?? 'Checking every detail now prevents surprises once our satellite is high in orbit!',
        engineImpact: `Hard Checks: ${allPassed ? 'ALL PASSED (GREEN)' : 'HOLD COUNTDOWN'} | Advisories: ${validation.warnings.length}`,
        nasaFact: stageIntro?.nasaFact ?? 'Before every launch, NASA holds a Flight Readiness Review where team leaders verify that the spacecraft is safe to fly.',
        status: allPassed ? 'ready' : 'alert'
      };
    }
    case 6: {
      return {
        eyebrow: `NOVA // STAGE 6: ${stageIntro?.title ?? 'LAUNCH & ORBIT INSERTION'}`,
        speech: stageIntro?.speech ?? '3, 2, 1... Liftoff! Watch the rocket soar into the sky and release our CubeSat safely into orbit!',
        tradeoff: stageIntro?.tradeoff ?? 'Our satellite waits until the rocket is safely clear before springing away into its own orbit.',
        engineImpact: `Target Orbit: ${(catalogs.orbits.find((o) => o.id === design.orbit_id)?.name || 'SSO').toUpperCase()}`,
        nasaFact: stageIntro?.nasaFact ?? 'CubeSat dispensers use a gentle spring to push satellites smoothly into space once the rocket engine shuts off.',
        status: 'ready'
      };
    }
    case 7:
    default: {
      const rank = score?.rank || 'Cadet';
      const outcome = report?.result || 'threshold_met';
      const outcomeStr = outcome === 'baseline_met' ? 'Full Baseline Mission Success' : outcome === 'threshold_met' ? 'Threshold Mission Success' : 'Mission Lost';
      return {
        eyebrow: `NOVA // STAGE 7: ${stageIntro?.title ?? 'MISSION RESULTS'}`,
        speech: `Mission complete, Cadet! We achieved ${outcomeStr}! Final Score: ${score?.total ?? 75}/100. Rank earned: ${rank.toUpperCase()}!`,
        tradeoff: stageIntro?.tradeoff ?? 'Compare your final score with your choices to see how balancing power and weight helped your mission succeed.',
        engineImpact: `Score: ${score?.total ?? 75}/100 | Rank: ${rank}`,
        nasaFact: stageIntro?.nasaFact ?? 'Data beamed down by small satellites helps scientists on Earth study our planet climate and space weather.',
        status: 'celebrate'
      };
    }
  }
}

