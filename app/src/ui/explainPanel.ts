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

export function renderExplainPanel(content: ExplainContent, isMinimized: boolean = false): string {
  const statusColors = {
    ready: { border: 'rgba(81, 231, 123, 0.4)', glow: 'rgba(81, 231, 123, 0.25)', tag: 'var(--brand-green)', icon: 'check' as const },
    caution: { border: 'rgba(255, 184, 0, 0.4)', glow: 'rgba(255, 184, 0, 0.25)', tag: 'var(--brand-yellow)', icon: 'warning' as const },
    alert: { border: 'rgba(255, 87, 87, 0.5)', glow: 'rgba(255, 87, 87, 0.3)', tag: 'var(--brand-coral)', icon: 'fail' as const },
    celebrate: { border: 'rgba(123, 208, 255, 0.55)', glow: 'rgba(123, 208, 255, 0.35)', tag: 'var(--brand-cyan)', icon: 'star' as const }
  };

  const currentStatus = content.status || 'ready';
  const statusTheme = statusColors[currentStatus];

  return `
    <aside
      class="explain-panel copilot-console glass-card ${isMinimized ? 'is-minimized' : ''}"
      aria-label="Commander Nova Mission Co-Pilot"
      style="border-color:${statusTheme.border};"
    >
      <!-- Persistent Character Portrait on Left & Angular Dialogue on Right -->
      <div class="copilot-identity-bar flex items-start gap-3 w-full">
        <!-- Persistent Character Portrait (Left) -->
        <div class="copilot-portrait-column shrink-0">
          ${renderMascotAvatar(60)}
        </div>

        <!-- Angular-Corner Dialogue Panel (Right) -->
        <div class="copilot-dialogue-angular-panel flex-1">
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <div class="flex flex-col min-w-0">
              <span class="copilot-tag text-[10px] font-mono font-bold tracking-wider truncate" style="color:${statusTheme.tag}">
                ${escapeHtml(content.category || 'NOVA // MISSION CO-PILOT')}
              </span>
              <div class="flex items-center gap-1.5">
                <h2 class="copilot-name text-[16px] font-bold text-white tracking-tight m-0">
                  Commander Nova
                </h2>
                <span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-secondary/20 text-secondary border border-secondary/30">
                  CO-PILOT
                </span>
              </div>
            </div>
            <!-- Minimize / Expand Toggle Control (Min 44x44px touch target) -->
            <button
              type="button"
              class="w-11 h-11 shrink-0 rounded-lg bg-surface-container/60 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-all cursor-pointer border border-white/5 active:scale-95"
              data-action="toggle-nova-panel"
              aria-label="${isMinimized ? 'Expand Commander Nova dialogue' : 'Minimize Commander Nova dialogue'}"
              title="${isMinimized ? 'Expand dialogue' : 'Minimize dialogue'}"
              style="min-width: 44px; min-height: 44px;"
            >
              <span class="material-symbols-outlined text-[20px]">
                ${isMinimized ? 'expand_more' : 'expand_less'}
              </span>
            </button>
          </div>

          <!-- Short Dialogue Speech Box (Click/Tap/Space to skip typewriter) -->
          <div
            class="copilot-speech-box ${isMinimized ? 'hidden' : ''} cursor-pointer select-none rounded-lg p-2.5 bg-surface-container-lowest/80 border border-secondary/20 hover:border-secondary/40 transition-colors"
            data-action="skip-typewriter"
            tabindex="0"
            role="button"
            aria-label="Commander Nova dialogue. Press Enter or Space to reveal entire message."
            title="Click or press Space to reveal full message immediately"
          >
            <p
              class="copilot-speech-text typewriter-target text-[13px] leading-relaxed text-slate-100 font-medium m-0"
              data-full-text="${escapeHtml(content.summary)}"
            >
              ${escapeHtml(content.summary)}
            </p>
            <div class="flex items-center justify-between mt-1 pt-1 border-t border-white/5 text-[10px] text-on-surface-variant/60 font-mono">
              <span>(click to skip reveal)</span>
              <span class="text-secondary/70">▶ ACTIVE COMMS</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Essential Engineering Details (Hidden when minimized) -->
      ${
        !isMinimized
          ? `
        <!-- Engine Telemetry Impact Pill -->
        ${
          content.engineImpact
            ? `
          <div class="copilot-impact-pill mt-1">
            <span class="impact-dot" style="background:${statusTheme.tag}"></span>
            <strong>Engine Telemetry:</strong>
            <span>${escapeHtml(content.engineImpact)}</span>
          </div>
        `
            : ''
        }

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
      `
          : ''
      }
    </aside>
  `;
}
