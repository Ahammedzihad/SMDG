/**
 * Solo Mission Design Wizard
 * Coordinates the 7-stage CML mission workflow, stage navigation,
 * state persistence, live engine evaluation, and dynamic 3D Three.js integration.
 */

import type {
  CubeSatClass,
  Meters,
  MissionDesign,
  MissionValidationResult,
  Objective,
  Orbit,
  Part,
  Report,
  ScoreBreakdown,
  SimResult,
  Vehicle
} from '@shared';

import {
  buildReport,
  computeMeters,
  getCubesatClasses,
  getObjectives,
  getOrbits,
  getParts,
  getVehicles,
  runChecks,
  runSimulation,
  scoreMission
} from '../engine/engineAdapter';

import { createMissionScene, mapDesignToSceneConfig, type SimVisualState } from '../scene';

import { renderObjectiveStage } from './stages/objective';
import { renderRequirementsStage } from './stages/requirements';
import { renderTradeSpaceStage } from './stages/tradeSpace';
import { renderPointDesignStage } from './stages/pointDesign';
import { renderReviewStage } from './stages/review';
import { renderLaunchStage, type LaunchTelemetryState } from './stages/launch';
import { renderReportStage } from './stages/report';
import { renderResourceBar } from './resourceBar';
import { renderExplainPanel, type ExplainContent } from './explainPanel';
import { getNovaContextMessage, type ActiveSelectionContext } from './mascot';
import { missionPath, primaryButton, secondaryButton } from './components';
import { renderHowToPlayModal } from './howToPlay';

export const STAGE_NAMES = [
  'Objective (CML 1)',
  'Initial Feasibility (CML 2)',
  'Trade Space (CML 3)',
  'Point Design (CML 4)',
  'Pre-Launch Review',
  'Launch',
  'Report'
] as const;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface FlightStep {
  met: string;
  title: string;
  detail: string;
  alt: string;
  vel: string;
  mode: SimVisualState['mode'];
  simProgress: number;
}

export function buildFlightSteps(orbit?: Orbit): FlightStep[] {
  const targetAltKm = orbit?.altitude_km ?? 550;
  const targetAltStr = `${Math.round(targetAltKm).toLocaleString()} km`;
  const targetOrbitName = orbit?.name ?? 'Sun-Synchronous Orbit (SSO)';

  // Calculate approximate orbital insertion speed using standard gravitational parameter
  // v = sqrt(mu / r), mu = 398600.44 km^3/s^2, r = 6378.14 + altitude
  const orbitalSpeedKms = (Math.sqrt(398600.44 / (6378.14 + Math.min(targetAltKm, 35786)))).toFixed(1);

  return [
    {
      met: 'T-00:10',
      title: 'Launch Pad Countdown',
      detail: 'Demonstration launch site (Chesapeake Bay). Systems pre-flight health checkout. Flight computer armed.',
      alt: '0 km',
      vel: '0.0 km/s',
      mode: 'launch',
      simProgress: 0.0
    },
    {
      met: 'T+00:02',
      title: 'Main Engine Ignition & Liftoff',
      detail: 'Rocket booster ignition. Transonic atmospheric ascent through Max-Q.',
      alt: '45 km',
      vel: '1.4 km/s',
      mode: 'launch',
      simProgress: 0.35
    },
    {
      met: 'T+00:45',
      title: 'Fairing Jettison & Upper Stage Burn',
      detail: 'Payload fairing separated. Upper stage burn active toward orbital altitude.',
      alt: `${Math.round(Math.min(210, targetAltKm * 0.4))} km`,
      vel: '5.8 km/s',
      mode: 'launch',
      simProgress: 0.75
    },
    {
      met: 'T+01:15',
      title: 'Dispenser Spring Ejection',
      detail: 'Pneumatic dispenser release confirmed into orbital trajectory.',
      alt: `${Math.round(Math.min(480, targetAltKm * 0.88))} km`,
      vel: `${orbitalSpeedKms} km/s`,
      mode: 'launch',
      simProgress: 1.0
    },
    {
      met: 'T+02:00',
      title: 'Orbit Insertion & Array Deployment',
      detail: `Target orbital altitude established in ${targetOrbitName}. Solar panels deploy; battery charging online.`,
      alt: targetAltStr,
      vel: `${orbitalSpeedKms} km/s`,
      mode: 'deploy',
      simProgress: 0.5
    },
    {
      met: 'T+03:30',
      title: 'Payload Sensor Checkout',
      detail: 'Scientific instrument initialized. First observation telemetry frames buffered.',
      alt: targetAltStr,
      vel: `${orbitalSpeedKms} km/s`,
      mode: 'observe',
      simProgress: 1.0
    },
    {
      met: 'T+05:00',
      title: 'Ground Station Downlink Contact',
      detail: 'Acquisition of signal (AOS). Radio downlink transmitting science packets.',
      alt: targetAltStr,
      vel: `${orbitalSpeedKms} km/s`,
      mode: 'downlink',
      simProgress: 1.0
    }
  ];
}

