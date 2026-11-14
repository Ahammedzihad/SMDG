/**
 * Stage 2: Initial Feasibility (CML 2)
 *
 * Decomposes the science objective into 4–6 measurable requirements.
 * Adheres to NASA SmallSat webinar principle: "Every requirement must have a verification method."
 */

import type { Objective, Meters, MissionValidationResult } from '@shared';
import { renderIcon } from '../icons';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface RequirementItem {
  id: string;
  name: string;
  statement: string;
  verificationMethod: string;
  isSatisfied: boolean;
  statusNote: string;
}

export function generateRequirements(
  objective: Objective,
  meters?: Meters,
  validation?: MissionValidationResult
): RequirementItem[] {
  const reqs: RequirementItem[] = [];

  // Req 1: Payload Instrument
  const hasPayload = (meters?.data.value ?? 0) > 0;
  reqs.push({
    id: 'req_payload',
    name: 'Scientific Instrument Accommodation',
    statement: `Spacecraft shall carry a specialized payload to satisfy the "${objective.name}" research investigation.`,
    verificationMethod: 'Verified by: Physical payload integration and master equipment list audit.',
    isSatisfied: hasPayload,
    statusNote: hasPayload
      ? 'Requirement satisfied: active scientific instrument is installed.'
      : 'Pending: no scientific instrument installed yet.'
  });

  // Req 2: Data Volume
  const dataSatisfied = (meters?.communications.value ?? 0) >= objective.target_data_gb_per_day;
  reqs.push({
    id: 'req_downlink',
    name: 'Daily Science Telemetry Downlink',
    statement: `Spacecraft communication subsystem shall downlink at least ${objective.target_data_gb_per_day} GB of data per day to ground stations.`,
    verificationMethod: 'Verified by: Daily pass contact time multiplied by transmitter downlink bandwidth.',
    isSatisfied: dataSatisfied,
    statusNote: dataSatisfied
      ? `Downlink capacity (${meters?.communications.value} GB/d) meets the target (${objective.target_data_gb_per_day} GB/d).`
      : `Downlink capacity (${meters?.communications.value ?? 0} GB/d) is below target (${objective.target_data_gb_per_day} GB/d).`
  });

  // Req 3: Power Margin
  const powerSatisfied = meters?.power.state !== 'fail';
  reqs.push({
    id: 'req_power',
    name: 'Daylight Energy Balance',
    statement: 'Solar arrays shall generate electricity exceeding peak instrument and avionics consumption during daylight orbital passes.',
    verificationMethod: 'Verified by: Solar cell area, efficiency, and orbital solar illumination calculation.',
    isSatisfied: powerSatisfied,
    statusNote: powerSatisfied
      ? `Generation (${meters?.power.limit} W) covers total subsystem load (${meters?.power.value} W).`
      : 'Deficit: consumption exceeds solar array generation capacity.'
  });

  // Req 4: Mass & Dispenser Envelope
  const massSatisfied = meters?.mass.state !== 'fail';
  reqs.push({
    id: 'req_mass',
    name: 'Launch Vehicle Dispenser Accommodation',
    statement: 'Total spacecraft wet mass shall remain below the certified launch vehicle payload capacity and CubeSat class limit.',
    verificationMethod: 'Verified by: Pre-launch weight check against launch vehicle interface control document.',
    isSatisfied: massSatisfied,
    statusNote: massSatisfied
      ? `Total mass (${meters?.mass.value} kg) is within allowable limit (${meters?.mass.limit} kg).`
      : `Overweight: total mass (${meters?.mass.value} kg) exceeds allowable limit (${meters?.mass.limit} kg).`
  });

  // Req 5: Operational Lifetime
  const lifetimeSatisfied = (meters?.time.value ?? 0) >= 12;
  reqs.push({
    id: 'req_lifetime',
    name: 'Operational Mission Lifetime',
    statement: 'The satellite orbital mechanics and battery cycling shall support at least 12 continuous months of science operations.',
    verificationMethod: 'Verified by: Atmospheric drag decay analysis and secondary battery cycle life rating.',
    isSatisfied: lifetimeSatisfied,
    statusNote: lifetimeSatisfied
      ? 'Planned lifetime meets 12-month nominal science campaign requirement.'
      : 'Lifetime configuration needs verification in trade space.'
  });

  return reqs;
}

export function renderRequirementsStage(
  objective: Objective,
  meters?: Meters,
  validation?: MissionValidationResult
): string {
  const reqs = generateRequirements(objective, meters, validation);

  const reqCards = reqs
    .map((r, i) => {
      const statusIcon = r.isSatisfied
        ? renderIcon('check', 14, '', 'var(--brand-green)')
        : renderIcon('warning', 14, '', 'var(--brand-yellow)');
      const statusClass = r.isSatisfied ? 'req-satisfied' : 'req-pending';
      const badgeText = r.isSatisfied ? 'VERIFIED' : 'PENDING DESIGN';

      return `
        <div class="requirement-card glass-card ${statusClass}" tabindex="0">
          <div class="req-header">
            <span class="req-number">REQ-0${i + 1}</span>
            <strong class="req-name">${escapeHtml(r.name)}</strong>
            <span class="req-badge" style="display:inline-flex; align-items:center; gap:4px">
              ${statusIcon} ${badgeText}
            </span>
          </div>
          <p class="req-statement">${escapeHtml(r.statement)}</p>
          <div class="req-verification">
            <span class="verification-badge" aria-hidden="true" style="display:inline-flex; align-items:center">${renderIcon('settings', 13, '', 'var(--brand-cyan)')}</span>
            <em>${escapeHtml(r.verificationMethod)}</em>
          </div>
          <div class="req-status-note">
            <small>${escapeHtml(r.statusNote)}</small>
          </div>
        </div>
      `;
    })
    .join('');

  return `
    <section class="wizard-stage-view stage-requirements" aria-labelledby="stage-heading">
      <div class="stage-heading-block">
        <span class="stage-pill">STAGE 2 OF 7 // REQUIREMENTS DEFINITION</span>
        <h2 id="stage-heading">Initial Feasibility (CML 2)</h2>
        <p>
          Every science objective translates into hard engineering requirements.
          In real NASA spaceflight, <strong>every requirement must specify how it will be verified</strong> before the rocket leaves the launchpad.
        </p>
      </div>

      <div class="requirements-summary-card glass-card">
        <div>
          <span class="summary-label">CHOSEN INVESTIGATION</span>
          <strong>${escapeHtml(objective.name)}</strong>
        </div>
        <div>
          <span class="summary-label">MATURITY GATE</span>
          <strong>CML 2 // FEASIBILITY</strong>
        </div>
      </div>

      <div class="requirements-list">
        ${reqCards}
      </div>
    </section>
  `;
}

