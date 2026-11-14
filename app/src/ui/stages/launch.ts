/**
 * Stage 6: Launch & In-Flight Mission Control
 *
 * Implements Google Stitch Screen 40829ff890b749169e0454cd316e1a70:
 * "In-Flight Mission Control - Orbit Mission Academy"
 *
 * Features:
 * - Real-Time Trajectory Vectors: Altitude, Velocity, Inclination
 * - Viewfinder Station with Targeting Reticle & Corner Brackets
 * - Primary Flight Objectives Checklist Module
 * - Telemetry Gauges Ribbon (Battery, Propellant, Bus Load, Solar Gen, Downlink)
 * - Exact required scientific labeling:
 *   - "SIMULATED INSERTION ALTITUDE"
 *   - "ESTIMATED ORBITAL VELOCITY"
 *   - "BUS LOAD DEMAND"
 *   - "SOLAR GENERATION"
 *   - "NOMINAL COMPONENT DOWNLINK THROUGHPUT"
 *   - Illustrative mission simulation values disclaimer note
 */

import type { MissionValidationResult, Orbit, Vehicle } from '@shared';
import { renderIcon } from '../icons';
import { primaryButton, secondaryButton, progressBar } from '../components';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface LaunchTelemetryState {
  isSimulating: boolean;
  stageTitle: string;
  stageDetail: string;
  met: string;
  alt: string;
  vel: string;
  progressPercent: number;
  powerLoadW?: number;
  solarGenW?: number;
  dataRateMbps?: number;
  logs?: Array<{ text: string; warn?: boolean }>;
}

