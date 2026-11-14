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

  const nextSteps = report.what_to_try_next
    .map((step) => `<li class="next-step-item"><span aria-hidden="true" style="display:inline-flex; align-items:center">${renderIcon('rocket', 14, '', 'var(--brand-yellow)')}</span> ${escapeHtml(step)}</li>`)
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

          ${
            realMission
              ? `
            <div class="report-section-card real-mission-card glass-card">
              <span class="section-tag" style="display:inline-flex; align-items:center; gap:4px">${renderIcon('planet', 12)} SIMILAR REAL NASA MISSION</span>
              <h3>${escapeHtml(realMission.name)}</h3>
              <p class="mission-agency">${escapeHtml(realMission.organization)} · Size: ${escapeHtml(realMission.size_class)}</p>
              <p class="mission-desc">${escapeHtml(realMission.description)}</p>
              <small class="mission-citation">Citation Source: ${escapeHtml(realMission.source)}</small>
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

