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
import { getNovaContextMessage, type ActiveSelectionContext, type LastActionNotice } from './mascot';
import { missionPath, primaryButton, secondaryButton } from './components';
import { renderHowToPlayModal } from './howToPlay';
import { renderInventoryModal } from './inventoryModal';
import { AsteroidRunGame } from '../minigame/asteroidRun';
import { creditsManager } from '../credits/creditsManager';
import { audioManager } from '../audio/audioManager';

export class TypewriterController {
  private timer: number | null = null;
  private currentElement: HTMLElement | null = null;
  private fullText: string = '';

  public start(element: HTMLElement, text: string): void {
    this.stop();
    this.currentElement = element;
    this.fullText = text;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      element.textContent = text;
      return;
    }

    element.textContent = '';
    let index = 0;
    this.timer = window.setInterval(() => {
      index += 2;
      if (index <= text.length) {
        element.textContent = text.slice(0, index);
      } else {
        element.textContent = text;
        this.stop();
      }
    }, 20);
  }

  public complete(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.currentElement) {
      this.currentElement.textContent = this.fullText;
    }
  }

  public stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

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
  private designHistory: MissionDesign[] = [];
  private typewriter: TypewriterController = new TypewriterController();
  private isNovaMinimized: boolean = false;
  private lastActionNotice?: LastActionNotice;
  private hasPlayedMissionComplete: boolean = false;
  private isInventoryOpen: boolean = false;
  private selectedInventoryId?: string = undefined;
  private activeInventoryTab: 'instruments' | 'missions' | 'tech' = 'instruments';
  private isAsteroidRunActive: boolean = false;
  private asteroidGame: AsteroidRunGame | null = null;

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

    window.addEventListener(
      'orbitone:audio-state-changed',
      () => {
        this.render();
      },
      { signal: this.abortController.signal }
    );
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
    this.typewriter.stop();
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

    this.typewriter.stop();
    this.lastActionNotice = undefined;

    // Leaving launch stage while simulating? Reset simulation state gracefully
    if (this.state.currentStage === 6 && stageNumber !== 6 && this.isSimulating) {
      if (this.flightTimer) {
        clearInterval(this.flightTimer);
        this.flightTimer = null;
      }
      this.isSimulating = false;
      this.scene.setSimState({ mode: 'orbit', progress: 1 });
    }

    const previousStage = this.state.currentStage;
    if (previousStage === stageNumber) {
      this.render();
      return;
    }

    this.activeSelection = null;
    this.state.currentStage = stageNumber;
    if (stageNumber > this.state.maxStageReached) {
      this.state.maxStageReached = stageNumber;
    }

    if (stageNumber === 5) {
      const validation = runChecks(this.state.design);
      audioManager.play(validation.passed ? 'success' : 'warning');
    } else if (stageNumber === 7) {
      if (!this.hasPlayedMissionComplete) {
        this.hasPlayedMissionComplete = true;
        audioManager.play('mission_complete');
        creditsManager.addCredits(200, 'Mission Flight Complete');
        creditsManager.unlockAchievement('flight_complete');
      } else {
        audioManager.play('stage_transition');
      }
    } else {
      audioManager.play('stage_transition');
    }

    this.render();
  }

  public nextStage(): void {
    if (this.state.currentStage === 4 && !this.isAsteroidRunActive) {
      // Route between Stage 4 and Stage 5 through Asteroid Run
      creditsManager.unlockAchievement('first_assembly');
      this.startAsteroidRun();
      return;
    }
    if (this.state.currentStage < 7) {
      this.setStage(this.state.currentStage + 1);
    }
  }

  public startAsteroidRun(): void {
    this.isAsteroidRunActive = true;
    audioManager.play('selection');
    this.render();
  }

  public finishAsteroidRun(): void {
    if (this.asteroidGame) {
      this.asteroidGame.destroy();
      this.asteroidGame = null;
    }
    this.isAsteroidRunActive = false;
    this.setStage(5);
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
    audioManager.play('selection');
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
    audioManager.play('selection');
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
    audioManager.play('selection');
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
    audioManager.play('selection');
    this.state.design.vehicle_id = vehicleId;
    this.activeSelection = { type: 'vehicle', id: vehicleId };
    this.syncSceneWithDesign();
    this.render();
  }

  private pushDesignHistory(): void {
    const snapshot: MissionDesign = JSON.parse(JSON.stringify(this.state.design));
    this.designHistory.push(snapshot);
    if (this.designHistory.length > 25) {
      this.designHistory.shift();
    }
  }

  public undoDesign(): void {
    if (this.designHistory.length === 0) return;
    audioManager.play('ui_click');
    const previous = this.designHistory.pop()!;
    this.state.design = previous;
    this.activeSelection = null;
    this.lastActionNotice = { type: 'undo' };
    this.syncSceneWithDesign();
    this.render();
  }

  public resetStage4Design(): void {
    this.pushDesignHistory();
    audioManager.play('ui_click');
    const defaultDesign = this.getDefaultDesign();
    this.state.design.cubesat_class_id = defaultDesign.cubesat_class_id;
    this.state.design.part_ids = [...defaultDesign.part_ids];
    this.activeSelection = null;
    this.lastActionNotice = { type: 'reset' };
    this.syncSceneWithDesign();
    this.render();
  }

  public selectClass(classId: string): void {
    if (!this.classes.some((c) => c.id === classId)) {
      console.warn(`[MissionWizard] Unknown class ID rejected: "${classId}"`);
      return;
    }
    audioManager.play('selection');
    this.pushDesignHistory();
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

    this.pushDesignHistory();
    const current = this.state.design.part_ids;
    if (current.includes(partId)) {
      // Remove component
      this.lastActionNotice = { type: 'remove', partId };
      this.state.design.part_ids = current.filter((id) => id !== partId);
      audioManager.play('component_remove');
    } else {
      // Add component with exclusive category slot replacement
      let nextParts = [...current];
      const EXCLUSIVE_CATEGORIES = ['structure', 'power', 'battery', 'comms', 'adcs', 'computer', 'instrument'];
      let replacedId: string | undefined;
      if (EXCLUSIVE_CATEGORIES.includes(validPart.category)) {
        const sameCategoryPartIds = this.parts
          .filter((p) => p.category === validPart.category)
          .map((p) => p.id);
        replacedId = nextParts.find((id) => sameCategoryPartIds.includes(id));
        nextParts = nextParts.filter((id) => !sameCategoryPartIds.includes(id));
      }
      nextParts.push(partId);
      // Duplicate selection handling
      this.state.design.part_ids = Array.from(new Set(nextParts));
      if (replacedId) {
        this.lastActionNotice = { type: 'replace', partId, oldPartId: replacedId };
      } else {
        this.lastActionNotice = { type: 'add', partId };
      }
      audioManager.play('component_equip');
    }
    this.activeSelection = { type: 'part', id: partId };
    this.syncSceneWithDesign();
    this.render();
  }

  public triggerLaunch(): void {
    // 1. Hard Gate: Do not launch if validation checks fail!
    const validation = runChecks(this.state.design);
    if (!validation.passed) {
      audioManager.play('warning');
      return;
    }

    // 2. Prevent overlapping launch triggers
    if (this.isSimulating) {
      return;
    }

    audioManager.play('launch');

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
    this.hasPlayedMissionComplete = false;
    this.flightStepIndex = 0;
    this.flightLogs = [];
    this.activeSelection = null;
    this.designHistory = [];
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
      this.state.report,
      this.lastActionNotice
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

  private updateMusicMoodForStage(stage: number): void {
    if (stage === 4) {
      audioManager.setMusicMood('assembly');
    } else if (stage === 6) {
      audioManager.setMusicMood('launch');
    } else if (stage === 7) {
      audioManager.setMusicMood('debrief');
    } else {
      audioManager.setMusicMood('design');
    }
  }

  public render(): void {
    this.updateMusicMoodForStage(this.state.currentStage);
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
          meters,
          'select-class',
          'toggle-part',
          'filter-category',
          'focus-part',
          this.designHistory.length > 0,
          'undo-design',
          'reset-stage4'
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
    const explainHtml = renderExplainPanel(explainContent, this.isNovaMinimized);
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
            <button style="min-height: 44px; min-width: 44px;" class="flex items-center justify-center gap-space-xs px-space-md py-space-xs rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-all cursor-pointer shadow-sm" type="button" data-action="open-how-to-play" title="How to play" aria-label="How to play">
              <span class="material-symbols-outlined text-[16px] text-secondary">help</span>
              <span class="font-label-sm text-label-sm uppercase tracking-wider hidden sm:inline">How to play</span>
            </button>
            <button style="min-height: 44px; min-width: 44px;" class="flex items-center justify-center gap-space-xs px-space-md py-space-xs rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-all cursor-pointer shadow-sm" type="button" data-action="open-inventory" title="Scientific Instrument Inventory" aria-label="Scientific Instrument Inventory">
              <span class="material-symbols-outlined text-[16px] text-tertiary">biotech</span>
              <span class="font-label-sm text-label-sm uppercase tracking-wider hidden sm:inline">Science</span>
            </button>
            <div class="credits-pill hidden sm:inline-flex" title="Orbit Credits" style="min-height:36px;">
              <span class="material-symbols-outlined text-[16px]">stars</span>
              <span>${creditsManager.getCredits()}</span>
            </div>
            <button style="min-width: 44px; min-height: 44px;" class="audio-toggle-btn w-11 h-11 rounded-full ${audioManager.isSfxEnabled() ? 'is-audio-active' : 'is-audio-muted'} flex items-center justify-center transition-all cursor-pointer shadow-sm" type="button" data-action="toggle-audio" title="${audioManager.isSfxEnabled() ? 'Mute Sound Effects' : 'Unmute Sound Effects'}" aria-label="${audioManager.isSfxEnabled() ? 'Mute Sound Effects' : 'Unmute Sound Effects'}">
              <span class="material-symbols-outlined text-[18px]">${audioManager.isSfxEnabled() ? 'volume_up' : 'volume_off'}</span>
            </button>
            <button style="min-width: 44px; min-height: 44px;" class="audio-toggle-btn w-11 h-11 rounded-full ${audioManager.isMusicEnabled() ? 'is-audio-active' : 'is-audio-muted'} flex items-center justify-center transition-all cursor-pointer shadow-sm" type="button" data-action="toggle-music" title="${audioManager.isMusicEnabled() ? 'Mute Ambient Music' : 'Unmute Ambient Music'}" aria-label="${audioManager.isMusicEnabled() ? 'Mute Ambient Music' : 'Unmute Ambient Music'}">
              <span class="material-symbols-outlined text-[18px]">${audioManager.isMusicEnabled() ? 'music_note' : 'music_off'}</span>
            </button>
            <div style="min-width: 44px; min-height: 44px;" class="w-11 h-11 rounded-full bg-primary flex items-center justify-center shadow-md cursor-pointer" data-action="exit-wizard" title="Cadet Profile">
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

    if (this.isAsteroidRunActive) {
      this.container.innerHTML = `
        <div class="orbitone-game-shell pt-16 pb-24">
          ${flightDeckHeader}
          ${resourceBarHtml}
          <div class="w-full max-w-7xl mx-auto px-gutter mt-4">
            <div id="asteroid-minigame-host"></div>
          </div>
          ${this.isHowToPlayOpen ? renderHowToPlayModal() : ''}
          ${this.isInventoryOpen ? renderInventoryModal(this.selectedInventoryId, this.activeInventoryTab) : ''}
        </div>
      `;

      const host = this.container.querySelector<HTMLElement>('#asteroid-minigame-host');
      if (host) {
        if (this.asteroidGame) {
          this.asteroidGame.destroy();
        }
        this.asteroidGame = new AsteroidRunGame(host);
        this.asteroidGame.onContinue(() => {
          this.finishAsteroidRun();
        });
        this.asteroidGame.start();
      }
      return;
    }

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
        ${this.isInventoryOpen ? renderInventoryModal(this.selectedInventoryId, this.activeInventoryTab) : ''}
      </div>
    `;

    // Mount 3D scene into active container host (e.g. Stage 3, Stage 4, Stage 6)
    const sceneHost = this.container.querySelector<HTMLElement>('[data-scene]');
    if (sceneHost) {
      this.scene.mount(sceneHost);
    }
    this.syncSceneWithDesign();

    // Typewriter text reveal for Commander Nova speech
    const typewriterTarget = this.container.querySelector<HTMLElement>('.typewriter-target');
    if (typewriterTarget) {
      this.typewriter.start(typewriterTarget, explainContent.summary);
    }
  }

  private attachEventListeners(): void {
    this.container.addEventListener(
      'click',
      (e) => {
        const tabEl = (e.target as HTMLElement).closest<HTMLElement>('[data-inventory-tab]');
        if (tabEl && tabEl.dataset.inventoryTab) {
          audioManager.play('selection');
          this.activeInventoryTab = tabEl.dataset.inventoryTab as any;
          this.selectedInventoryId = undefined;
          this.render();
          return;
        }

        const invEl = (e.target as HTMLElement).closest<HTMLElement>('[data-inventory-id]');
        if (invEl && invEl.dataset.inventoryId) {
          audioManager.play('selection');
          this.selectedInventoryId = invEl.dataset.inventoryId;
          this.render();
          return;
        }

        const target = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
        if (!target) return;

        const action = target.getAttribute('data-action');
        if (!action) return;

        if (action !== 'skip-typewriter' && action !== 'toggle-nova-panel') {
          this.typewriter.stop();
        }

        switch (action) {
          case 'toggle-audio': {
            audioManager.toggleMute();
            this.render();
            break;
          }
          case 'toggle-music': {
            audioManager.toggleMusicMute();
            this.render();
            break;
          }
          case 'toggle-nova-panel':
            audioManager.play('ui_click');
            this.isNovaMinimized = !this.isNovaMinimized;
            this.render();
            break;
          case 'skip-typewriter':
            this.typewriter.complete();
            break;
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
            audioManager.play('ui_click');
            const id = target.getAttribute('data-part-id');
            if (id) {
              this.activeSelection = { type: 'part', id };
              this.render();
            }
            break;
          }
          case 'filter-category': {
            audioManager.play('ui_click');
            const cat = target.getAttribute('data-category');
            if (cat) {
              this.activePartCategory = cat;
              this.render();
            }
            break;
          }
          case 'undo-design':
            this.undoDesign();
            break;
          case 'reset-stage4':
            this.resetStage4Design();
            break;
          case 'scene-rotate-left':
            audioManager.play('ui_click');
            this.scene.rotateBy(-0.35);
            break;
          case 'scene-rotate-right':
            audioManager.play('ui_click');
            this.scene.rotateBy(0.35);
            break;
          case 'scene-reset-camera':
            audioManager.play('ui_click');
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
            audioManager.play('ui_click');
            this.restart();
            break;
          case 'open-how-to-play':
            audioManager.play('ui_click');
            this.isHowToPlayOpen = true;
            this.render();
            break;
          case 'close-how-to-play':
            audioManager.play('ui_click');
            this.isHowToPlayOpen = false;
            this.render();
            break;
          case 'open-inventory':
            audioManager.play('selection');
            this.isInventoryOpen = true;
            creditsManager.unlockAchievement('science_curious');
            this.render();
            break;
          case 'close-inventory':
            audioManager.play('ui_click');
            this.isInventoryOpen = false;
            this.render();
            break;
          case 'exit-wizard':
            audioManager.play('ui_click');
            window.location.hash = '#/home';
            if (this.exitCallback) this.exitCallback();
            break;
        }
      },
      { signal: this.abortController.signal }
    );

    this.container.addEventListener(
      'keydown',
      (e) => {
        const target = (e.target as HTMLElement).closest('[data-action="skip-typewriter"]');
        if (target && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          this.typewriter.complete();
        }
      },
      { signal: this.abortController.signal }
    );
  }
}
