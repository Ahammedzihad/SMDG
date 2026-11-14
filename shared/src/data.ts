/**
 * Game data loaders and exports for ORBITONE.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  CubeSatClass,
  MissionEvent,
  Objective,
  Orbit,
  Part,
  Vehicle
} from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = resolve(__dirname, '../data');

function readJsonFile<T>(filename: string): T {
  const filePath = resolve(DATA_DIR, filename);
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

export function getCubesatClasses(): CubeSatClass[] {
  return readJsonFile<CubeSatClass[]>('cubesat_classes.json');
}

export function getObjectives(): Objective[] {
  return readJsonFile<Objective[]>('objectives.json');
}

export function getOrbits(): Orbit[] {
  return readJsonFile<Orbit[]>('orbits.json');
}

export function getVehicles(): Vehicle[] {
  return readJsonFile<Vehicle[]>('vehicles.json');
}

export function getParts(): Part[] {
  return readJsonFile<Part[]>('parts.json');
}

export function getEvents(): MissionEvent[] {
  return readJsonFile<MissionEvent[]>('events.json');
}

export const cubesatClasses: CubeSatClass[] = getCubesatClasses();
export const objectives: Objective[] = getObjectives();
export const orbits: Orbit[] = getOrbits();
export const vehicles: Vehicle[] = getVehicles();
export const parts: Part[] = getParts();
export const events: MissionEvent[] = getEvents();