export interface WizardState {
  currentStage: number; // 1 to 7
  maxStageReached: number;
  design: MissionDesign;
  simResult: SimResult | null;
  score: ScoreBreakdown | null;
  report: Report | null;
}

export class MissionWizard {
  private state: WizardState;
  private objectives: Objective[];
  private orbits: Orbit[];
  private vehicles: Vehicle[];
  private classes: CubeSatClass[];
  private parts: Part[];
  private container: HTMLElement;
  private scene: ReturnType<typeof createMissionScene>;
  private abortController: AbortController = new AbortController();
  private exitCallback?: () => void;
  private flightTimer: number | null = null;
  private flightStepIndex: number = 0;
  private isSimulating: boolean = false;
  private flightLogs: Array<{ text: string; warn?: boolean }> = [];
  private activePartCategory: string = 'all';
  private activeSelection: ActiveSelectionContext | null = null;
  private isHowToPlayOpen: boolean = false;

  constructor(container: HTMLElement, scene?: ReturnType<typeof createMissionScene>) {
    this.container = container;
    this.scene = scene || createMissionScene();

    // Load authentic catalogs from shared engine
    this.objectives = getObjectives();
    this.orbits = getOrbits();
    this.vehicles = getVehicles();
    this.classes = getCubesatClasses();
    this.parts = getParts();

    this.state = {
      currentStage: 1,
      maxStageReached: 1,
      design: this.getDefaultDesign(),
      simResult: null,
      score: null,
      report: null
    };

    this.attachEventListeners();
    this.syncSceneWithDesign();
  }

  private getDefaultDesign(): MissionDesign {
    const defaultObjective = this.objectives.find((o) => o.id === 'earth_observation')?.id ?? this.objectives[0]?.id ?? 'earth_observation';
    const defaultOrbit = this.orbits.find((o) => o.id === 'sso')?.id ?? this.orbits[0]?.id ?? 'sso';
    const defaultVehicle = this.vehicles.find((v) => v.id === 'rideshare_dispenser')?.id ?? this.vehicles[0]?.id ?? 'rideshare_dispenser';
    const defaultClass = this.classes.find((c) => c.id === '3U')?.id ?? this.classes[0]?.id ?? '3U'; // 3U standard

    return {
      objective_id: defaultObjective,
      orbit_id: defaultOrbit,
      vehicle_id: defaultVehicle,
      cubesat_class_id: defaultClass,
      part_ids: [
        'struct_3u',
        'solar_deployable_3u',
        'batt_space_30wh',
        'comms_sband_patch',
        'obc_rad_hard',
        'adcs_3axis_wheels',
        'inst_multispectral_imager'
      ],
      lifetime_months: 12,
      budget_m: 2.5,
      fuel_mass_kg: 0.1,
      duty_cycle: 0.5,
      observe_time_fraction: 0.5,
      link_efficiency: 0.95
    };
  }

  public onExit(fn: () => void): void {
    this.exitCallback = fn;
  }

  public destroy(): void {
    if (this.flightTimer) {
      clearInterval(this.flightTimer);
      this.flightTimer = null;
    }
    this.abortController.abort();
  }

  public getState(): WizardState {
    return this.state;
  }

