/**
 * How to Play — Orbit Mission Academy Training Manual
 *
 * Implements Google Stitch Screen 58ce5a1431c14e3dab1ee4bc64925bb2:
 * "How to Play - Orbit Mission Academy"
 *
 * Features:
 * - 4-step progressive flight director onboarding:
 *   1. Pick a Destination (Phase A / Orbit Trade)
 *   2. Pack the Right Science (Budget Lab / Instrument Payload)
 *   3. Build Your Spacecraft (Cleanroom Hangar / Subsystem Integration)
 *   4. Launch & Gather Data (Flight Run / Orbital Insertion)
 * - Cockpit simulator visual with Commander Nova companion preview
 * - Audio advice toggle & interactive step expansion
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderHowToPlayModal(): string {
  return `
    <div class="how-to-play-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-surface-container-lowest/80 backdrop-blur-md p-space-md overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="how-to-play-title">
      <div class="how-to-play-modal-dialog relative w-full max-w-5xl rounded-2xl bg-surface-container-low border border-secondary/20 shadow-2xl p-space-lg lg:p-space-xl flex flex-col gap-space-lg my-auto">
        <!-- Close Button -->
        <button type="button" class="how-to-play-close-btn absolute top-4 right-4 w-9 h-9 rounded-full bg-surface-container-high hover:bg-surface-variant text-on-surface hover:text-secondary flex items-center justify-center transition-all cursor-pointer z-10" data-action="close-how-to-play" aria-label="Close Guide">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>

        <!-- Header -->
        <div class="flex flex-col gap-space-xs max-w-2xl">
          <div class="inline-flex items-center gap-space-xs text-secondary font-label-sm text-label-sm uppercase tracking-widest font-bold">
            <span class="material-symbols-outlined text-[16px]">school</span>
            <span>CADET FLIGHT MANUAL // ORBIT MISSION ACADEMY</span>
          </div>
          <h2 id="how-to-play-title" class="font-headline-lg lg:font-headline-xl text-headline-lg lg:text-headline-xl font-bold tracking-tight text-on-surface">
            Become a flight director.
          </h2>
          <p class="font-body-md text-body-md text-on-surface-variant">
            Design a deep-space satellite from scratch, manage budget and power reserves, and complete high-risk planetary exploration.
          </p>
        </div>

        <!-- 2-Column Content Grid matching Stitch Screen 58ce5a1431c14e3dab1ee4bc64925bb2 -->
        <div class="how-to-play-grid grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-stretch">
          <!-- Left Column: The 4 Steps -->
          <div class="how-to-play-step-list lg:col-span-7 flex flex-col gap-space-sm">
            <!-- Step 01 -->
            <div class="how-to-play-step-card step-card p-space-md rounded-xl bg-surface-container/70 border border-white/5 flex items-start gap-space-md shadow-sm">
              <div class="how-to-play-step-num w-10 h-10 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center font-headline-sm text-headline-sm font-bold shrink-0" style="background:rgba(123,208,255,0.15);color:#7bd0ff;">
                01
              </div>
              <div class="flex-1 flex flex-col gap-space-xs">
                <div class="flex items-center justify-between">
                  <h3 class="font-headline-sm text-headline-sm text-on-surface font-semibold">Pick a Destination</h3>
                  <span class="font-label-sm text-label-sm uppercase tracking-wider text-secondary px-space-xs py-0.5 rounded bg-surface-container-highest" style="color:#7bd0ff;background:#2c3545;padding:2px 8px;border-radius:4px;font-size:11px;">
                    PHASE A
                  </span>
                </div>
                <p class="font-body-sm text-body-sm text-on-surface-variant" style="color:#d8c3ad;font-size:13px;line-height:1.4;">
                  Earth Observation, Space Weather, or Deep Space Astronomy. Choose where to explore and inspect celestial gravity wells.
                </p>
              </div>
            </div>

            <!-- Step 02 -->
            <div class="how-to-play-step-card step-card p-space-md rounded-xl bg-surface-container/70 border border-white/5 flex items-start gap-space-md shadow-sm">
              <div class="how-to-play-step-num w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-headline-sm text-headline-sm font-bold shrink-0" style="background:rgba(255,193,116,0.2);color:#ffc174;">
                02
              </div>
              <div class="flex-1 flex flex-col gap-space-xs">
                <div class="flex items-center justify-between">
                  <h3 class="font-headline-sm text-headline-sm text-on-surface font-semibold">Pack the Right Science</h3>
                  <span class="font-label-sm text-label-sm uppercase tracking-wider text-primary px-space-xs py-0.5 rounded bg-surface-container-highest" style="color:#ffc174;background:#2c3545;padding:2px 8px;border-radius:4px;font-size:11px;">
                    BUDGET LAB
                  </span>
                </div>
                <p class="font-body-sm text-body-sm text-on-surface-variant" style="color:#d8c3ad;font-size:13px;line-height:1.4;">
                  Cameras, spectrometers, and radiation detectors. Balance your scientific gear within strict mass and power caps.
                </p>
              </div>
            </div>

            <!-- Step 03 -->
            <div class="how-to-play-step-card step-card p-space-md rounded-xl bg-surface-container/70 border border-white/5 flex items-start gap-space-md shadow-sm">
              <div class="how-to-play-step-num w-10 h-10 rounded-xl bg-secondary-container/20 text-secondary flex items-center justify-center font-headline-sm text-headline-sm font-bold shrink-0" style="background:rgba(0,166,224,0.2);color:#7bd0ff;">
                03
              </div>
              <div class="flex-1 flex flex-col gap-space-xs">
                <div class="flex items-center justify-between">
                  <h3 class="font-headline-sm text-headline-sm text-on-surface font-semibold">Build Your Spacecraft</h3>
                  <span class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant px-space-xs py-0.5 rounded bg-surface-container-highest" style="color:#d8c3ad;background:#2c3545;padding:2px 8px;border-radius:4px;font-size:11px;">
                    HANGAR
                  </span>
                </div>
                <p class="font-body-sm text-body-sm text-on-surface-variant" style="color:#d8c3ad;font-size:13px;line-height:1.4;">
                  Balance solar wings, batteries, OBCs, and reaction wheels so your probe survives deep cosmic space and eclipse shadows.
                </p>
              </div>
            </div>

            <!-- Step 04 -->
            <div class="how-to-play-step-card step-card p-space-md rounded-xl bg-surface-container/70 border border-white/5 flex items-start gap-space-md shadow-sm">
              <div class="how-to-play-step-num w-10 h-10 rounded-xl bg-tertiary-container/30 text-tertiary flex items-center justify-center font-headline-sm text-headline-sm font-bold shrink-0" style="background:rgba(43,202,98,0.3);color:#51e77b;">
                04
              </div>
              <div class="flex-1 flex flex-col gap-space-xs">
                <div class="flex items-center justify-between">
                  <h3 class="font-headline-sm text-headline-sm text-on-surface font-semibold">Launch &amp; Gather Data</h3>
                  <span class="font-label-sm text-label-sm uppercase tracking-wider text-tertiary px-space-xs py-0.5 rounded bg-surface-container-highest" style="color:#51e77b;background:#2c3545;padding:2px 8px;border-radius:4px;font-size:11px;">
                    FLIGHT RUN
                  </span>
                </div>
                <p class="font-body-sm text-body-sm text-on-surface-variant" style="color:#d8c3ad;font-size:13px;line-height:1.4;">
                  Fly the mission, execute orbital insertion, monitor real-time telemetry, and downlink science packets to Earth ground stations.
                </p>
              </div>
            </div>
          </div>

          <!-- Right Column: Visual Stage with Commander Nova Pilot Preview -->
          <div class="lg:col-span-5 flex flex-col justify-between gap-space-sm" style="display:flex; flex-direction:column; justify-content:space-between; gap:16px;">
            <div class="how-to-play-preview-card relative w-full rounded-2xl bg-surface-container-lowest overflow-hidden shadow-2xl flex flex-col justify-end min-h-[300px] border border-white/5">
              <img
                class="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
                style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; pointer-events:none;"
                src="/assets/stitch/asset_6.jpg"
                alt="Commander Nova in Cockpit Simulator"
                onerror="this.onerror=null; this.src='https://lh3.googleusercontent.com/aida-public/AB6AXuB3_QZALQh0WH22XNIRRPT_4quQMCGiWru3uqpiNRotTeC0NHCi9Od8MBKhve6-NUomviQfdyAjc3paDT-zOxYAB1EbtCGA4DeZ7vDk4tZtB2l_svpC-7NkgZZzhS4Gv4Vtf-is_QfiLViT-Xwzd6l7YnIcU0Y6ZWFmh1y_vnc4hqQGA12peJHzVVsBzrNwcrFw2uxFvL5c_tdmjicBfFnpEm9MN55uU_Pkpi53UC0';"
              />
              <div style="position:absolute; inset:0; background:linear-gradient(to top, rgba(6,14,29,0.95) 0%, rgba(6,14,29,0.3) 50%, transparent 100%); pointer-events:none;"></div>

              <!-- Top Badge -->
              <div style="position:absolute; top:12px; left:12px; display:flex; align-items:center; gap:8px; padding:4px 12px; border-radius:9999px; background:rgba(6,14,29,0.85); backdrop-filter:blur(8px); box-shadow:0 2px 8px rgba(0,0,0,0.5);">
                <span style="width:8px; height:8px; border-radius:50%; background:#51e77b; display:inline-block;"></span>
                <span style="font-family:var(--font-display); font-size:11px; color:#dae2f8; letter-spacing:1px; text-transform:uppercase; font-weight:700;">SIM ENGINE READY</span>
              </div>

              <!-- Interactive Pilot Speech Capsule -->
              <div style="position:relative; z-index:10; margin:16px; padding:14px; border-radius:12px; background:rgba(34,42,58,0.9); backdrop-filter:blur(16px); border:1px solid rgba(123,208,255,0.2); box-shadow:0 8px 24px rgba(0,0,0,0.5); display:flex; flex-direction:column; gap:6px;">
                <div style="display:flex; align-items:center; justify-content:space-between;">
                  <div style="display:flex; align-items:center; gap:6px; color:#7bd0ff; font-family:var(--font-display); font-size:11px; text-transform:uppercase; letter-spacing:1px; font-weight:700;">
                    <span class="material-symbols-outlined" style="font-size:16px;">support_agent</span>
                    <span>NOVA / YOUR CO-PILOT</span>
                  </div>
                  <span style="width:8px; height:8px; border-radius:50%; background:#51e77b;"></span>
                </div>
                <p style="font-size:13px; line-height:1.4; color:#dae2f8; font-style:italic; margin:0;">
                  “Welcome to Orbit Mission Academy, Cadet! Follow my tips on the right-hand console if any warning alarms sound. We never leave a space probe stranded!”
                </p>
              </div>
            </div>

            <!-- Footer Action in Modal -->
            <button
              type="button"
              class="how-to-play-cta-btn"
              data-action="close-how-to-play"
            >
              <span>UNDERSTOOD, COMMENCE FLIGHT BRIEFING</span>
              <span class="material-symbols-outlined" style="font-size:18px;">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

