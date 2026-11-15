/**
 * Stage 4: Point Design (CML 4)
 *
 * Implements Google Stitch Screen 35fcc636dafb44cd921b737cdfcf3bd5 (3D Spacecraft Assembly)
 * and Screen 82a4d657a38042e694180838e6243223 (Spacecraft Body Selection).
 *
 * Features:
 * - 3D live turntable spacecraft rig with rotation & diagnostics controls
 * - Stitch CubeSat chassis selection cards with 3D art previews
 * - Mounted Module Array (Equipped Parts Tray)
 * - Subsystem component library with category tabs & 1-click equip/remove
 * - Real-time sync with Three.js scene and authoritative @shared engine
 */

import type { CubeSatClass, Part, Meters } from '@shared';
import { renderEquippedModuleTray, renderModularPartsCatalog, type PartRowItem } from '../partsTable';
import { renderIcon } from '../icons';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const CHASSIS_ART_MAP: Record<string, { image: string; tag: string; description: string }> = {
  '1U': {
    image: '/assets/stitch/asset_9.jpg',
    tag: 'Standard 1U CubeSat Frame',
    description: 'Compact 10×10×10 cm aluminum envelope, ultra-lightweight standard dispenser integration.'
  },
  '3U': {
    image: '/assets/stitch/asset_10.jpg',
    tag: 'Extended 3U Triple-Unit Bus',
    description: 'Triple-length 10×10×34 cm chassis allowing dedicated payload bays, deployable arrays, and ADCS reaction wheels.'
  }
};