  public syncSceneWithDesign(): void {
    const config = mapDesignToSceneConfig(this.state.design);
    this.scene.update(config);
  }

  public setStage(stageNumber: number): void {
    if (stageNumber < 1 || stageNumber > 7) return;

    // Leaving launch stage while simulating? Reset simulation state gracefully
    if (this.state.currentStage === 6 && stageNumber !== 6 && this.isSimulating) {
      if (this.flightTimer) {
        clearInterval(this.flightTimer);
        this.flightTimer = null;
      }
      this.isSimulating = false;
      this.scene.setSimState({ mode: 'orbit', progress: 1 });
    }

    this.activeSelection = null;
    this.state.currentStage = stageNumber;
    if (stageNumber > this.state.maxStageReached) {
      this.state.maxStageReached = stageNumber;
    }
    this.render();
  }

  public nextStage(): void {
    if (this.state.currentStage < 7) {
      this.setStage(this.state.currentStage + 1);
    }
  }

  public prevStage(): void {
    if (this.state.currentStage > 1) {
      this.setStage(this.state.currentStage - 1);
    }
  }

  public selectObjective(objectiveId: string): void {
    if (!this.objectives.some((o) => o.id === objectiveId)) {
      console.warn(`[MissionWizard] Unknown objective ID rejected: "${objectiveId}"`);
      return;
    }
    this.state.design.objective_id = objectiveId;
    this.activeSelection = { type: 'objective', id: objectiveId };
    this.syncSceneWithDesign();
    this.render();
  }

  public selectObserveTimeFraction(fraction: number): void {
    const validFractions = [0.50, 0.53, 0.54];
    const match = validFractions.find((f) => Math.abs(f - fraction) < 0.001);
    if (match === undefined) {
      console.warn(`[MissionWizard] Invalid observe_time_fraction rejected: ${fraction}`);
      return;
    }
    this.state.design.objective_id = 'earth_observation';
    this.state.design.observe_time_fraction = match;
    this.activeSelection = { type: 'parameter', id: 'observe_time_fraction' };
    this.syncSceneWithDesign();
    this.render();
  }

  public selectOrbit(orbitId: string): void {
    if (!this.orbits.some((o) => o.id === orbitId)) {
      console.warn(`[MissionWizard] Unknown orbit ID rejected: "${orbitId}"`);
      return;
    }
    this.state.design.orbit_id = orbitId;
    this.activeSelection = { type: 'orbit', id: orbitId };
    this.syncSceneWithDesign();
    this.render();
  }

  public selectVehicle(vehicleId: string): void {
    if (!this.vehicles.some((v) => v.id === vehicleId)) {
      console.warn(`[MissionWizard] Unknown vehicle ID rejected: "${vehicleId}"`);
      return;
    }
    this.state.design.vehicle_id = vehicleId;
    this.activeSelection = { type: 'vehicle', id: vehicleId };
    this.syncSceneWithDesign();
    this.render();
  }

  public selectClass(classId: string): void {
    if (!this.classes.some((c) => c.id === classId)) {
      console.warn(`[MissionWizard] Unknown class ID rejected: "${classId}"`);
      return;
    }
    this.state.design.cubesat_class_id = classId;
    this.activeSelection = { type: 'class', id: classId };

    // Synchronize structure part with selected class
    if (classId === '1U') {
      this.state.design.part_ids = this.state.design.part_ids.filter((id) => id !== 'struct_3u');
      if (!this.state.design.part_ids.includes('struct_1u')) {
        this.state.design.part_ids.push('struct_1u');
      }
    } else if (classId === '3U') {
      this.state.design.part_ids = this.state.design.part_ids.filter((id) => id !== 'struct_1u');
      if (!this.state.design.part_ids.includes('struct_3u')) {
        this.state.design.part_ids.push('struct_3u');
      }
    }
    this.state.design.part_ids = Array.from(new Set(this.state.design.part_ids));

    this.syncSceneWithDesign();
    this.render();
  }

