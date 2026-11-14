import { defineConfig, type Plugin } from 'vite';
import { fileURLToPath, URL } from 'node:url';

function sharedDataBrowserPlugin(): Plugin {
  return {
    name: 'orbitone-shared-data-browser',
    enforce: 'pre',
    transform(_code, id) {
      const normalized = id.replace(/\\/g, '/');
      if (normalized.endsWith('shared/src/data.ts') || normalized.endsWith('shared/src/data.js')) {
        return {
          code: `
import cubesatClassesData from '../data/cubesat_classes.json';
import objectivesData from '../data/objectives.json';
import orbitsData from '../data/orbits.json';
import vehiclesData from '../data/vehicles.json';
import partsData from '../data/parts.json';
import eventsData from '../data/events.json';
import realMissionsData from '../data/missions_real.json';

export function getCubesatClasses() { return cubesatClassesData; }
export function getObjectives() { return objectivesData; }
export function getOrbits() { return orbitsData; }
export function getVehicles() { return vehiclesData; }
export function getParts() { return partsData; }
export function getEvents() { return eventsData; }
export function getRealMissions() { return realMissionsData; }

export const cubesatClasses = cubesatClassesData;
export const objectives = objectivesData;
export const orbits = orbitsData;
export const vehicles = vehiclesData;
export const parts = partsData;
export const events = eventsData;
export const realMissions = realMissionsData;
`,
          map: null
        };
      }
      return null;
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [sharedDataBrowserPlugin()],
  resolve: {
    alias: [
      {
        find: '@shared',
        replacement: fileURLToPath(new URL('../shared/src/index.ts', import.meta.url))
      },
      {
        find: /^@shared\/(.*)$/,
        replacement: fileURLToPath(new URL('../shared/src/$1', import.meta.url))
      }
    ]
  },
  server: {
    fs: {
      allow: ['..']
    }
  }
});
