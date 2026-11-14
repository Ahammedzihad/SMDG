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
import { missionPath, primaryButton, secondaryButton } from './components';

export const STAGE_NAMES = [
  'Objective (CML 1)',
  'Initial Feasibility (CML 2)',
  'Trade Space (CML 3)',
  'Point Design (CML 4)',
  'Pre-Launch Review',
  'Launch',
  'Report'
] as const;

export interface FlightStep {
  met: string;
  title: string;
  detail: string;
  alt: string;
  vel: string;
  mode: SimVisualState['mode'];
  simProgress: number;
}

const FLIGHT_STEPS: FlightStep[] = [
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
    alt: '210 km',
    vel: '5.8 km/s',
    mode: 'launch',
    simProgress: 0.75
  },
  {
    met: 'T+01:15',
    title: 'Dispenser Spring Ejection',
    detail: 'Pneumatic dispenser release confirmed into orbital trajectory.',
    alt: '480 km',
    vel: '7.5 km/s',
    mode: 'launch',
    simProgress: 1.0
  },
  {
    met: 'T+02:00',
    title: 'Orbit Insertion & Array Deployment',
    detail: 'Target orbital altitude established. Solar panels deploy; battery charging online.',
    alt: '550 km',
    vel: '7.6 km/s',
    mode: 'deploy',
    simProgress: 0.5
  },
  {
    met: 'T+03:30',
    title: 'Payload Sensor Checkout',
    detail: 'Scientific instrument initialized. First observation telemetry frames buffered.',
    alt: '550 km',
    vel: '7.6 km/s',
    mode: 'observe',
    simProgress: 1.0
  },
  {
    met: 'T+05:00',
    title: 'Ground Station Downlink Contact',
    detail: 'Acquisition of signal (AOS). Radio downlink transmitting science packets.',
    alt: '550 km',
    vel: '7.6 km/s',
    mode: 'downlink',
    simProgress: 1.0
  }
];

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

  constructor(container: HTMLElement, scene?: ReturnType<typeof createMissionScene>) {
    this.container = container;
    this.scene = scene || createMissionScene();

    // Load authentic catalogs from shared engine
    this.objectives = getObjectives();
    this.orbits = getOrbits();
    this.vehicles = getVehicles();
    this.classes = getCubesatClasses();
    this.parts = getParts();

    // Default Level 1 initial design
    const defaultObjective = this.objectives.find((o) => o.id === 'earth_observation')?.id ?? this.objectives[0]?.id ?? 'earth_observation';
    const defaultOrbit = this.orbits.find((o) => o.id === 'sso')?.id ?? this.orbits[0]?.id ?? 'sso';
    const defaultVehicle = this.vehicles.find((v) => v.id === 'dedicated_light')?.id ?? this.vehicles[0]?.id ?? 'dedicated_light';
    const defaultClass = this.classes.find((c) => c.id === '3U')?.id ?? this.classes[0]?.id ?? '3U'; // 3U standard

    this.state = {
      currentStage: 1,
      maxStageReached: 1,
      design: {
        objective_id: defaultObjective,
        orbit_id: defaultOrbit,
        vehicle_id: defaultVehicle,
        cubesat_class_id: defaultClass,
        part_ids: [
          'struct_3u',
          'solar_deployable_3u',
          'batt_space_30wh',
          'comms_sband_patch',
          'inst_multispectral_imager',
          'adcs_3axis_wheels',
          'obc_rad_hard'
        ],
        lifetime_months: 12,
        fuel_mass_kg: 0.1,
        budget_m: 65.0,
        duty_cycle: 0.8,
        observe_time_fraction: 0.5,
        link_efficiency: 0.95
      },
      simResult: null,
      score: null,
      report: null
    };

    this.attachEventListeners();
    this.syncSceneWithDesign();
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
    this.state.design.objective_id = objectiveId;
    this.syncSceneWithDesign();
    this.render();
  }

  public selectOrbit(orbitId: string): void {
    this.state.design.orbit_id = orbitId;
    this.syncSceneWithDesign();
    this.render();
  }

  public selectVehicle(vehicleId: string): void {
    this.state.design.vehicle_id = vehicleId;
    this.syncSceneWithDesign();
    this.render();
  }

  public selectClass(classId: string): void {
    this.state.design.cubesat_class_id = classId;

    // Re-check structural compatibility
    if (classId === '1U') {
      // Remove parts exceeding 1U
      this.state.design.part_ids = this.state.design.part_ids.filter((id) => id !== 'solar_deployable_3u');
      if (!this.state.design.part_ids.includes('solar_body_1u')) {
        this.state.design.part_ids.push('solar_body_1u');
      }
      this.state.design.part_ids = this.state.design.part_ids.filter((id) => id !== 'struct_3u');
      if (!this.state.design.part_ids.includes('struct_1u')) {
        this.state.design.part_ids.push('struct_1u');
      }
    } else {
      this.state.design.part_ids = this.state.design.part_ids.filter((id) => id !== 'struct_1u');
      if (!this.state.design.part_ids.includes('struct_3u')) {
        this.state.design.part_ids.push('struct_3u');
      }
    }

    this.syncSceneWithDesign();
    this.render();
  }

  public togglePart(partId: string): void {
    const current = this.state.design.part_ids;
    if (current.includes(partId)) {
      this.state.design.part_ids = current.filter((id) => id !== partId);
    } else {
      this.state.design.part_ids = [...current, partId];
    }
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

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const intervalMs = prefersReducedMotion ? 600 : 1200;

    // Initialize 3D scene in launch ascent mode
    const firstStep = FLIGHT_STEPS[0];
    this.scene.setSimState({
      mode: firstStep.mode,
      progress: firstStep.simProgress,
      stageText: firstStep.title
    });

    if (this.flightTimer) clearInterval(this.flightTimer);

    this.flightTimer = window.setInterval(() => {
      this.flightStepIndex++;
      if (this.flightStepIndex < FLIGHT_STEPS.length) {
        const step = FLIGHT_STEPS[this.flightStepIndex];
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
    this.state.simResult = null;
    this.state.score = null;
    this.state.report = null;
    this.isSimulating = false;
    this.flightStepIndex = 0;
    this.scene.setSimState({ mode: 'orbit', progress: 0 });
    this.setStage(1);
  }

  private getExplainContent(): ExplainContent {
    const stage = this.state.currentStage;
    switch (stage) {
      case 1:
        return {
          title: 'Science Objective Selection',
          category: 'CML 1 · CONCEPT MATURITY',
          summary: 'In NASA mission design, scientific questions always come first. The objective dictates sensor wavelength, orbital geometry, and data downlink volume.',
          tradeoff: 'High-resolution imaging returns immense scientific value, but demands heavy optical lenses, high data rates, and sunny orbits.',
          nasaContext: 'Earth science missions like PUNCH and HARP originated from concise scientific objectives that drove all subsequent spacecraft hardware choices.'
        };
      case 2:
        return {
          title: 'Requirement Verification',
          category: 'CML 2 · INITIAL FEASIBILITY',
          summary: 'NASA systems engineers translate high-level science goals into Level-1 requirements with explicit, measurable verification methods.',
          tradeoff: 'Strict requirements guarantee scientific success, but increase test complexity, hardware mass, and schedule pressure.',
          nasaContext: 'NASA SmallSat Institute requires every requirement to identify its verification method (test, analysis, inspection, or demonstration).'
        };
      case 3:
        return {
          title: 'Orbit & Launch Trade Space',
          category: 'CML 3 · TRADE SPACE',
          summary: 'Exploring trade-offs between orbital lighting, altitude drag, launch cost, and manifesting flexibility.',
          tradeoff: 'Sun-Synchronous orbits provide consistent lighting but cost more launch energy than equatorial Low Earth Orbit.',
          nasaContext: 'CubeSat 101 notes that rideshare missions must accept the primary payload’s orbit and date, while dedicated micro-launchers offer precision insertion at higher cost.'
        };
      case 4:
        return {
          title: 'Point Design & Master Equipment List',
          category: 'CML 4 · POINT DESIGN',
          summary: 'Detailed subsystem assembly: Structure, Power, Batteries, Comms, Pointing, Computer, and Instruments.',
          tradeoff: 'Every added instrument enhances science yield, but increases dry mass, electrical load, and radio transmission backlogs.',
          nasaContext: 'NASA JPL CML 4 point design requires an assembly-level Master Equipment List (MEL) and tracking of technical mass and power margins.'
        };
      case 5:
        return {
          title: 'Flight Readiness Review Gate',
          category: 'PRE-LAUNCH REVIEW',
          summary: 'Verification of physical and budgetary constraints. Hard checks block launch; advisory warnings signal low margin risk.',
          tradeoff: 'Waiving advisory margins permits launch of complex payloads, but elevates risk of orbital brownouts or unexpected financial overruns.',
          nasaContext: 'NASA CubeSat Launch Initiative requires strict adherence to dispenser mechanical envelopes and mass limits (e.g. 4.0 kg for 3U).'
        };
      case 6:
        return {
          title: 'Flight Ignition & Orbit Insertion',
          category: 'LAUNCH SEGMENT',
          summary: 'Terminal countdown, rocket ascent, dispenser ejection, and automatic antenna deployment.',
          tradeoff: 'Spring dispensers deploy secondary satellites cleanly, but require antennas to stay stowed during ascent to avoid fairing strikes.',
          nasaContext: 'CubeSat 101 p. 70 commissioning: antennas deploy at 30 minutes, radio beacon at 45 minutes, first payload checkout at 4 days.'
        };
      case 7:
      default:
        return {
          title: 'Post-Mission Flight Audit',
          category: 'MISSION DEBRIEF',
          summary: 'Scientific evaluation comparing actual telemetry against baseline and threshold goals.',
          tradeoff: 'Balancing power and downlink ensures continuous science return without memory overflow or power depletion.',
          nasaContext: 'Similar real missions from CubeSat 101 demonstrate how university and NASA teams achieve real science on small budgets.'
        };
    }
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
        stageContentHtml = renderObjectiveStage(this.objectives, design.objective_id ?? this.objectives[0].id);
        break;
      case 2:
        stageContentHtml = renderRequirementsStage(currentObjective, meters, validation);
        break;
      case 3:
        stageContentHtml = renderTradeSpaceStage(this.orbits, this.vehicles, design.orbit_id, design.vehicle_id);
        break;
      case 4:
        stageContentHtml = renderPointDesignStage(this.classes, design.cubesat_class_id, this.parts, design.part_ids);
        break;
      case 5:
        stageContentHtml = renderReviewStage(validation, meters);
        break;
      case 6: {
        const currentStep = FLIGHT_STEPS[Math.min(this.flightStepIndex, FLIGHT_STEPS.length - 1)];
        const progressPercent = Math.round(((this.flightStepIndex + 1) / FLIGHT_STEPS.length) * 100);
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
              dataRateMbps: 2.0,
              logs: this.flightLogs
            }
          : undefined;

        stageContentHtml = renderLaunchStage(
          validation,
          currentOrbit,
          currentVehicle,
          'trigger-launch',
          telemetryState
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

    // Right explain panel
    const explainHtml = renderExplainPanel(this.getExplainContent());

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

    this.container.innerHTML = `
      <div class="orbitone-game-shell">
        ${resourceBarHtml}
        ${missionPathHtml}
        <div class="wizard-workspace-grid">
          <main class="wizard-stage-container" role="main">
            ${stageContentHtml}
            ${navButtonsHtml}
          </main>
          ${explainHtml}
        </div>
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
          case 'trigger-launch':
            this.triggerLaunch();
            break;
          case 'skip-sim':
          case 'view-report':
            this.finishLaunchSimulation();
            break;
          case 'restart-mission':
            this.restart();
            break;
          case 'exit-wizard':
            window.location.hash = '';
            if (this.exitCallback) this.exitCallback();
            break;
        }
      },
      { signal: this.abortController.signal }
    );
  }
}
