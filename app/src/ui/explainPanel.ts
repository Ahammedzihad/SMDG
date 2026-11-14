/**
 * Commander Nova Co-Pilot Assistant Panel
 *
 * Implements the "Co-Pilot Speech Module" from Stitch Project 1937526940901217389.
 * Provides a persistent, interactive right-hand copilot console that adapts
 * to player clicks, explains components and trade-offs, and provides live engine insights.
 */

import { renderIcon } from './icons';
import { renderMascotAvatar } from './mascot';

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
  engineImpact?: string;
  highlightAction?: string;
  status?: 'ready' | 'caution' | 'alert' | 'celebrate';
}

export function renderExplainPanel(content: ExplainContent): string {
  const statusColors = {
    ready: { border: 'rgba(81, 231, 123, 0.35)', glow: 'rgba(81, 231, 123, 0.2)', tag: 'var(--brand-green)', icon: 'check' as const },
    caution: { border: 'rgba(255, 184, 0, 0.35)', glow: 'rgba(255, 184, 0, 0.2)', tag: 'var(--brand-yellow)', icon: 'warning' as const },
    alert: { border: 'rgba(255, 87, 87, 0.45)', glow: 'rgba(255, 87, 87, 0.25)', tag: 'var(--brand-coral)', icon: 'fail' as const },
    celebrate: { border: 'rgba(123, 208, 255, 0.5)', glow: 'rgba(123, 208, 255, 0.3)', tag: 'var(--brand-cyan)', icon: 'star' as const }
  };

  const currentStatus = content.status || 'ready';
  const statusTheme = statusColors[currentStatus];

  return `
    <aside class="explain-panel copilot-console glass-card" aria-label="Commander Nova Co-Pilot Assistant" style="border-color:${statusTheme.border}">
      <!-- Co-Pilot Identity Header -->
      <div class="copilot-header">
        <div class="copilot-avatar-block">
          ${renderMascotAvatar(48)}
          <div>
            <span class="copilot-tag" style="color:${statusTheme.tag}">${escapeHtml(content.category || 'NOVA // YOUR CO-PILOT')}</span>
            <h2 class="copilot-name">Commander Nova</h2>
          </div>
        </div>
      </div>

      <!-- Nova Speech Balloon -->
      <div class="copilot-speech-card glass-card" style="box-shadow: 0 4px 20px ${statusTheme.glow}; border-color:${statusTheme.border}">
        <div class="speech-quote-icon" aria-hidden="true">“</div>
        <p class="copilot-speech-text">${escapeHtml(content.summary)}</p>
        
        ${
          content.engineImpact
            ? `
          <div class="copilot-impact-pill">
            <span class="impact-dot" style="background:${statusTheme.tag}"></span>
            <strong>Engine Telemetry:</strong>
            <span>${escapeHtml(content.engineImpact)}</span>
          </div>
        `
            : ''
        }
      </div>

      <!-- Actionable Fix or Suggestion (if check failed) -->
      ${
        content.highlightAction
          ? `
        <div class="copilot-action-box" role="alert" style="border:1px solid var(--brand-yellow); background:rgba(245, 158, 11, 0.12); padding:10px 14px; border-radius:10px">
          <div style="display:flex; align-items:center; gap:6px; color:var(--brand-yellow); font-size:11px; font-weight:bold; margin-bottom:4px">
            ${renderIcon('warning', 13, '', 'var(--brand-yellow)')}
            <span>RECOMMENDED FIX:</span>
          </div>
          <p style="font-size:12px; color:#fff; line-height:1.4; margin:0">${escapeHtml(content.highlightAction)}</p>
        </div>
      `
          : ''
      }

      <!-- Engineering Trade-Off Block -->
      <div class="copilot-tradeoff-block glass-card">
        <div class="tradeoff-header" style="display:flex; align-items:center; gap:6px">
          <span aria-hidden="true" style="display:inline-flex">${renderIcon('mass', 15, '', 'var(--brand-yellow)')}</span>
          <strong>The Engineering Trade-Off:</strong>
        </div>
        <p>${escapeHtml(content.tradeoff)}</p>
      </div>

      <!-- Authentic NASA Flight Reality Context -->
      ${
        content.nasaContext
          ? `
        <div class="copilot-nasa-block glass-card">
          <div class="tradeoff-header" style="display:flex; align-items:center; gap:6px">
            <span aria-hidden="true" style="display:inline-flex">${renderIcon('rocket', 15, '', 'var(--brand-cyan)')}</span>
            <strong>NASA Flight Reality:</strong>
          </div>
          <p>${escapeHtml(content.nasaContext)}</p>
        </div>
      `
          : ''
      }

      <!-- Footer Mission Lab Reminder -->
      <div class="copilot-footer">
        <small>Every space mission choice costs something somewhere else. No design is perfect—aerospace engineering is the art of balanced trade-offs.</small>
      </div>
    </aside>
  `;
}
