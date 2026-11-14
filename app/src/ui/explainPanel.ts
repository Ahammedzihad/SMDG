/**
 * Right-hand "Explain This" Panel
 * Explains engineering trade-offs, glossary concepts, and reasons for warnings or limits.
 */

import { renderIcon } from './icons';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface ExplainContent {
  title: string;
  category: string;
  summary: string;
  tradeoff: string;
  nasaContext?: string;
}

export function renderExplainPanel(content: ExplainContent): string {
  return `
    <aside class="explain-panel glass-card" aria-label="Engineering Trade-off Explanation">
      <div class="explain-header">
        <span class="panel-eyebrow">NASA MISSION DESIGN LAB · CML 1–4</span>
        <h2>Explain This</h2>
      </div>

      <div class="explain-card glass-card">
        <span class="explain-tag">${escapeHtml(content.category)}</span>
        <h3 class="explain-title">${escapeHtml(content.title)}</h3>
        <p class="explain-summary">${escapeHtml(content.summary)}</p>
      </div>

      <div class="explain-tradeoff-block">
        <div class="tradeoff-header" style="display:flex; align-items:center; gap:6px">
          <span aria-hidden="true" style="display:inline-flex">${renderIcon('mass', 15, '', 'var(--brand-yellow)')}</span>
          <strong>The Engineering Trade-Off:</strong>
        </div>
        <p>${escapeHtml(content.tradeoff)}</p>
      </div>

      ${
        content.nasaContext
          ? `
        <div class="explain-nasa-block">
          <div class="tradeoff-header" style="display:flex; align-items:center; gap:6px">
            <span aria-hidden="true" style="display:inline-flex">${renderIcon('rocket', 15, '', 'var(--brand-cyan)')}</span>
            <strong>NASA Flight Reality:</strong>
          </div>
          <p>${escapeHtml(content.nasaContext)}</p>
        </div>
      `
          : ''
      }

      <div class="explain-footer">
        <small>Every space mission choice costs something somewhere else. No design is perfect—engineering is the art of balanced trade-offs.</small>
      </div>
    </aside>
  `;
}

