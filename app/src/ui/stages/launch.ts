/**
 * Stage 6: Launch & Orbital Insertion
 *
 * Flight ignition, ascent profile, and live simulation telemetry HUD.
 * The launch button remains locked until all hard checks pass.
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
  telemetry?: LaunchTelemetryState
): string {
  const canLaunch = validation.passed;
  const failedChecks = validation.checks.filter((c) => !c.passed && !c.isWarning);

  // If in active launch simulation sequence, render the live flight progress HUD with 3D scene
  if (telemetry?.isSimulating) {
    return `
      <section class="wizard-stage-view stage-launch active-simulation-view" aria-labelledby="stage-heading">
        <div class="stage-heading-block">
          <span class="stage-pill">STAGE 6 OF 7 // ACTIVE FLIGHT SIMULATION</span>
          <h2 id="stage-heading">${escapeHtml(telemetry.stageTitle)}</h2>
          <p>${escapeHtml(telemetry.stageDetail)}</p>
        </div>

        <div class="launch-scene-card scene-card" style="height: 320px; margin-bottom: 20px; border-radius: 12px; overflow: hidden; position: relative;">
          <div class="scene-caption"><span class="live-dot"></span>LIVE 3D FLIGHT TRACKER // ${escapeHtml(telemetry.stageTitle)}</div>
          <div class="scene-host" data-scene style="width:100%; height:100%"></div>
          <div class="scene-scale">CHASE CAMERA TELEMETRY · MET ${escapeHtml(telemetry.met)} · ALT ${escapeHtml(telemetry.alt)}</div>
        </div>

        <div class="launch-progress-hud panel">
          <div class="hud-metrics-bar">
            <div class="hud-metric-item">
              <span class="hud-metric-label">MISSION ELAPSED TIME</span>
              <strong class="hud-metric-val timer-val">${escapeHtml(telemetry.met)}</strong>
            </div>
            <div class="hud-metric-item">
              <span class="hud-metric-label">ALTITUDE</span>
              <strong class="hud-metric-val">${escapeHtml(telemetry.alt)}</strong>
            </div>
            <div class="hud-metric-item">
              <span class="hud-metric-label">ORBITAL VELOCITY</span>
              <strong class="hud-metric-val">${escapeHtml(telemetry.vel)}</strong>
            </div>
            <div class="hud-metric-item">
              <span class="hud-metric-label">TARGET ORBIT</span>
              <strong class="hud-metric-val" style="color:var(--cyan)">${escapeHtml(orbit.name)}</strong>
            </div>
          </div>

          <div style="margin: 20px 0 16px">
            ${progressBar(telemetry.progressPercent, 'Ascent & Orbital Insertion Progress')}
          </div>

          <div class="live-telemetry-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-top: 14px">
            <div class="sim-metric" style="background:var(--bg-card); padding:10px 14px; border-radius:6px; border:1px solid var(--border-light)">
              <span style="font-size:9px; letter-spacing:1px; color:var(--text-muted); display:block">BUS LOAD DEMAND</span>
              <strong style="font-family:var(--mono); color:var(--cyan); font-size:16px">${(telemetry.powerLoadW ?? 10.2).toFixed(1)} W</strong>
            </div>
            <div class="sim-metric" style="background:var(--bg-card); padding:10px 14px; border-radius:6px; border:1px solid var(--border-light)">
              <span style="font-size:9px; letter-spacing:1px; color:var(--text-muted); display:block">SOLAR GENERATION</span>
              <strong style="font-family:var(--mono); color:var(--green); font-size:16px">${(telemetry.solarGenW ?? 14.0).toFixed(1)} W</strong>
            </div>
            <div class="sim-metric" style="background:var(--bg-card); padding:10px 14px; border-radius:6px; border:1px solid var(--border-light)">
              <span style="font-size:9px; letter-spacing:1px; color:var(--text-muted); display:block">DATA TRANSMISSION</span>
              <strong style="font-family:var(--mono); color:#fff; font-size:16px">${(telemetry.dataRateMbps ?? 2.0).toFixed(1)} Mbps</strong>
            </div>
            <div class="sim-metric" style="background:var(--bg-card); padding:10px 14px; border-radius:6px; border:1px solid var(--border-light)">
              <span style="font-size:9px; letter-spacing:1px; color:var(--text-muted); display:block">STATUS</span>
              <strong style="font-family:var(--mono); color:var(--green); font-size:14px">NOMINAL</strong>
            </div>
          </div>

          <div class="sim-log-block" style="margin-top:16px">
            <span class="panel-index" style="margin-bottom:6px; display:block">FLIGHT EVENT TELEMETRY LOG</span>
            <div class="sim-log-panel" style="background:rgba(0,0,0,0.35); border:1px solid var(--border-light); border-radius:6px; height:120px; overflow-y:auto; padding:10px; display:flex; flex-direction:column; gap:6px">
              ${(telemetry.logs || [{ text: 'Telemetry initialized. Flight computer online.' }])
                .map((log) => `<div class="sim-log-entry ${log.warn ? 'warn' : ''}">${escapeHtml(log.text)}</div>`)
                .join('')}
            </div>
          </div>

          <div class="sim-progress-actions" style="display:flex; justify-content:space-between; align-items:center; margin-top:20px; padding-top:14px; border-top:1px solid var(--border-light)">
            ${secondaryButton('Skip to Report', 'skip-sim', 'rocket')}
            ${primaryButton('VIEW MISSION REPORT', 'view-report', 'rocket')}
          </div>
        </div>
      </section>
    `;
  }

  // Pre-Launch Readiness & Hold Dashboard
  return `
    <section class="wizard-stage-view stage-launch" aria-labelledby="stage-heading">
      <div class="stage-heading-block">
        <span class="stage-pill">STAGE 6 OF 7 // LAUNCH &amp; DEPLOYMENT</span>
        <h2 id="stage-heading">Launch &amp; Orbit Insertion</h2>
        <p>
          Final flight authorization. Once launch initiates, the rocket delivers the payload dispenser into the planned orbit.
        </p>
      </div>

      <div class="launch-scene-card scene-card" style="height: 280px; margin-bottom: 20px; border-radius: 12px; overflow: hidden; position: relative;">
        <div class="scene-caption"><span class="live-dot"></span>LAUNCH VEHICLE &amp; FLIGHT TRAJECTORY · CHESAPEAKE DEMO SITE</div>
        <div class="scene-host" data-scene style="width:100%; height:100%"></div>
        <div class="scene-scale">TARGET: ${escapeHtml(orbit.name).toUpperCase()} · VEHICLE: ${escapeHtml(vehicle.name).toUpperCase()}</div>
      </div>

      <div class="launch-dashboard-grid">
        <div class="launch-manifest-card glass-card">
          <h3>Launch Manifest Details</h3>
          <table class="manifest-table">
            <tr>
              <th>Target Orbit:</th>
              <td><strong>${escapeHtml(orbit.name)}</strong> (${orbit.altitude_km} km)</td>
            </tr>
            <tr>
              <th>Launch Vehicle:</th>
              <td><strong>${escapeHtml(vehicle.name)}</strong></td>
            </tr>
            <tr>
              <th>Payload Fairing:</th>
              <td>${escapeHtml(vehicle.fairing_size)}</td>
            </tr>
            <tr>
              <th>Flight Readiness Status:</th>
              <td>
                <span class="${canLaunch ? 'status-cleared' : 'status-held'}" style="display:inline-flex; align-items:center; gap:4px">
                  ${canLaunch ? `${renderIcon('check', 14, '', 'var(--brand-green)')} GO FOR LAUNCH` : `${renderIcon('fail', 14, '', 'var(--brand-coral)')} NO-GO: PENDING HARD CHECKS`}
                </span>
              </td>
            </tr>
          </table>
        </div>

        <div class="launch-control-card glass-card">
          <div class="countdown-display" aria-live="polite">
            <span class="countdown-label">MISSION ELAPSED TIME</span>
            <strong class="countdown-digits">T-00:00:10</strong>
            <span class="countdown-sub">SYSTEMS PRESSURIZED AND ARMED</span>
          </div>

          <div class="launch-action-wrapper">
            ${
              canLaunch
                ? primaryButton('COMMENCE LAUNCH & ORBITAL SIMULATION', onLaunchSimAction, 'rocket')
                : `
              <button type="button" class="button button-disabled button-launch-disabled" disabled aria-disabled="true">
                <span style="display:inline-flex; align-items:center">${renderIcon('fail', 16, '', 'var(--brand-coral)')}</span> LAUNCH COMMITTED HOLD (RESOLVE HARD CHECKS FIRST)
              </button>
              <div class="launch-blockers-list" role="alert" style="margin-top:14px">
                <strong>Blocking Items:</strong>
                <ul>
                  ${failedChecks.map((c) => `<li>${escapeHtml(c.reason)}</li>`).join('')}
                </ul>
                <div style="margin-top:10px">
                  ${secondaryButton('Return to Review Gate to Inspect Errors', { 'data-action': 'go-to-stage', 'data-stage': '5' }, 'back')}
                </div>
              </div>
            `
            }
          </div>
        </div>
      </div>

      <div class="launch-sequence-preview glass-card" style="margin-top: 20px;">
        <h4>Nominal Automated Ascent Profile:</h4>
        <ol class="ascent-steps">
          <li><strong>T-00:00:</strong> Rocket engine ignition and liftoff from launch complex.</li>
          <li><strong>T+00:45:</strong> Atmospheric ascent through Max-Q; payload fairing jettison.</li>
          <li><strong>T+02:30:</strong> Second-stage burn and orbital velocity cutoff (7.8 km/s).</li>
          <li><strong>T+45:00:</strong> Dispenser pneumatic spring separation into ${escapeHtml(orbit.name)}.</li>
          <li><strong>T+60:00:</strong> Automatic deployable panel release and primary ground station beacon acquisition.</li>
        </ol>
      </div>
    </section>
  `;
}