  public togglePart(partId: string): void {
    // 1. Unknown component rejection
    const validPart = this.parts.find((p) => p.id === partId);
    if (!validPart) {
      console.warn(`[MissionWizard] Unknown component ID rejected: "${partId}"`);
      return;
    }

    const current = this.state.design.part_ids;
    if (current.includes(partId)) {
      // Remove component
      this.state.design.part_ids = current.filter((id) => id !== partId);
    } else {
      // Add component with structural replacement
      let nextParts = [...current];
      if (validPart.category === 'structure') {
        const structurePartIds = this.parts.filter((p) => p.category === 'structure').map((p) => p.id);
        nextParts = nextParts.filter((id) => !structurePartIds.includes(id));
      }
      nextParts.push(partId);
      // Duplicate selection handling
      this.state.design.part_ids = Array.from(new Set(nextParts));
    }
    this.activeSelection = { type: 'part', id: partId };
    this.syncSceneWithDesign();
    this.render();
  }

  public triggerLaunch(): void {
    // 1. Hard Gate: Do not launch if validation checks fail!
    const validation = runChecks(this.state.design);
    if (!validation.passed) {
      return;
    }

    // 2. Prevent overlapping launch triggers
    if (this.isSimulating) {
      return;
    }

    // 3. Run authentic simulation and scoring
    const sim = runSimulation(this.state.design, 42, 1);
    const score = scoreMission(sim, 'solo');
    const report = buildReport(sim, score);

    this.state.simResult = sim;
    this.state.score = score;
    this.state.report = report;
    this.isSimulating = true;
    this.flightStepIndex = 0;
    this.flightLogs = [
      { text: 'Countdown T-00:10. Flight computers armed and telemetry synchronized.' }
    ];

    const currentOrbit = this.orbits.find((o) => o.id === this.state.design.orbit_id) ?? this.orbits[0];
    const flightSteps = buildFlightSteps(currentOrbit);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const intervalMs = prefersReducedMotion ? 600 : 1200;

    // Initialize 3D scene in launch ascent mode
    const firstStep = flightSteps[0];
    this.scene.setSimState({
      mode: firstStep.mode,
      progress: firstStep.simProgress,
      stageText: firstStep.title
    });

    if (this.flightTimer) clearInterval(this.flightTimer);

    this.flightTimer = window.setInterval(() => {
      this.flightStepIndex++;
      const currentFlightSteps = buildFlightSteps(currentOrbit);
      if (this.flightStepIndex < currentFlightSteps.length) {
        const step = currentFlightSteps[this.flightStepIndex];
        this.flightLogs.unshift({ text: `${step.met}: ${step.title}` });
        this.scene.setSimState({
          mode: step.mode,
          progress: step.simProgress,
          stageText: step.title
        });
        this.render();
      } else {
        this.finishLaunchSimulation();
      }
    }, intervalMs);

    this.render();
  }

  public finishLaunchSimulation(): void {
    if (this.flightTimer) {
      clearInterval(this.flightTimer);
      this.flightTimer = null;
    }
    this.isSimulating = false;
    this.scene.setSimState({ mode: 'orbit', progress: 1 });
    this.setStage(7);
  }

  public restart(): void {
    if (this.flightTimer) {
      clearInterval(this.flightTimer);
      this.flightTimer = null;
    }
    this.isSimulating = false;
    this.flightStepIndex = 0;
    this.flightLogs = [];
    this.activeSelection = null;
    this.state.design = this.getDefaultDesign();
    this.state.simResult = null;
    this.state.score = null;
    this.state.report = null;
    this.state.maxStageReached = 1;
    this.scene.setSimState({ mode: 'orbit', progress: 0 });
    this.syncSceneWithDesign();
    this.setStage(1);
  }

  private getExplainContent(meters: Meters, validation: MissionValidationResult): ExplainContent {
    const novaMsg = getNovaContextMessage(
      this.state.currentStage,
      this.state.design,
      meters,
      validation,
      this.activeSelection,
      {
        objectives: this.objectives,
        orbits: this.orbits,
        vehicles: this.vehicles,
        classes: this.classes,
        parts: this.parts
      },
      this.state.simResult,
      this.state.score,
      this.state.report
    );

    return {
      title: 'Commander Nova',
      category: novaMsg.eyebrow,
      summary: novaMsg.speech,
      tradeoff: novaMsg.tradeoff || 'Every space mission choice costs something somewhere else. No design is perfect—aerospace engineering is the art of balanced trade-offs.',
      nasaContext: novaMsg.nasaFact,
      engineImpact: novaMsg.engineImpact,
      highlightAction: novaMsg.highlightAction,
      status: novaMsg.status
    };
  }

