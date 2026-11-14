/**
 * ORBITONE Frontend Engine Interface
 * Defines the contract between the UI/Wizard and the rules engine.
 * Shapes directly match shared/src/types.ts.
 */
import type {
  CubeSatClass,
  MissionDesign,
  MissionValidationResult,
  Meters,
  Objective,
  Orbit,
  Part,
  RealMission,
  Report,
  ScoreBreakdown,
  SimResult,
  Vehicle
} from '@shared';

export interface MissionEngineAPI {
  computeMeters(design: MissionDesign): Meters;
  runChecks(design: MissionDesign): MissionValidationResult;
  runSimulation(design: MissionDesign, seed?: number): SimResult;
  scoreMission(simResult: SimResult, mode?: 'solo' | 'team'): ScoreBreakdown;
  buildReport(simResult: SimResult, score?: ScoreBreakdown): Report;
  getCubesatClasses(): CubeSatClass[];
  getObjectives(): Objective[];
  getOrbits(): Orbit[];
  getVehicles(): Vehicle[];
  getParts(): Part[];
  getRealMissions(): RealMission[];
}

