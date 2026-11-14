/**
 * Stage 5: Pre-Launch Review (Checklist Gate)
 *
 * All hard checks must pass before the launch button is unlocked.
 * Provides plain-language explanations, actionable fixes, and descope options.
 */

import type { MissionValidationResult, Meters } from '@shared';
import { renderIcon } from '../icons';
import { secondaryButton } from '../components';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderReviewStage(
  validation: MissionValidationResult,
  meters: Meters,
  onDescopeAction: string = 'descope-action'
): string {
  const hardChecks = validation.checks.filter((c) => !c.isWarning);
  const softWarnings = validation.warnings;

  const hardCheckRows = hardChecks
    .map((check) => {
      const isPassed = check.passed;
      const statusClass = isPassed ? 'check-passed' : 'check-failed';
      const statusIcon = isPassed
        ? renderIcon('check', 14, '', 'var(--brand-green)')
        : renderIcon('fail', 14, '', 'var(--brand-coral)');
      const statusLabel = isPassed ? 'PASS' : 'FAIL';

      return `
        <div class="review-check-card glass-card ${statusClass}" tabindex="0">
          <div class="check-header">
            <span class="check-badge" style="display:inline-flex; align-items:center; gap:4px">
              ${statusIcon} ${statusLabel}
            </span>
            <strong class="check-title">${escapeHtml(check.id)}</strong>
          </div>
          <p class="check-reason">${escapeHtml(check.reason)}</p>
          ${
            !isPassed
              ? `
            <div class="check-fix-box">
              <strong>Recommended Engineering Fix:</strong>
              <p>${escapeHtml(check.suggestedFix)}</p>
            </div>
          `
              : ''
          }
        </div>
      `;
    })
    .join('');

  const warningRows = softWarnings
    .map((warn) => {
      return `
        <div class="review-check-card glass-card check-warning" tabindex="0">
          <div class="check-header">
            <span class="check-badge badge-warning" style="display:inline-flex; align-items:center; gap:4px">
              ${renderIcon('warning', 14, '', 'var(--brand-yellow)')} ADVISORY
            </span>
            <strong class="check-title">${escapeHtml(warn.id)}</strong>
          </div>
          <p class="check-reason">${escapeHtml(warn.reason)}</p>
          <div class="check-fix-box">
            <strong>Advisory Recommendation:</strong>
            <p>${escapeHtml(warn.suggestedFix)}</p>
          </div>
        </div>
      `;
    })
    .join('');

  const canLaunch = validation.passed;

  return `
    <section class="wizard-stage-view stage-review" aria-labelledby="stage-heading">
      <div class="stage-heading-block">
        <span class="stage-pill">STAGE 5 OF 7 // FLIGHT READINESS AUDIT</span>
        <h2 id="stage-heading">Pre-Launch Review Gate</h2>
        <p>
          Before any rocket can launch, mission controllers conduct a formal Flight Readiness Review.
          <strong>All hard checks must pass (GREEN) to proceed.</strong> Soft advisory warnings (YELLOW) are permitted with flight director sign-off.
        </p>
      </div>

      <div class="review-status-banner glass-card ${canLaunch ? 'banner-ready' : 'banner-blocked'}">
        <div class="banner-icon" aria-hidden="true" style="display:flex; align-items:center">
          ${canLaunch ? renderIcon('rocket', 32, '', 'var(--brand-green)') : renderIcon('fail', 32, '', 'var(--brand-coral)')}
        </div>
        <div>
          <h3>${canLaunch ? 'FLIGHT CLEARANCE GRANTED' : 'LAUNCH COMMITTED STOP: HARD CHECKS FAILED'}</h3>
          <p>
            ${
              canLaunch
                ? 'All mandatory structural, electrical, and budgetary hard constraints have passed. Spacecraft is certified for launch.'
                : 'One or more hard engineering checks failed. Return to earlier design stages or apply descope options to achieve flight clearance.'
            }
          </p>
        </div>
      </div>

      <div class="review-sections-grid">
        <div class="review-column">
          <div class="column-header">
            <h3>Hard Checks (Blocking Gate)</h3>
            <span class="column-count">${hardChecks.filter((c) => c.passed).length} of ${hardChecks.length} PASSED</span>
          </div>
          <div class="checks-list">
            ${hardCheckRows}
          </div>
        </div>

        <div class="review-column">
          <div class="column-header">
            <h3>Advisory Margin Warnings</h3>
            <span class="column-count">${softWarnings.length} ADVISORIES</span>
          </div>
          <div class="checks-list">
            ${softWarnings.length > 0 ? warningRows : `<div class="no-warnings" style="display:flex; align-items:center; gap:6px">${renderIcon('check', 14, '', 'var(--brand-green)')} Healthy engineering margins maintained across all subsystems.</div>`}
          </div>

          ${
            !canLaunch
              ? `
            <div class="descope-suggestions-card glass-card">
              <h4>Descope & Recovery Recommendations</h4>
              <p>When mass or budget limits are breached, NASA mission teams descope non-essential hardware:</p>
              <ul>
                <li>Switch to a smaller battery pack or body-mounted solar panels to reduce weight.</li>
                <li>Remove secondary sensors to reduce power draw and telemetry volume.</li>
                <li>Switch to a secondary rideshare launcher to reduce mission cost.</li>
              </ul>
              <div style="margin-top:12px">
                ${secondaryButton('Return to Point Design to Descope Parts', { 'data-action': 'go-to-stage', 'data-stage': '4' }, 'back')}
              </div>
            </div>
          `
              : ''
          }
        </div>
      </div>
    </section>
  `;
}