  public render(): void {
    const design = this.state.design;
    const meters = computeMeters(design);
    const validation = runChecks(design);

    // Current objective, orbit, vehicle
    const currentObjective = this.objectives.find((o) => o.id === design.objective_id) ?? this.objectives[0];
    const currentOrbit = this.orbits.find((o) => o.id === design.orbit_id) ?? this.orbits[0];
    const currentVehicle = this.vehicles.find((v) => v.id === design.vehicle_id) ?? this.vehicles[0];

    // Top resource bar
    const resourceBarHtml = renderResourceBar(meters);

    // Glowing Mission Path
    const stageItems = STAGE_NAMES.map((name, index) => ({
      name,
      stageNumber: index + 1
    }));
    const missionPathHtml = missionPath(stageItems, this.state.currentStage, this.state.maxStageReached);

    // Render active stage
    let stageContentHtml = '';
    switch (this.state.currentStage) {
      case 1:
        stageContentHtml = renderObjectiveStage(
          this.objectives,
          design.objective_id ?? this.objectives[0].id,
          'select-objective',
          design.observe_time_fraction ?? 0.50
        );
        break;
      case 2:
        stageContentHtml = renderRequirementsStage(currentObjective, meters, validation);
        break;
      case 3:
        stageContentHtml = renderTradeSpaceStage(this.orbits, this.vehicles, design.orbit_id, design.vehicle_id);
        break;
      case 4:
        stageContentHtml = renderPointDesignStage(
          this.classes,
          design.cubesat_class_id,
          this.parts,
          design.part_ids,
          this.activePartCategory,
          meters
        );
        break;
      case 5:
        stageContentHtml = renderReviewStage(
          validation,
          meters,
          'descope-action',
          design.observe_time_fraction ?? 0.50
        );
        break;
      case 6: {
        const flightSteps = buildFlightSteps(currentOrbit);
        const currentStep = flightSteps[Math.min(this.flightStepIndex, flightSteps.length - 1)];
        const progressPercent = Math.round(((this.flightStepIndex + 1) / flightSteps.length) * 100);

        // Authoritative downlink rate derived from equipped comms part in catalogue
        const commsPart = this.parts.find((p) => p.category === 'comms' && design.part_ids.includes(p.id));
        const rawRateGbPerMin = commsPart?.downlink_rate_gb_per_min ?? 0;
        // Decimal Mbps = downlink_rate_gb_per_min * 8000 / 60
        const commsThroughputMbps = Number(((rawRateGbPerMin * 8000) / 60).toFixed(1));
        const dataRateMbps = commsThroughputMbps;

        const telemetryState: LaunchTelemetryState | undefined = this.isSimulating
          ? {
              isSimulating: true,
              stageTitle: currentStep.title,
              stageDetail: currentStep.detail,
              met: currentStep.met,
              alt: currentStep.alt,
              vel: currentStep.vel,
              progressPercent,
              powerLoadW: meters.power.value,
              solarGenW: meters.power.limit,
              dataRateMbps,
              logs: this.flightLogs
            }
          : undefined;

        stageContentHtml = renderLaunchStage(
          validation,
          currentOrbit,
          currentVehicle,
          'trigger-launch',
          telemetryState,
          dataRateMbps,
          design.observe_time_fraction ?? 0.50
        );
        break;
      }
      case 7:
        if (this.state.report && this.state.score && this.state.simResult) {
          stageContentHtml = renderReportStage(this.state.report, this.state.score, this.state.simResult);
        } else {
          // If navigated manually before launching, trigger sim
          const sim = runSimulation(design, 42, 1);
          const score = scoreMission(sim, 'solo');
          const report = buildReport(sim, score);
          this.state.simResult = sim;
          this.state.score = score;
          this.state.report = report;
          stageContentHtml = renderReportStage(report, score, sim);
        }
        break;
    }

    // Right explain panel (Commander Nova Co-Pilot Module)
    const explainContent = this.getExplainContent(meters, validation);
    const explainHtml = renderExplainPanel(explainContent);
    const novaShortTip = explainContent.summary.split('.')[0] + '.';

    // Navigation buttons
    const isFirst = this.state.currentStage === 1;
    const isLast = this.state.currentStage === 7;
    const navButtonsHtml = `
      <div class="wizard-nav-actions">
        ${
          !isFirst
            ? secondaryButton(`← Back to ${STAGE_NAMES[this.state.currentStage - 2]}`, 'prev-stage', 'back')
            : '<div></div>'
        }
        <div class="nav-right-actions" style="display:flex; gap:12px; align-items:center">
          ${secondaryButton('Exit to Menu', 'exit-wizard', 'home')}
          ${
            !isLast && this.state.currentStage !== 6
              ? primaryButton(`Proceed to ${STAGE_NAMES[this.state.currentStage]}`, 'next-stage', 'rocket')
              : ''
          }
        </div>
      </div>
    `;

    // Stitch Top Flight Deck Header
    const flightDeckHeader = `
      <header class="flight-deck-header fixed top-0 left-0 right-0 z-40 bg-surface-container-lowest/80 backdrop-blur-xl border-b border-white/5 shadow-md">
        <div class="h-16 w-full max-w-7xl mx-auto px-gutter flex items-center justify-between">
          <div class="flex items-center gap-space-md">
            <div class="flex items-baseline gap-space-xs cursor-pointer" data-action="exit-wizard">
              <span class="font-headline-sm text-headline-sm font-bold tracking-tight text-primary">ORBIT</span>
              <span class="font-label-sm text-label-sm text-secondary tracking-widest uppercase">MISSION ACADEMY</span>
            </div>
            <div class="w-px h-5 bg-surface-variant hidden sm:block"></div>
            <div class="hidden sm:flex items-center gap-space-xs">
              <span class="w-1.5 h-1.5 rounded-full bg-tertiary shadow-[0_0_8px_#51e77b]"></span>
              <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">${escapeHtml(currentObjective.name.toUpperCase())}</span>
              <span class="text-surface-variant font-label-sm text-label-sm">/</span>
              <span class="font-label-sm text-label-sm text-secondary uppercase tracking-wider">${STAGE_NAMES[this.state.currentStage - 1].toUpperCase()}</span>
            </div>
          </div>

          <div class="flex items-center gap-space-sm">
            <button class="flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-all cursor-pointer shadow-sm" type="button" data-action="open-how-to-play">
              <span class="material-symbols-outlined text-[16px] text-secondary">help</span>
              <span class="font-label-sm text-label-sm uppercase tracking-wider">How to play</span>
            </button>
            <button class="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high text-secondary hover:text-on-surface flex items-center justify-center transition-all cursor-pointer shadow-sm" type="button" data-action="toggle-audio" title="Audio Sound">
              <span class="material-symbols-outlined text-[18px]">volume_up</span>
            </button>
            <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md cursor-pointer" data-action="exit-wizard" title="Cadet Profile">
              <span class="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </div>
          </div>
        </div>
      </header>
    `;

    // Stitch Persistent Bottom Command Deck Footer
    const commandDeckFooter = `
      <footer class="command-deck-footer fixed bottom-0 left-0 right-0 z-40 h-20 bg-surface-container-lowest/90 backdrop-blur-xl border-t border-white/5 shadow-2xl flex items-center">
        <div class="w-full max-w-7xl mx-auto px-gutter flex items-center justify-between">
          ${
            !isFirst
              ? secondaryButton(`← Back to ${STAGE_NAMES[this.state.currentStage - 2]}`, 'prev-stage', 'back')
              : secondaryButton('← Exit to Menu', 'exit-wizard', 'home')
          }
          <div class="hidden md:flex items-center gap-space-sm px-space-md py-space-xs rounded-full bg-surface-container/60">
            <span class="material-symbols-outlined text-primary text-[18px]">tips_and_updates</span>
            <span class="font-body-sm text-body-sm text-on-surface-variant">Commander Nova: <span class="text-on-surface font-medium">${escapeHtml(novaShortTip)}</span></span>
          </div>
          ${
            !isLast && this.state.currentStage !== 6
              ? primaryButton(`Proceed to ${STAGE_NAMES[this.state.currentStage]}`, 'next-stage', 'rocket')
              : this.state.currentStage === 6
              ? ''
              : secondaryButton('Restart Mission', 'restart-mission', 'rocket')
          }
        </div>
      </footer>
    `;

    this.container.innerHTML = `
      <div class="orbitone-game-shell pt-16 pb-24">
        ${flightDeckHeader}
        ${resourceBarHtml}
        ${missionPathHtml}
        <div class="wizard-workspace-grid">
          <main class="wizard-stage-container" role="main">
            ${stageContentHtml}
            ${navButtonsHtml}
          </main>
          ${explainHtml}
        </div>
        ${commandDeckFooter}
        ${this.isHowToPlayOpen ? renderHowToPlayModal() : ''}
      </div>
    `;

    // Mount 3D scene into active container host (e.g. Stage 3, Stage 4, Stage 6)
    const sceneHost = this.container.querySelector<HTMLElement>('[data-scene]');
    if (sceneHost) {
      this.scene.mount(sceneHost);
    }
    this.syncSceneWithDesign();
  }

