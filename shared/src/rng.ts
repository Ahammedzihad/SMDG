/**
 * Deterministic seeded pseudo-random number generator using Mulberry32.
 * Ensures reproducible mission simulations and event sequences across runs.
 */

export interface RNG {
  seed: number;
  next(): number;
  nextInt(min: number, max: number): number;
  nextFloat(min: number, max: number): number;
}

/**
 * Converts a numeric or string seed into a 32-bit unsigned integer.
 */
export function normalizeSeed(seed: number | string): number {
  if (typeof seed === 'number') {
    return (Number.isFinite(seed) ? Math.floor(seed) : 0) >>> 0;
  }
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = Math.imul(31, hash) + seed.charCodeAt(i) | 0;
  }
  return hash >>> 0;
}

/**
 * Creates a deterministic Mulberry32 RNG instance.
 *
 * @param seed Seed as number or string.
 * @returns RNG object with next(), nextInt(), nextFloat().
 */
export function createRNG(seed: number | string): RNG {
  let s = normalizeSeed(seed);

  function next(): number {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function nextFloat(min: number, max: number): number {
    return min + (max - min) * next();
  }

  function nextInt(min: number, max: number): number {
    return Math.floor(nextFloat(min, max + 1));
  }

  return {
    get seed() {
      return s;
    },
    next,
    nextInt,
    nextFloat
  };
}
