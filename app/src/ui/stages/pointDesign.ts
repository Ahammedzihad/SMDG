/**
 * Stage 4: Point Design (CML 4)
 *
 * Detailed engineering subsystem specification down to the assembly level.
 * Features CubeSat class form factor selection and the Master Equipment List (MEL).
 */

import type { CubeSatClass, Part } from '@shared';
import { renderPartsTable, type PartRowItem } from '../partsTable';
import { renderIcon } from '../icons';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderPointDesignStage(
  classes: CubeSatClass[],
  selectedClassId: string,
  parts: Part[],
  selectedPartIds: string[],
  onSelectClassAction: string = 'select-class',
  onTogglePartAction: string = 'toggle-part'
): string {
  // CubeSat class selection cards
  const classCards = classes
    .map((cls) => {
      const isSelected = cls.id === selectedClassId;
      const selectionIcon = isSelected ? renderIcon('check', 14, '', 'var(--brand-cyan)') : '○';

      return `
        <article class="class-card stage-card glass-card ${isSelected ? 'is-selected' : ''}" tabindex="0" role="radio" aria-checked="${isSelected}" data-action="${onSelectClassAction}" data-id="${cls.id}">
          <div class="class-header">
            <strong>${escapeHtml(cls.name)}</strong>
            <span class="selection-marker" aria-hidden="true" style="display:inline-flex; align-items:center; gap:4px">
              ${selectionIcon} ${isSelected ? 'SELECTED' : 'SELECT'}
            </span>
          </div>
          <div class="class-limit">
            <span style="display:inline-flex; align-items:center; gap:3px">${renderIcon('mass', 13)} MAX MASS:</span>
            <strong>${cls.mass_limit_kg.toFixed(2)} kg</strong>
          </div>
          <small class="class-source">Source: ${escapeHtml(cls.source)}</small>
          <p class="class-explanation">${escapeHtml(cls.explanation)}</p>
        </article>
      `;
    })
    .join('');

  // Prepare Master Equipment List rows
  const partItems: PartRowItem[] = parts.map((part) => {
    const isSelected = selectedPartIds.includes(part.id);
    let disabled = false;
    let disabledReason: string | undefined;

    // Check prerequisites
    if (part.requires && part.requires.length > 0) {
      for (const reqId of part.requires) {
        if (!selectedPartIds.includes(reqId)) {
          const reqPart = parts.find((p) => p.id === reqId);
          disabled = true;
          disabledReason = `Requires ${reqPart?.name || reqId} to be equipped first.`;
          break;
        }
      }
    }

    // Class size constraint (e.g. 1U chassis cannot fit 3U deployable solar wings)
    if (selectedClassId === '1U' && part.id === 'solar_deployable_3u') {
      disabled = true;
      disabledReason = '3U deployable solar array exceeds the 1U structural envelope.';
    }

    return {
      part,
      selected: isSelected,
      disabled,
      disabledReason
    };
  });

  return `
    <section class="wizard-stage-view stage-point-design" aria-labelledby="stage-heading">
      <div class="stage-heading-block">
        <span class="stage-pill">STAGE 4 OF 7 // SUBSYSTEM ENGINEERING</span>
        <h2 id="stage-heading">Point Design (CML 4)</h2>
        <p>
          Assemble your spacecraft subsystem by subsystem. Every component adds mass, consumes electricity, and draws on project budget.
          Components marked <strong>✓ Heritage</strong> have prior flight history, lowering anomaly risk.
        </p>
      </div>

      <div class="point-design-section">
        <div class="sub-heading">
          <span class="step-badge">1</span>
          <h3>Select Spacecraft Form Factor (CubeSat Class)</h3>
        </div>
        <div class="class-cards-grid" role="radiogroup" aria-label="CubeSat Class Selection">
          ${classCards}
        </div>
      </div>

      <div class="point-design-section">
        <div class="sub-heading">
          <span class="step-badge">2</span>
          <h3>Equip Subsystem Components</h3>
        </div>
        ${renderPartsTable(partItems, onTogglePartAction)}
      </div>
    </section>
  `;
}