export function renderPointDesignStage(
  classes: CubeSatClass[],
  selectedClassId: string,
  parts: Part[],
  selectedPartIds: string[],
  activePartCategory: string = 'all',
  meters?: Meters,
  onSelectClassAction: string = 'select-class',
  onTogglePartAction: string = 'toggle-part',
  onCategoryFilterAction: string = 'filter-category',
  onFocusPartAction: string = 'focus-part',
  canUndo: boolean = false,
  onUndoAction: string = 'undo-design',
  onResetAction: string = 'reset-stage4'
): string {
  // CubeSat class selection cards
  const classCards = classes
    .map((cls) => {
      const isSelected = cls.id === selectedClassId;
      const art = CHASSIS_ART_MAP[cls.id] || {
        image: '/assets/stitch/asset_9.jpg',
        tag: `${cls.name} Bus`,
        description: `Dispenser standard with ${cls.height_mm} mm height envelope.`
      };

      return `
        <article
          class="class-card stage-card group relative flex flex-col justify-between rounded-xl p-space-md cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${
            isSelected
              ? 'bg-surface-container-high/95 shadow-lg border-t-2 border-secondary'
              : 'bg-surface-container/70 hover:bg-surface-container-high shadow-md border border-white/5'
          }"
          tabindex="0"
          role="radio"
          aria-checked="${isSelected}"
          data-action="${onSelectClassAction}"
          data-id="${cls.id}"
        >
          <div class="flex items-center justify-between gap-space-xs mb-space-sm">
            <span class="px-space-xs py-0.5 rounded font-label-sm text-label-sm uppercase tracking-wider flex items-center gap-1 ${
              isSelected ? 'bg-secondary text-on-secondary font-bold' : 'bg-surface-variant text-on-surface-variant'
            }">
              <span class="material-symbols-outlined text-[14px]">${isSelected ? 'check_circle' : 'view_in_ar'}</span>
              ${isSelected ? 'CURRENTLY EQUIPPED' : 'SELECT CHASSIS'}
            </span>
            <span class="font-label-sm text-label-sm text-secondary font-mono">${cls.id}</span>
          </div>

          <div class="relative w-full h-36 rounded-lg overflow-hidden bg-surface-container-lowest flex items-center justify-center mb-space-sm">
            <img
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              src="${art.image}"
              alt="${escapeHtml(cls.name)}"
              onerror="this.onerror=null; this.src='https://lh3.googleusercontent.com/aida-public/AB6AXuDCzKLqI4F_epPky7FqSgfpQ5RWAQ_G7VXd5-LOsUa-PJhfMbOyWihsqYMCSG_ObhNVb9Yelp1gOCDZoMUiGmwHqpZ9bD7HUkoAZALsVwmvcGng3Cpt3hh0_MLkx9dMEAn0FqJaxj_i0pAk3hh0a0pufplBvLyBMBfr6FfWi4Dyy4CiapmeymxQAqJbN69-FKu_04N0VG-7i-HwkqmA2sysJ7KixHNd0b3dv-A86b4';"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent opacity-80"></div>
            <div class="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container-lowest/80 backdrop-blur-sm">
              <span class="font-label-sm text-label-sm text-secondary font-bold">${art.tag}</span>
            </div>
          </div>

          <div class="flex flex-col gap-space-xs mb-space-sm">
            <h3 class="font-headline-sm text-headline-sm text-on-surface font-bold group-hover:text-secondary transition-colors">
              ${escapeHtml(cls.name)}
            </h3>
            <p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
              ${escapeHtml(art.description)}
            </p>
          </div>

          <div class="space-y-space-xs py-space-xs mb-space-sm bg-surface-container-low/60 rounded-lg p-space-sm">
            <div class="flex justify-between font-label-sm text-label-sm">
              <span class="text-on-surface-variant">MASS ENVELOPE</span>
              <span class="text-on-surface font-semibold">Max ${cls.mass_limit_kg.toFixed(2)} kg</span>
            </div>
            <div class="flex justify-between font-label-sm text-label-sm">
              <span class="text-on-surface-variant">DISPENSER HEIGHT</span>
              <span class="text-secondary font-mono">${cls.height_mm} mm</span>
            </div>
          </div>

          <button
            class="w-full py-space-xs px-space-md rounded-lg font-label-md text-label-md uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 ${
              isSelected
                ? 'bg-secondary/20 text-secondary border border-secondary/40'
                : 'bg-surface-container-high hover:bg-surface-variant text-on-surface'
            }"
            type="button"
          >
            <span class="material-symbols-outlined text-[18px]">${isSelected ? 'check_circle' : 'touch_app'}</span>
            <span>${isSelected ? 'Chassis Configured' : 'Select ' + cls.name}</span>
          </button>
        </article>
      `;
    })
    .join('');

  // Prepare Master Equipment List rows & cards
  const partItems: PartRowItem[] = parts.map((part) => {
    const isSelected = selectedPartIds.includes(part.id);
    return {
      part,
      selected: isSelected,
      disabled: false,
      disabledReason: undefined
    };
  });

  // Telemetry status strip for the hangar
  const massLimit = classes.find((c) => c.id === selectedClassId)?.mass_limit_kg ?? 4.0;
  const currentMass = meters ? meters.mass.value : 2.5;
  const netPower = meters ? (meters.power.limit - meters.power.value) : 10.0;
  const isOverMass = currentMass > massLimit;

  // 7 Subsystem Architecture Bays
  const SUBSYSTEM_BAYS = [
    { category: 'structure', title: 'Chassis Envelope', slot: 'Bus Structure', icon: 'view_in_ar' },
    { category: 'power', title: 'Power Generation', slot: 'Solar Array Bay', icon: 'solar_power' },
    { category: 'battery', title: 'Energy Storage', slot: 'Battery Compartment', icon: 'battery_charging_full' },
    { category: 'instrument', title: 'Scientific Payload', slot: 'Payload Bay', icon: 'biotech' },
    { category: 'comms', title: 'Telemetry & Downlink', slot: 'Antenna & RF Bay', icon: 'cell_tower' },
    { category: 'adcs', title: 'Attitude Pointing', slot: 'Pointing & ADCS Bay', icon: 'explore' },
    { category: 'computer', title: 'On-Board Computer', slot: 'Avionics Stack', icon: 'memory' }
  ];

  const baysHtml = SUBSYSTEM_BAYS.map((bay) => {
    const equippedInBay = parts.filter(
      (p) => p.category === bay.category && selectedPartIds.includes(p.id)
    );

    if (equippedInBay.length > 0) {
      const itemsHtml = equippedInBay
        .map((part) => {
          const isSolar = part.category === 'power' && (part.solar_area_m2 ?? 0) > 0;
          const peakGen = isSolar ? ((part.solar_area_m2 || 0) * (part.solar_efficiency_w_per_m2 || 220)).toFixed(1) : '0';
          const powerStr = isSolar ? `+${peakGen}W Peak` : `-${part.power.toFixed(1)}W Load`;
          const powerColor = isSolar ? 'text-tertiary' : 'text-primary';
          return `
            <div class="flex items-center justify-between gap-2 p-2 rounded-lg bg-surface-container-high/90 border border-white/10 mt-1">
              <div class="flex flex-col min-w-0">
                <span class="font-body-sm text-body-sm font-bold text-on-surface truncate" title="${escapeHtml(part.name)}">
                  ${escapeHtml(part.name)}
                </span>
                <span class="font-label-sm text-[11px] text-on-surface-variant font-mono">
                  ${part.mass.toFixed(2)} kg · <span class="${powerColor}">${powerStr}</span> · $${part.cost.toFixed(2)}M
                </span>
              </div>
              <button
                type="button"
                class="w-11 h-11 shrink-0 rounded-lg bg-surface-container hover:bg-error/20 text-on-surface-variant hover:text-error flex items-center justify-center transition-all cursor-pointer border border-white/5 active:scale-95"
                data-action="${onTogglePartAction}"
                data-part-id="${part.id}"
                aria-label="Remove ${escapeHtml(part.name)} from ${bay.title}"
                title="Remove component"
                style="min-width: 44px; min-height: 44px;"
              >
                <span class="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          `;
        })
        .join('');

      return `
        <div class="subsystem-bay-card flex flex-col justify-between p-space-sm rounded-xl bg-surface-container/70 border border-secondary/30 shadow-md">
          <div>
            <div class="flex items-center justify-between gap-1 mb-1">
              <span class="font-label-sm text-[11px] uppercase tracking-wider text-secondary font-mono flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px]">${bay.icon}</span>
                ${bay.slot}
              </span>
              <span class="px-1.5 py-0.5 rounded text-[10px] bg-tertiary/20 text-tertiary font-bold font-mono">
                SLOTTED
              </span>
            </div>
            <h4 class="font-label-md text-label-md font-semibold text-on-surface">
              ${bay.title}
            </h4>
            ${itemsHtml}
          </div>
        </div>
      `;
    }

    return `
      <div class="subsystem-bay-card flex flex-col justify-between p-space-sm rounded-xl bg-surface-container/40 border border-dashed border-white/15 hover:border-secondary/40 transition-colors">
        <div>
          <div class="flex items-center justify-between gap-1 mb-1">
            <span class="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-mono flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px]">${bay.icon}</span>
              ${bay.slot}
            </span>
            <span class="px-1.5 py-0.5 rounded text-[10px] bg-surface-container-high text-on-surface-variant font-mono">
              EMPTY
            </span>
          </div>
          <h4 class="font-label-md text-label-md font-semibold text-on-surface-variant">
            ${bay.title}
          </h4>
          <p class="font-body-sm text-[12px] text-on-surface-variant/70 mt-1">
            No module installed in this bay.
          </p>
        </div>
        <button
          type="button"
          class="mt-2 w-full py-2 px-3 rounded-lg bg-surface-container hover:bg-secondary/15 text-secondary hover:text-on-surface font-label-sm text-[11px] uppercase tracking-wider font-bold transition-all border border-secondary/20 flex items-center justify-center gap-1 cursor-pointer"
          data-action="${onCategoryFilterAction}"
          data-category="${bay.category}"
          style="min-height: 44px; min-width: 44px;"
          title="Filter catalog to ${bay.title}"
        >
          <span class="material-symbols-outlined text-[16px]">add_circle</span>
          <span>Browse ${bay.title}</span>
        </button>
      </div>
    `;
  }).join('');

  return `
    <section class="wizard-stage-view stage-point-design flex flex-col gap-space-lg w-full max-w-7xl mx-auto" aria-labelledby="stage-heading">
      <!-- Top Telemetry Progress & Overline -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
        <div class="flex items-center gap-space-xs">
          <span class="inline-flex items-center gap-1.5 px-space-md py-1 rounded-full bg-secondary/10 text-secondary font-label-sm text-label-sm uppercase tracking-widest shadow-[0_0_12px_rgba(123,208,255,0.2)]">
            <span class="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
            STEP 02B: SUBSYSTEM INTEGRATION
          </span>
          <span class="hidden sm:inline text-surface-variant font-label-sm text-label-sm">•</span>
          <span class="hidden sm:inline font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">CML 4: POINT DESIGN</span>
        </div>

        <!-- Cleanroom Assembly Controls: Undo & Reset -->
        <div class="flex items-center gap-space-xs">
          <button
            type="button"
            class="flex items-center gap-2 px-space-md py-2 rounded-xl font-label-md text-label-md uppercase tracking-wider font-bold transition-all ${
              canUndo
                ? 'bg-surface-container-high hover:bg-secondary/20 text-on-surface hover:text-secondary border border-secondary/30 cursor-pointer shadow-sm active:scale-95'
                : 'bg-surface-container-low text-on-surface-variant/40 border border-white/5 cursor-not-allowed'
            }"
            data-action="${onUndoAction}"
            ${canUndo ? '' : 'disabled'}
            style="min-height: 44px; min-width: 44px;"
            aria-label="Undo last assembly change"
            title="${canUndo ? 'Revert last component change' : 'No changes to undo'}"
          >
            <span class="material-symbols-outlined text-[18px]">undo</span>
            <span>Undo</span>
          </button>
          <button
            type="button"
            class="flex items-center gap-2 px-space-md py-2 rounded-xl font-label-md text-label-md uppercase tracking-wider font-bold bg-surface-container-high hover:bg-error/20 text-on-surface-variant hover:text-error border border-white/10 hover:border-error/30 transition-all cursor-pointer shadow-sm active:scale-95"
            data-action="${onResetAction}"
            style="min-height: 44px; min-width: 44px;"
            aria-label="Reset stage 4 components to baseline"
            title="Reset subsystem assembly to baseline configuration"
          >
            <span class="material-symbols-outlined text-[18px]">restart_alt</span>
            <span>Reset</span>
          </button>
        </div>
      </div>

      <!-- Editorial Header -->
      <div class="space-y-space-xs">
        <h1 id="stage-heading" class="font-headline-lg lg:font-headline-xl text-headline-lg lg:text-headline-xl text-on-surface tracking-tight font-bold">
          Assemble your robotic explorer.
        </h1>
        <p class="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Assemble your spacecraft subsystem by subsystem in the cleanroom hangar.
          Adding components increases scientific capabilities, while consuming mass, electricity, and project reserves.
        </p>
      </div>

      <!-- 3D Turntable Spacecraft Viewport (Stitch Screen 35fcc636dafb44cd921b737cdfcf3bd5) -->
      <div class="spacecraft-hangar-panel rounded-2xl bg-surface-container-low/90 backdrop-blur-xl border border-secondary/20 p-space-md shadow-2xl overflow-hidden">
        <div class="flex flex-wrap justify-between items-center mb-space-sm gap-space-xs">
          <div class="flex items-center gap-space-xs">
            <span class="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse"></span>
            <span class="font-label-sm text-label-sm tracking-wider uppercase text-on-surface font-bold">
              3D SPACECRAFT ASSEMBLY TURNTABLE RIG
            </span>
          </div>
          <div class="flex items-center gap-space-md">
            <span class="font-label-sm text-label-sm font-mono ${isOverMass ? 'text-error font-bold' : 'text-tertiary font-bold'}">
              ${isOverMass ? '⚠ OVERWEIGHT WARNING' : '✓ MASS WITHIN LIMIT'} (${currentMass.toFixed(2)} / ${massLimit.toFixed(2)} kg)
            </span>
            <span class="font-label-sm text-label-sm font-mono text-secondary font-bold" title="Orbit-averaged generation (${meters ? meters.power.limit.toFixed(1) : '10.4'} W) minus duty-cycle adjusted load (${meters ? meters.power.value.toFixed(1) : '6.4'} W) in target orbit">
              ORBIT-AVG NET: ${netPower >= 0 ? '+' : ''}${netPower.toFixed(1)} W (${meters ? meters.power.limit.toFixed(1) : '10.4'}W gen · ${meters ? meters.power.value.toFixed(1) : '6.4'}W load)
            </span>
          </div>
        </div>

        <div class="scene-card turntable-scene-card relative w-full rounded-xl overflow-hidden bg-surface-container-lowest shadow-inner flex items-center justify-center" style="min-height: 380px; height: 380px;">
          <div class="scene-host" data-scene style="width:100%; height:100%; min-height: 380px;"></div>

          <!-- Turntable Radial Grid SVG Overlay -->
          <svg class="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-80 h-24 pointer-events-none opacity-40 text-secondary" fill="none" viewBox="0 0 320 110">
            <ellipse cx="160" cy="55" rx="140" ry="40" stroke="currentColor" stroke-dasharray="4 4" stroke-width="1.5"></ellipse>
            <ellipse cx="160" cy="55" rx="100" ry="25" stroke="currentColor" stroke-width="1"></ellipse>
            <ellipse cx="160" cy="55" rx="50" ry="12" stroke="currentColor" stroke-width="2"></ellipse>
          </svg>

          <!-- Holographic Status Pills -->
          <div class="absolute top-4 left-4 hidden sm:flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-surface-container-lowest/80 backdrop-blur-md shadow-md">
            <span class="w-2 h-2 rounded-full bg-tertiary"></span>
            <span class="font-label-sm text-label-sm text-on-surface uppercase tracking-wider">3D TURNTABLE ONLINE</span>
          </div>

          <!-- Turntable Camera Controls -->
          <div class="absolute bottom-4 left-4 flex items-center gap-space-xs z-10">
            <button type="button" class="w-11 h-11 rounded-lg bg-surface-container/80 hover:bg-surface-container-high text-on-surface flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer" data-action="scene-rotate-left" title="Rotate Spacecraft Left" aria-label="Rotate Left" style="min-width: 44px; min-height: 44px;">
              <span class="material-symbols-outlined text-[18px]">rotate_left</span>
            </button>
            <button type="button" class="w-11 h-11 rounded-lg bg-surface-container/80 hover:bg-surface-container-high text-on-surface flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer" data-action="scene-rotate-right" title="Rotate Spacecraft Right" aria-label="Rotate Right" style="min-width: 44px; min-height: 44px;">
              <span class="material-symbols-outlined text-[18px]">rotate_right</span>
            </button>
            <button type="button" class="px-space-md py-2 rounded-lg bg-surface-container/80 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm uppercase tracking-wider flex items-center gap-space-xs shadow-md transition-all cursor-pointer" data-action="scene-reset-camera" title="Reset View" aria-label="Reset View" style="min-height: 44px; min-width: 44px;">
              <span class="material-symbols-outlined text-[16px] text-secondary">filter_center_focus</span>
              <span>Reset View</span>
            </button>
          </div>

          <div class="absolute bottom-4 right-4 font-label-sm text-label-sm text-on-surface-variant uppercase font-mono pointer-events-none bg-surface-container-lowest/70 px-2 py-0.5 rounded backdrop-blur-sm">
            DRAG TO ROTATE · SCROLL TO ZOOM
          </div>
        </div>
      </div>

      <!-- Step 1: Form Factor (Chassis Body Selection - Stitch Screen 82a4d657a38042e694180838e6243223) -->
      <div class="point-design-section flex flex-col gap-space-md">
        <div class="flex items-center gap-space-xs">
          <span class="w-6 h-6 rounded-full bg-primary text-on-primary font-bold font-label-sm text-label-sm flex items-center justify-center">1</span>
          <h2 class="font-headline-sm text-headline-sm text-on-surface font-semibold">Select Spacecraft Form Factor (CubeSat Chassis)</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-space-md" role="radiogroup" aria-label="CubeSat Class Selection">
          ${classCards}
        </div>
      </div>

      <!-- Step 2: Visual Subsystem Architecture Bays (7 Subsystems) -->
      <div class="point-design-section flex flex-col gap-space-md pt-space-xs">
        <div class="flex items-center justify-between gap-space-xs">
          <div class="flex items-center gap-space-xs">
            <span class="w-6 h-6 rounded-full bg-primary text-on-primary font-bold font-label-sm text-label-sm flex items-center justify-center">2</span>
            <h2 class="font-headline-sm text-headline-sm text-on-surface font-semibold">Subsystem Architecture Bays (Visual Layout)</h2>
          </div>
          <span class="font-label-sm text-label-sm text-on-surface-variant font-mono">
            ${selectedPartIds.length} ACTIVE MODULES
          </span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm">
          ${baysHtml}
        </div>
        <div class="p-3 rounded-lg bg-surface-container-low/60 border border-white/5 flex items-start gap-2">
          <span class="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">info</span>
          <p class="font-body-sm text-[12px] text-on-surface-variant">
            <strong>Architecture Allocation Note:</strong> Visual attachment bays illustrate subsystem layout in the CubeSat bus. Functional compatibility, mass margin, power generation, and telemetry link calculations are evaluated authoritatively by the flight computer engine.
          </p>
        </div>
      </div>

      <!-- Step 3: Mounted Module Array (Equipped Parts Tray) -->
      <div class="point-design-section flex flex-col gap-space-md pt-space-xs">
        <div class="flex items-center gap-space-xs">
          <span class="w-6 h-6 rounded-full bg-primary text-on-primary font-bold font-label-sm text-label-sm flex items-center justify-center">3</span>
          <h2 class="font-headline-sm text-headline-sm text-on-surface font-semibold">Mounted Module Array (Equipped Subsystems)</h2>
        </div>
        ${renderEquippedModuleTray(partItems, onTogglePartAction)}
      </div>

      <!-- Step 4: Modular Subsystem Catalog -->
      <div class="point-design-section flex flex-col gap-space-md pt-space-xs">
        <div class="flex items-center gap-space-xs">
          <span class="w-6 h-6 rounded-full bg-primary text-on-primary font-bold font-label-sm text-label-sm flex items-center justify-center">4</span>
          <h2 class="font-headline-sm text-headline-sm text-on-surface font-semibold">Subsystem Hardware Catalog</h2>
        </div>
        ${renderModularPartsCatalog(partItems, activePartCategory, onTogglePartAction, onCategoryFilterAction, onFocusPartAction)}
      </div>
    </section>
  `;
}