  private attachEventListeners(): void {
    this.container.addEventListener(
      'click',
      (e) => {
        const target = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
        if (!target) return;

        const action = target.getAttribute('data-action');
        if (!action) return;

        switch (action) {
          case 'go-to-stage': {
            const stageNum = parseInt(target.getAttribute('data-stage') || '1', 10);
            this.setStage(stageNum);
            break;
          }
          case 'next-stage':
            this.nextStage();
            break;
          case 'prev-stage':
            this.prevStage();
            break;
          case 'select-objective': {
            const id = target.getAttribute('data-id');
            if (id) this.selectObjective(id);
            break;
          }
          case 'select-observe-fraction': {
            const fractionStr = target.getAttribute('data-fraction');
            if (fractionStr) {
              const fraction = parseFloat(fractionStr);
              if (!isNaN(fraction)) {
                this.selectObserveTimeFraction(fraction);
              }
            }
            break;
          }
          case 'select-orbit': {
            const id = target.getAttribute('data-id');
            if (id) this.selectOrbit(id);
            break;
          }
          case 'select-vehicle': {
            const id = target.getAttribute('data-id');
            if (id) this.selectVehicle(id);
            break;
          }
          case 'select-class': {
            const id = target.getAttribute('data-id');
            if (id) this.selectClass(id);
            break;
          }
          case 'toggle-part': {
            const id = target.getAttribute('data-part-id');
            if (id) this.togglePart(id);
            break;
          }
          case 'focus-part': {
            const id = target.getAttribute('data-part-id');
            if (id) {
              this.activeSelection = { type: 'part', id };
              this.render();
            }
            break;
          }
          case 'filter-category': {
            const cat = target.getAttribute('data-category');
            if (cat) {
              this.activePartCategory = cat;
              this.render();
            }
            break;
          }
          case 'scene-rotate-left':
            this.scene.rotateBy(-0.35);
            break;
          case 'scene-rotate-right':
            this.scene.rotateBy(0.35);
            break;
          case 'scene-reset-camera':
            this.scene.resetCamera();
            break;
          case 'trigger-launch':
            this.triggerLaunch();
            break;
          case 'skip-sim':
          case 'view-report':
            this.finishLaunchSimulation();
            break;
          case 'restart-wizard':
          case 'restart-mission':
            this.restart();
            break;
          case 'open-how-to-play':
            this.isHowToPlayOpen = true;
            this.render();
            break;
          case 'close-how-to-play':
            this.isHowToPlayOpen = false;
            this.render();
            break;
          case 'exit-wizard':
            window.location.hash = '#/home';
            if (this.exitCallback) this.exitCallback();
            break;
        }
      },
      { signal: this.abortController.signal }
    );
  }
}