export function renderLaunchStage(
  validation: MissionValidationResult,
  orbit: Orbit,
  vehicle: Vehicle,
  onLaunchSimAction: string = 'trigger-launch',
  telemetry?: LaunchTelemetryState,
  downlinkRateMbps?: number
): string {
  const canLaunch = validation.passed;
  const failedChecks = validation.checks.filter((c) => !c.passed && !c.isWarning);
  const targetAltKm = orbit.altitude_km ?? 550;
  const orbitalSpeedKms = (Math.sqrt(398600.44 / (6378.14 + Math.min(targetAltKm, 35786)))).toFixed(1);
  const ratedThroughputMbps = (downlinkRateMbps ?? 3.3).toFixed(1);

  // If in active launch simulation sequence, render the live flight progress HUD with 3D scene & Stitch Viewfinder HUD
  if (telemetry?.isSimulating) {
    const powerLoad = (telemetry.powerLoadW ?? 0.0).toFixed(1);
    const solarGen = (telemetry.solarGenW ?? 0.0).toFixed(1);
    const dataRate = (telemetry.dataRateMbps ?? 0.0).toFixed(1);

    return `
      <section class="wizard-stage-view stage-launch active-simulation-view flex flex-col gap-space-lg w-full max-w-7xl mx-auto" aria-labelledby="stage-heading">
        <!-- Top Telemetry Progress & Overline -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
          <div class="flex items-center gap-space-xs">
            <span class="inline-flex items-center gap-1.5 px-space-md py-1 rounded-full bg-secondary/10 text-secondary font-label-sm text-label-sm uppercase tracking-widest shadow-[0_0_12px_rgba(123,208,255,0.2)]">
              <span class="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              REAL-TIME TRAJECTORY // FLIGHT OPERATIONS
            </span>
            <span class="hidden sm:inline text-surface-variant font-label-sm text-label-sm">•</span>
            <span class="hidden sm:inline font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">STAGE 6 OF 7</span>
          </div>
          <div class="flex items-center gap-space-xs px-space-md py-1 rounded-full bg-surface-container-low text-tertiary font-label-sm text-label-sm font-bold">
            <span class="w-2 h-2 rounded-full bg-tertiary"></span>
            ACTIVE SIMULATION ONLINE
          </div>
        </div>

        <!-- Trajectory Vector Summary Bar -->
        <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md p-space-lg rounded-2xl bg-surface-container-low/90 backdrop-blur-xl border border-secondary/20 shadow-xl">
          <div class="space-y-space-xs">
            <div class="inline-flex items-center gap-space-xs text-secondary font-label-md text-label-md uppercase tracking-wider">
              <span class="material-symbols-outlined text-[18px]">explore</span>
              <span>ORBITAL INSERTION PROFILE</span>
            </div>
            <h1 id="stage-heading" class="font-headline-lg lg:font-headline-xl text-headline-lg lg:text-headline-xl font-bold tracking-tight text-on-surface">
              ${escapeHtml(telemetry.stageTitle)}
            </h1>
            <p class="font-body-md text-body-md text-on-surface-variant">
              ${escapeHtml(telemetry.stageDetail)}
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-space-md bg-surface-container-lowest/80 p-space-sm rounded-xl">
            <div class="flex flex-col">
              <span class="font-label-sm text-label-sm text-on-surface-variant uppercase">SIMULATED INSERTION ALTITUDE</span>
              <span class="font-headline-sm text-headline-sm text-primary font-bold">${escapeHtml(telemetry.alt)}</span>
            </div>
            <span class="text-surface-variant">•</span>
            <div class="flex flex-col">
              <span class="font-label-sm text-label-sm text-on-surface-variant uppercase">ESTIMATED ORBITAL VELOCITY</span>
              <span class="font-headline-sm text-headline-sm text-secondary font-bold">${escapeHtml(telemetry.vel)}</span>
            </div>
            <span class="text-surface-variant">•</span>
            <div class="flex flex-col">
              <span class="font-label-sm text-label-sm text-on-surface-variant uppercase">MISSION ELAPSED TIME</span>
              <span class="font-headline-sm text-headline-sm text-tertiary font-bold font-mono">${escapeHtml(telemetry.met)}</span>
            </div>
          </div>
        </div>

        <!-- 3D Flight Viewport & Optical Viewfinder Reticle Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          <!-- Left: 3D Flight Tracker -->
          <div class="lg:col-span-8 flex flex-col gap-space-sm">
            <div class="launch-scene-card scene-card relative w-full h-[360px] lg:h-[420px] rounded-2xl overflow-hidden bg-surface-container-lowest shadow-2xl flex items-center justify-center">
              <div class="scene-host" data-scene style="width:100%; height:100%"></div>

              <!-- Reticle HUD Graphics -->
              <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
                <!-- Outer Target Orbit Circle -->
                <div class="w-64 h-64 rounded-full border border-secondary/25 animate-[spin_60s_linear_infinite] flex items-center justify-center">
                  <div class="w-full h-px bg-gradient-to-r from-transparent via-secondary/30 to-transparent"></div>
                </div>
                <!-- Inner Viewfinder Focus Area -->
                <div class="absolute w-40 h-40 rounded-xl flex items-center justify-center">
                  <div class="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary"></div>
                  <div class="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary"></div>
                  <div class="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary"></div>
                  <div class="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary"></div>
                  <span class="material-symbols-outlined text-secondary text-[24px] animate-pulse">filter_center_focus</span>
                </div>
              </div>

              <!-- Top Viewfinder Header -->
              <div class="absolute top-3 left-3 right-3 flex items-center justify-between bg-surface-container-lowest/80 backdrop-blur-md px-space-md py-space-xs rounded-xl shadow-md">
                <div class="flex items-center gap-space-xs">
                  <span class="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                  <span class="font-label-sm text-label-sm uppercase tracking-widest text-on-surface">CHASE CAMERA TELEMETRY · ${escapeHtml(telemetry.stageTitle)}</span>
                </div>
                <span class="font-label-sm text-label-sm text-secondary uppercase font-bold">ORBIT LOCK ACQUIRED</span>
              </div>

              <div class="absolute bottom-3 right-3 font-label-sm text-label-sm text-on-surface-variant font-mono bg-surface-container-lowest/80 px-2 py-0.5 rounded backdrop-blur-sm">
                TARGET: ${escapeHtml(orbit.name).toUpperCase()}
              </div>
            </div>

            <!-- Ascent Progress Bar -->
            <div class="p-space-sm rounded-xl bg-surface-container-low/70">
              ${progressBar(telemetry.progressPercent, 'Ascent & Orbital Insertion Progress')}
            </div>
          </div>

          <!-- Right: Live Telemetry Gauges Ribbon & Flight Log -->
          <div class="lg:col-span-4 flex flex-col justify-between gap-space-sm">
            <!-- Telemetry Gauges Ribbon -->
            <div class="grid grid-cols-2 gap-space-sm">
              <div class="p-space-sm rounded-xl bg-surface-container-low/90 backdrop-blur-md flex flex-col gap-space-xs shadow-md">
                <div class="flex items-center justify-between">
                  <span class="font-label-sm text-label-sm text-on-surface-variant uppercase">BUS LOAD DEMAND</span>
                  <span class="material-symbols-outlined text-[16px] text-secondary">power</span>
                </div>
                <span class="font-headline-sm text-headline-sm text-secondary font-bold">${powerLoad} W</span>
                <span class="font-label-sm text-[9px] text-on-surface-variant uppercase">Subsystem Draw</span>
              </div>

              <div class="p-space-sm rounded-xl bg-surface-container-low/90 backdrop-blur-md flex flex-col gap-space-xs shadow-md">
                <div class="flex items-center justify-between">
                  <span class="font-label-sm text-label-sm text-on-surface-variant uppercase">SOLAR GENERATION</span>
                  <span class="material-symbols-outlined text-[16px] text-tertiary">solar_power</span>
                </div>
                <span class="font-headline-sm text-headline-sm text-tertiary font-bold">${solarGen} W</span>
                <span class="font-label-sm text-[9px] text-tertiary uppercase">Array Active</span>
              </div>

              <div class="p-space-sm rounded-xl bg-surface-container-low/90 backdrop-blur-md flex flex-col gap-space-xs shadow-md col-span-2">
                <div class="flex items-center justify-between">
                  <span class="font-label-sm text-label-sm text-on-surface-variant uppercase">NOMINAL COMPONENT DOWNLINK THROUGHPUT</span>
                  <span class="material-symbols-outlined text-[16px] text-primary">satellite_alt</span>
                </div>
                <div class="flex items-baseline gap-1">
                  <span class="font-headline-sm text-headline-sm text-primary font-bold">${dataRate}</span>
                  <span class="font-label-sm text-label-sm text-primary">Mbps</span>
                </div>
                <span class="font-label-sm text-[9px] text-on-surface-variant uppercase">Transceiver Rated Bandwidth</span>
              </div>
            </div>

            <!-- Flight Telemetry Log -->
            <div class="p-space-md rounded-xl bg-surface-container-low/90 backdrop-blur-md shadow-md flex flex-col gap-space-xs flex-1">
              <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">
                FLIGHT EVENT TELEMETRY LOG
              </span>
              <div class="h-32 overflow-y-auto space-y-1 font-mono text-[11px] text-on-surface-variant p-2 rounded bg-surface-container-lowest/60">
                ${(telemetry.logs || [{ text: 'Telemetry initialized. Flight computer online.' }])
                  .map((log) => `<div class="${log.warn ? 'text-error' : 'text-on-surface'}">${escapeHtml(log.text)}</div>`)
                  .join('')}
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-between gap-space-sm pt-space-xs">
              ${secondaryButton('Skip to Report', 'skip-sim', 'rocket')}
              ${primaryButton('VIEW MISSION REPORT', 'view-report', 'rocket')}
            </div>
          </div>
        </div>

        <!-- Illustrative Disclaimer Note -->
        <p class="sim-disclaimer-note font-label-sm text-label-sm text-on-surface-variant text-center italic opacity-75">
          Illustrative mission simulation values; not actual spacecraft telemetry or a flight prediction.
        </p>
      </section>
    `;
  }

  // Pre-Launch Readiness & Hold Dashboard
  return `
    <section class="wizard-stage-view stage-launch flex flex-col gap-space-lg w-full max-w-7xl mx-auto" aria-labelledby="stage-heading">
      <!-- Top Telemetry Progress & Overline -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
        <div class="flex items-center gap-space-xs">
          <span class="inline-flex items-center gap-1.5 px-space-md py-1 rounded-full bg-secondary/10 text-secondary font-label-sm text-label-sm uppercase tracking-widest shadow-[0_0_12px_rgba(123,208,255,0.2)]">
            <span class="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
            STEP 04: LAUNCH AUTHORIZATION
          </span>
          <span class="hidden sm:inline text-surface-variant font-label-sm text-label-sm">•</span>
          <span class="hidden sm:inline font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">STAGE 6 OF 7</span>
        </div>
      </div>

      <!-- Editorial Header -->
      <div class="space-y-space-xs">
        <h1 id="stage-heading" class="font-headline-lg lg:font-headline-xl text-headline-lg lg:text-headline-xl text-on-surface tracking-tight font-bold">
          Launch &amp; Orbit Insertion
        </h1>
        <p class="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Final flight authorization. Once launch initiates, the rocket delivers the payload dispenser into the planned orbit.
        </p>
        <p class="sim-disclaimer-note font-label-sm text-label-sm text-on-surface-variant italic opacity-75">
          Illustrative mission simulation values; not actual spacecraft telemetry or a flight prediction.
        </p>
      </div>

      <!-- 3D Launch Preview Stage -->
      <div class="launch-scene-card scene-card relative w-full h-[280px] lg:h-[320px] rounded-2xl overflow-hidden bg-surface-container-lowest shadow-2xl flex items-center justify-center">
        <div class="scene-host" data-scene style="width:100%; height:100%"></div>
        <div class="absolute top-3 left-3 flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-surface-container-lowest/80 backdrop-blur-md shadow-md">
          <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span class="font-label-sm text-label-sm text-on-surface uppercase tracking-wider">LAUNCH PAD PREPARATION // DEMO COMPLEX</span>
        </div>
        <div class="absolute bottom-3 right-3 font-label-sm text-label-sm text-secondary font-mono bg-surface-container-lowest/80 px-2 py-0.5 rounded backdrop-blur-sm">
          TARGET: ${escapeHtml(orbit.name).toUpperCase()} · VEHICLE: ${escapeHtml(vehicle.name).toUpperCase()}
        </div>
      </div>

      <!-- Launch Manifest & Hold Dashboard Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
        <div class="launch-manifest-card p-space-lg rounded-2xl bg-surface-container-low/90 backdrop-blur-xl border border-white/5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 class="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-md">Launch Manifest Details</h3>
            <table class="w-full text-left font-body-sm text-body-sm">
              <tr class="border-b border-white/5">
                <th class="py-2 text-on-surface-variant font-medium">Target Orbit:</th>
                <td class="py-2 text-on-surface font-semibold">${escapeHtml(orbit.name)}</td>
              </tr>
              <tr class="border-b border-white/5">
                <th class="py-2 text-on-surface-variant font-medium">Simulated insertion altitude:</th>
                <td class="py-2 text-primary font-semibold">${targetAltKm} km</td>
              </tr>
              <tr class="border-b border-white/5">
                <th class="py-2 text-on-surface-variant font-medium">Estimated orbital velocity:</th>
                <td class="py-2 text-secondary font-semibold">${orbitalSpeedKms} km/s</td>
              </tr>
              <tr class="border-b border-white/5">
                <th class="py-2 text-on-surface-variant font-medium">Nominal Component Downlink Throughput:</th>
                <td class="py-2 text-on-surface font-semibold">${ratedThroughputMbps} Mbps</td>
              </tr>
              <tr class="border-b border-white/5">
                <th class="py-2 text-on-surface-variant font-medium">Launch Vehicle:</th>
                <td class="py-2 text-primary font-semibold">${escapeHtml(vehicle.name)}</td>
              </tr>
              <tr class="border-b border-white/5">
                <th class="py-2 text-on-surface-variant font-medium">Payload Fairing:</th>
                <td class="py-2 text-on-surface uppercase font-mono">${escapeHtml(vehicle.fairing_size)}</td>
              </tr>
              <tr>
                <th class="py-2 text-on-surface-variant font-medium">Readiness Status:</th>
                <td class="py-2">
                  <span class="inline-flex items-center gap-1 font-label-sm text-label-sm font-bold uppercase ${
                    canLaunch ? 'text-tertiary' : 'text-error'
                  }">
                    <span class="material-symbols-outlined text-[16px]">${canLaunch ? 'check_circle' : 'cancel'}</span>
                    ${canLaunch ? 'GO FOR LAUNCH' : 'NO-GO: PENDING HARD CHECKS'}
                  </span>
                </td>
              </tr>
            </table>
          </div>
        </div>

        <div class="launch-control-card p-space-lg rounded-2xl bg-surface-container-low/90 backdrop-blur-xl border border-white/5 shadow-xl flex flex-col justify-between">
          <div class="countdown-display text-center py-space-sm" aria-live="polite">
            <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest block mb-1">
              MISSION ELAPSED TIME
            </span>
            <strong class="font-display text-4xl lg:text-5xl text-primary font-bold tracking-tight block">
              T-00:00:10
            </strong>
            <span class="font-label-sm text-label-sm text-secondary uppercase tracking-wider block mt-1">
              SYSTEMS PRESSURIZED AND ARMED
            </span>
          </div>

          <div class="launch-action-wrapper pt-space-md border-t border-white/5">
            ${
              canLaunch
                ? primaryButton('COMMENCE LAUNCH & ORBITAL SIMULATION', onLaunchSimAction, 'rocket')
                : `
              <button type="button" class="w-full py-space-sm px-space-md rounded-xl bg-surface-container text-outline font-label-md text-label-md uppercase tracking-wider cursor-not-allowed flex items-center justify-center gap-2" disabled aria-disabled="true">
                <span class="material-symbols-outlined text-[18px]">lock</span>
                <span>LAUNCH COMMITTED HOLD (RESOLVE HARD CHECKS FIRST)</span>
              </button>
              <div class="launch-blockers-list mt-space-md p-space-sm rounded-lg bg-error-container/20 border border-error/30 text-error font-body-sm text-body-sm" role="alert">
                <strong>Blocking Items:</strong>
                <ul class="list-disc list-inside mt-1 space-y-0.5">
                  ${failedChecks.map((c) => `<li>${escapeHtml(c.reason)}</li>`).join('')}
                </ul>
                <div class="mt-space-sm">
                  ${secondaryButton('Return to Review Gate to Inspect Errors', { 'data-action': 'go-to-stage', 'data-stage': '5' }, 'back')}
                </div>
              </div>
            `
            }
          </div>
        </div>
      </div>

      <!-- Nominal Ascent Profile -->
      <div class="p-space-lg rounded-2xl bg-surface-container-low/70 border border-white/5 shadow-md">
        <h4 class="font-label-md text-label-md uppercase tracking-wider text-secondary font-bold mb-space-sm">
          Nominal Automated Ascent Profile:
        </h4>
        <ol class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-sm text-on-surface-variant font-body-sm text-body-sm">
          <li class="p-space-xs rounded bg-surface-container-lowest/50"><strong class="text-on-surface">T-00:00:</strong> Rocket engine ignition and liftoff.</li>
          <li class="p-space-xs rounded bg-surface-container-lowest/50"><strong class="text-on-surface">T+00:45:</strong> Transonic ascent; fairing separation.</li>
          <li class="p-space-xs rounded bg-surface-container-lowest/50"><strong class="text-on-surface">T+02:30:</strong> Upper-stage orbital velocity insertion.</li>
          <li class="p-space-xs rounded bg-surface-container-lowest/50"><strong class="text-on-surface">T+45:00:</strong> Pneumatic spring dispenser release.</li>
          <li class="p-space-xs rounded bg-surface-container-lowest/50"><strong class="text-on-surface">T+60:00:</strong> Solar array deployment &amp; beacon lock.</li>
        </ol>
      </div>
    </section>
  `;
}
