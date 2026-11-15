/**
 * Stage 7: Mission Report & Debrief
 *
 * Post-mission engineering report displaying:
 * 1. Outcome level: Baseline Met, Threshold Met, or Failure.
 * 2. Score breakdown and assigned rank (Cadet, Engineer, Mission Lead, Flight Director).
 * 3. Plain-language "Why did this happen?" trade-off analysis (3–5 sentences).
 * 4. "What to try next" (two concrete design changes).
 * 5. 5x5 risk matrix drivers with mitigations.
 * 6. Historical real-mission match from CubeSat 101 with source page citation.
 */

import type { Report, ScoreBreakdown, SimResult } from '@shared';
import { starRank, primaryButton, secondaryButton } from '../components';
import { renderIcon } from '../icons';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderReportStage(
  report: Report,
  score: ScoreBreakdown,
  sim: SimResult,
  onRestartAction: string = 'restart-mission'
): string {
  const outcomeTitles = {
    baseline_met: {
      title: 'Baseline Science Objective Achieved (Full Mission Success)',
      badge: 'BASELINE SUCCESS',
      class: 'outcome-baseline',
      icon: renderIcon('check', 16, '', '#042431')
    },
    threshold_met: {
      title: 'Threshold Science Objective Met (Partial Mission Success)',
      badge: 'THRESHOLD SUCCESS',
      class: 'outcome-threshold',
      icon: renderIcon('check', 16, '', '#1a1000')
    },
    failure: {
      title: 'Mission Infeasible: Mission Lost or Objectives Unmet',
      badge: 'MISSION FAILURE',
      class: 'outcome-failure',
      icon: renderIcon('fail', 16, '', '#ffffff')
    }
  };

  const outcomeInfo = outcomeTitles[report.result] || outcomeTitles.failure;

  const scoreRows = `
    <div class="score-card glass-card">
      <div class="score-main" style="display:flex; flex-direction:column; gap:8px">
        <span class="score-title">FINAL COMPOSITE SCORE</span>
        <strong class="score-big">${score.total} <small>/ 100</small></strong>
        <div style="margin-top:4px">${starRank(score.rank)}</div>
      </div>
      <div class="score-breakdown-list">
        <div class="breakdown-row">
          <span>Mission Success (30 max)</span>
          <strong>${score.mission_success}</strong>
        </div>
        <div class="breakdown-row">
          <span>Science Value (20 max)</span>
          <strong>${score.science_value}</strong>
        </div>
        <div class="breakdown-row">
          <span>Resource Efficiency (20 max)</span>
          <strong>${score.resource_efficiency}</strong>
        </div>
        <div class="breakdown-row">
          <span>Engineering Quality (${score.mode === 'solo' ? '30' : '15'} max)</span>
          <strong>${score.engineering_quality}</strong>
        </div>
      </div>
    </div>
  `;

  const whyList = report.why
    .map((point) => `<li class="why-item"><span aria-hidden="true" style="display:inline-flex; align-items:center">${renderIcon('planet', 14, '', 'var(--brand-cyan)')}</span> ${escapeHtml(point)}</li>`)
    .join('');

  const hasSband = sim.design?.part_ids?.includes('comms_sband_patch') ?? false;
  const installedBattery = sim.design?.part_ids?.includes('batt_space_30wh')
    ? '30Wh Space-Grade Battery Pack'
    : sim.design?.part_ids?.includes('batt_liion_10wh')
      ? '10Wh Li-Ion Battery Pack'
      : 'battery pack';
  const hasEclipseDeficit = sim.cause_tags?.includes('UNDERSIZED_BATTERY_LEO') ?? false;

  const nextSteps = report.what_to_try_next
    .map((step) => {
      let formattedStep = escapeHtml(step);
      let badge = '';

      if (step.includes('S-Band Patch Transceiver')) {
        if (hasSband) {
          badge = `<span class="tag-pass" style="margin-right:6px; font-size:10px; padding:2px 6px;">ALREADY EQUIPPED</span>`;
          formattedStep = `S-Band Patch Transceiver delivers 25× downlink throughput over basic UHF/VHF (0.025 vs 0.001 GB/min). To further optimize, schedule longer ground station contact windows or expand pass frequency.`;
        } else {
          badge = `<span class="tag-warn" style="margin-right:6px; font-size:10px; padding:2px 6px;">RECOMMENDED UPGRADE</span>`;
          formattedStep = `Upgrade ground link to S-Band Patch Transceiver to increase downlink throughput by 25× over basic UHF/VHF (0.025 vs 0.001 GB/min).`;
        }
      } else if (step.includes('35% technical energy margin') || step.includes('battery storage capacity')) {
        if (!hasEclipseDeficit) {
          badge = `<span class="tag-pass" style="margin-right:6px; font-size:10px; padding:2px 6px;">ECLIPSE SURVIVED</span>`;
          formattedStep = `Simulated eclipse survival succeeded: the installed ${escapeHtml(installedBattery)} sustained orbital shadow passes without instrument power shutdown. Note: The 35% technical energy margin is an external JPL CML 4 design standard guideline, not a metric dynamically evaluated by this simulation engine.`;
        } else {
          badge = `<span class="tag-fail" style="margin-right:6px; font-size:10px; padding:2px 6px;">SIMULATED DEFICIT</span>`;
          formattedStep = `Simulated eclipse deficit occurred: installed battery capacity fell below orbital shadow power draw, forcing payload instruments into power-saving shutdown. Increase battery storage capacity toward the 35% JPL CML 4 technical energy reserve guideline.`;
        }
      }

      return `<li class="next-step-item"><span aria-hidden="true" style="display:inline-flex; align-items:center">${renderIcon('rocket', 14, '', 'var(--brand-yellow)')}</span> <div>${badge}${formattedStep}</div></li>`;
    })
    .join('');

  const risksList = (report.top_risks || [])
    .map((risk) => {
      return `
        <div class="risk-card glass-card" style="margin-bottom:10px; padding:12px; border-radius:10px; background:rgba(0,0,0,0.25); border:1px solid var(--border-glass)">
          <div class="risk-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px">
            <strong style="color:#fff; font-size:13px">${escapeHtml(risk.risk)}</strong>
            <span class="risk-level" style="font-size:10px; color:var(--brand-yellow); display:inline-flex; align-items:center; gap:3px">
              ${renderIcon('warning', 12, '', 'var(--brand-yellow)')} ${risk.likelihood}×${risk.consequence}
            </span>
          </div>
          <small class="risk-mitigation" style="color:var(--text-muted); font-size:11px; display:block"><b>Mitigation:</b> ${escapeHtml(risk.mitigation)}</small>
        </div>
      `;
    })
    .join('');

  const timelineList = (report.timeline && report.timeline.length > 0)
    ? report.timeline
        .map(
          (t) => `
        <div class="timeline-card" style="display:flex; gap:12px; align-items:flex-start; padding:10px 14px; background:rgba(0,0,0,0.25); border:1px solid var(--border-glass); border-radius:8px;">
          <div style="background:var(--brand-cyan-glow); color:var(--brand-cyan); font-family:var(--mono); font-weight:700; font-size:11px; padding:4px 8px; border-radius:4px; white-space:nowrap;">
            M+${t.month}
          </div>
          <div style="flex:1;">
            <strong style="color:#fff; font-size:13px; display:block; margin-bottom:2px;">${escapeHtml(t.event)}</strong>
            <p style="color:var(--text-muted); font-size:12px; margin:0; line-height:1.4;">${escapeHtml(t.description)}</p>
          </div>
        </div>
      `
        )
        .join('')
    : '<p style="color:var(--text-muted); font-size:12px;">No timeline entries recorded.</p>';

  const series = report.series;
  const seriesRows = (series && series.months && series.months.length > 0)
    ? series.months
        .map((m, idx) => {
          const healthVal = series.health?.[idx];
          const powerVal = series.power_w?.[idx];
          const dataStoredVal = series.data_stored_gb?.[idx];
          const budgetVal = series.budget_remaining_m?.[idx];

          const healthDisplay = typeof healthVal === 'number' ? `${healthVal}%` : 'N/A';
          const powerDisplay = typeof powerVal === 'number' ? `${powerVal.toFixed(1)} W` : 'N/A';
          const dataDisplay = typeof dataStoredVal === 'number' ? `${dataStoredVal.toFixed(2)} GB` : 'N/A';
          const budgetDisplay = typeof budgetVal === 'number' ? `$${budgetVal.toFixed(2)}M` : 'N/A';

          const healthColor = typeof healthVal === 'number' && healthVal > 80 ? 'var(--brand-green)' : typeof healthVal === 'number' && healthVal > 50 ? 'var(--brand-yellow)' : 'var(--brand-coral)';
          return `
            <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
              <td style="padding:6px 8px; font-weight:600;">M+${m}</td>
              <td style="padding:6px 8px; color:${healthColor};">${healthDisplay}</td>
              <td style="padding:6px 8px; color:var(--brand-cyan);">${powerDisplay}</td>
              <td style="padding:6px 8px;">${dataDisplay}</td>
              <td style="padding:6px 8px; color:var(--text-muted);">${budgetDisplay}</td>
            </tr>
          `;
        })
        .join('')
    : '<tr><td colspan="5" style="padding:12px; text-align:center; color:var(--text-muted);">No monthly data points recorded.</td></tr>';

  const realMission = report.similar_real_mission;

  return `
    <section class="wizard-stage-view stage-report" aria-labelledby="stage-heading">
      <div class="stage-heading-block">
        <span class="stage-pill">STAGE 7 OF 7 // POST-MISSION DEBRIEF</span>
        <h2 id="stage-heading">Flight Debrief & Engineering Evaluation</h2>
        <p>Comprehensive report analyzing why your spacecraft design succeeded or failed based on real physics and trade-offs.</p>
      </div>

      <div class="outcome-hero ${outcomeInfo.class}">
        <div class="outcome-header">
          <span class="outcome-badge" style="display:inline-flex; align-items:center; gap:4px">${outcomeInfo.icon} ${outcomeInfo.badge}</span>
          <span class="mission-duration" style="display:inline-flex; align-items:center; gap:4px">${renderIcon('time', 13)} ${sim.lifetime_months} MONTHS FLIGHT DURATION</span>
          ${sim.design?.observe_time_fraction !== undefined ? `<span class="observe-duty" style="display:inline-flex; align-items:center; gap:4px; font-family:var(--mono); font-size:11px; color:var(--brand-cyan)">${(sim.design.observe_time_fraction * 100).toFixed(0)}% OBSERVE DUTY</span>` : ''}
        </div>
        <h3>${outcomeInfo.title}</h3>
        <p>Science Data Collected: <b>${sim.science_collected.toFixed(1)} pts</b> (${sim.data_transmitted_total_gb.toFixed(1)} GB downlinked, ${sim.data_lost_total_gb.toFixed(1)} GB lost to overflow).</p>
      </div>

      <div class="report-grid">
        <div class="report-column-main">
          <div class="report-section-card glass-card">
            <h3>Why Did This Happen? (Trade-Off Analysis)</h3>
            <ul class="why-list">
              ${whyList}
            </ul>
          </div>

          <div class="report-section-card glass-card">
            <h3>What to Try Next (Concrete Design Changes)</h3>
            <ul class="next-steps-list">
              ${nextSteps}
            </ul>
          </div>

          <div class="report-section-card glass-card">
            <h3>Mission Timeline & Flight Milestones</h3>
            <div class="timeline-list" style="display:flex; flex-direction:column; gap:8px; margin-top:12px;">
              ${timelineList}
            </div>
          </div>

          <div class="report-section-card glass-card">
            <h3>Monthly Flight History & Telemetry</h3>
            <div class="series-table-container" style="overflow-x:auto; margin-top:12px;">
              <table style="width:100%; border-collapse:collapse; font-size:12px; font-family:var(--mono);">
                <thead>
                  <tr style="border-bottom:1px solid var(--border-light); color:var(--text-muted); text-align:left;">
                    <th style="padding:6px 8px;">Month</th>
                    <th style="padding:6px 8px;">Health</th>
                    <th style="padding:6px 8px;">Power (W)</th>
                    <th style="padding:6px 8px;">Buffer (GB)</th>
                    <th style="padding:6px 8px;">Budget Left</th>
                  </tr>
                </thead>
                <tbody>
                  ${seriesRows}
                </tbody>
              </table>
            </div>
          </div>

          ${
            realMission
              ? `
            <div class="report-section-card real-mission-card glass-card">
              <span class="section-tag" style="display:inline-flex; align-items:center; gap:4px">${renderIcon('planet', 12)} SIMILAR REAL NASA MISSION REFERENCE</span>
              <h3>${escapeHtml(realMission.name)}</h3>
              <p class="mission-agency" style="color:var(--brand-cyan); font-weight:600; font-size:12px; margin-bottom:4px;">${escapeHtml(realMission.organization)} · Size: ${escapeHtml(realMission.size_class)}</p>
              <p class="mission-desc">${escapeHtml(realMission.description)}</p>
              ${realMission.explanation ? `<p class="mission-explanation" style="font-size:12px; color:var(--text-muted); margin-top:4px;"><b>Technology Demonstrated:</b> ${escapeHtml(realMission.explanation)}</p>` : ''}
              <small class="mission-citation" style="display:block; margin-top:6px; color:var(--text-muted);">Citation Source: ${escapeHtml(realMission.source)}</small>
              <div class="mission-context-note" style="margin-top:10px; padding:8px 12px; background:rgba(77,226,255,0.06); border-left:3px solid var(--brand-cyan); border-radius:4px; font-size:11px; color:var(--text-muted); line-height:1.4;">
                <b>Historical Reference Benchmark:</b> This flight from <em>NASA CubeSat 101</em> shares a comparable 3U CubeSat form factor and Earth science investigation domain. It serves as an authentic historical comparison, not an identical duplicate of your simulated custom mission design.
              </div>
            </div>
          `
              : ''
          }
        </div>

        <div class="report-column-side">
          ${scoreRows}

          <div class="report-section-card glass-card">
            <h3>Top Risk Drivers (5×5 Matrix)</h3>
            <div class="risks-list">
              ${risksList || '<p>No critical risks registered.</p>'}
            </div>
          </div>
        </div>
      </div>

      <div class="report-actions" style="display:flex; gap:14px; align-items:center; margin-top:20px; padding-top:16px; border-top:1px solid var(--border-light)">
        ${primaryButton('DESIGN ANOTHER MISSION', onRestartAction, 'rocket')}
        ${secondaryButton('Return to Trade Space', { 'data-action': 'go-to-stage', 'data-stage': '3' }, 'back')}
      </div>
    </section>
  `;
}

