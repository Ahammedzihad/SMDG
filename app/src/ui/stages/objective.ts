/**
 * Stage 1: Objective (CML 1 Cocktail Napkin)
 *
 * In accordance with NASA Small Satellite Institute principles:
 * "Begin with the end in mind." The scientific objective is chosen first
 * in the User Segment to drive all subsequent spacecraft engineering requirements.
 */

import type { Objective } from '@shared';
import { renderIcon } from '../icons';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderObjectiveStage(
  objectives: Objective[],
  selectedId: string,
  onSelectAction: string = 'select-objective'
): string {
  const cards = objectives
    .map((obj) => {
      const isSelected = obj.id === selectedId;
      const needsHtml = obj.needs
        .map((need) => `<span class="need-pill">${escapeHtml(need.replace(/_/g, ' '))}</span>`)
        .join('');

      const selectionIcon = isSelected ? renderIcon('check', 14, '', 'var(--brand-cyan)') : '○';

      return `
        <article class="stage-card objective-card glass-card ${isSelected ? 'is-selected' : ''}" tabindex="0" role="radio" aria-checked="${isSelected}" data-action="${onSelectAction}" data-id="${obj.id}">
          <div class="card-header">
            <span class="cml-tag">CML 1 CONCEPT</span>
            <span class="selection-marker" aria-hidden="true" style="display:inline-flex; align-items:center; gap:4px">
              ${selectionIcon} ${isSelected ? 'SELECTED' : 'SELECT'}
            </span>
          </div>

          <h3 class="card-title">${escapeHtml(obj.name)}</h3>
          <p class="card-description">${escapeHtml(obj.description)}</p>

          <div class="card-meta-grid">
            <div class="meta-item">
              <span class="meta-label" style="display:inline-flex; align-items:center; gap:4px">${renderIcon('data', 14)} TARGET DATA</span>
              <strong>${obj.target_data_gb_per_day} GB/day</strong>
            </div>
            <div class="meta-item">
              <span class="meta-label" style="display:inline-flex; align-items:center; gap:4px">${renderIcon('planet', 14)} RECOMMENDED ORBITS</span>
              <strong>${obj.recommended_orbits.map((o) => o.toUpperCase()).join(', ')}</strong>
            </div>
          </div>

          <div class="card-needs-section">
            <span class="meta-label">PRIMARY SUBSYSTEM NEEDS:</span>
            <div class="needs-list">${needsHtml}</div>
          </div>

          <div class="card-success-targets">
            <div class="target-block target-baseline">
              <span class="target-badge" style="display:inline-flex; align-items:center; gap:4px">${renderIcon('star', 13, '', 'var(--brand-yellow)')} BASELINE (FULL SUCCESS)</span>
              <p>${escapeHtml(obj.baseline_science)}</p>
            </div>
            <div class="target-block target-threshold">
              <span class="target-badge" style="display:inline-flex; align-items:center; gap:4px">${renderIcon('check', 13, '', 'var(--brand-cyan)')} THRESHOLD (MINIMUM SUCCESS)</span>
              <p>${escapeHtml(obj.threshold_science)}</p>
            </div>
          </div>

          <div class="card-source-citation">
            <small>Source: ${escapeHtml(obj.source)} · Science requirements drive engineering choices.</small>
          </div>
        </article>
      `;
    })
    .join('');

  return `
    <section class="wizard-stage-view stage-objective" aria-labelledby="stage-heading">
      <div class="stage-heading-block">
        <span class="stage-pill">STAGE 1 OF 7 // USER SEGMENT</span>
        <h2 id="stage-heading">Mission Objective (CML 1: Cocktail Napkin)</h2>
        <p>
          "Begin with the end in mind." Choose the science investigation you want to conduct.
          Your objective determines what instruments you must carry, what orbit you must fly, and how much data you must return.
        </p>
      </div>

      <div class="objective-cards-grid" role="radiogroup" aria-label="Mission Science Objectives">
        ${cards}
      </div>
    </section>
  `;
}

