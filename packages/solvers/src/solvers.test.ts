import { distanceMatrix, tourLength, type Point, type Solver, type SolverStep } from '@tsp/core';
import { describe, expect, it } from 'vitest';
import { mulberry32, runToEnd, solvers } from './index';

/** Konya merkezinde ~10 km'lik kutuda tohumlu rastgele noktalar. */
function konyaPoints(n: number, seed: number): Point[] {
  const rand = mulberry32(seed);
  return Array.from({ length: n }, (_, i) => ({
    id: String(i),
    lat: 37.82 + rand() * 0.1,
    lng: 32.44 + rand() * 0.12,
  }));
}

function setup(n: number, seed = 1) {
  const points = konyaPoints(n, seed);
  return { n, dist: distanceMatrix(points) };
}

/** Küçük n için kesin optimum (0 sabit, kalan permütasyonlar). */
function bruteForceOptimum(dist: Float64Array, n: number): number {
  let best = Infinity;
  const rest = Array.from({ length: n - 1 }, (_, i) => i + 1);
  const permute = (k: number) => {
    if (k === rest.length) {
      best = Math.min(best, tourLength([0, ...rest], dist, n));
      return;
    }
    for (let i = k; i < rest.length; i++) {
      [rest[k], rest[i]] = [rest[i]!, rest[k]!];
      permute(k + 1);
      [rest[k], rest[i]] = [rest[i]!, rest[k]!];
    }
  };
  permute(0);
  return best;
}

function solve(solver: Solver, n: number, dist: Float64Array): SolverStep {
  return runToEnd(solver.solve(dist, n, solver.defaultParams));
}

function expectValidTour(tour: number[], n: number) {
  expect(tour).toHaveLength(n);
  expect([...tour].sort((a, b) => a - b)).toEqual(Array.from({ length: n }, (_, i) => i));
}

const all = Object.values(solvers);

describe.each(all)('$name', (solver) => {
  it('geçerli bir tur üretir ve cost tur uzunluğuna eşittir', () => {
    const { n, dist } = setup(30);
    const last = solve(solver, n, dist);
    expectValidTour(last.tour, n);
    expect(last.cost).toBeCloseTo(tourLength(last.tour, dist, n), 3);
    expect(last.bestCost).toBeLessThanOrEqual(last.cost + 1e-6);
  });

  it('bestCost hiç artmaz (yakınsama grafiği monoton)', () => {
    if (solver.id === 'nn') return; // NN kısmi tur kurar, maliyeti büyür
    const { n, dist } = setup(40);
    let prev = Infinity;
    for (const step of solver.solve(dist, n, solver.defaultParams)) {
      expect(step.bestCost).toBeLessThanOrEqual(prev + 1e-6);
      prev = step.bestCost;
    }
  });

  it('iterasyon sayısı azalmaz', () => {
    const { n, dist } = setup(20);
    let prev = -1;
    for (const step of solver.solve(dist, n, solver.defaultParams)) {
      expect(step.iteration).toBeGreaterThanOrEqual(prev);
      prev = step.iteration;
    }
  });

  it.each([0, 1, 2, 3])('n = %i uç durumunda çökmez', (n) => {
    const { dist } = setup(n);
    const steps = [...solver.solve(dist, n, solver.defaultParams)];
    if (n === 0) expect(steps).toHaveLength(0);
    else expectValidTour(steps.at(-1)!.tour, n);
  });
});

describe('kalite', () => {
  it('10 noktada 2-opt, En Yakın Komşu\'dan kısa tur bulur', () => {
    const { n, dist } = setup(10, 7);
    const nn = solve(solvers.nn, n, dist);
    const two = solve(solvers['2opt'], n, dist);
    expect(two.cost).toBeLessThan(nn.cost);
  });

  it.each(['sa', 'ga'] as const)('%s 8 noktada kesin optimumu bulur', (id) => {
    const { n, dist } = setup(8, 3);
    const opt = bruteForceOptimum(dist, n);
    expect(solve(solvers[id], n, dist).bestCost).toBeCloseTo(opt, 3);
  });

  it('2-opt 8 noktada optimuma %5 içinde yaklaşır', () => {
    const { n, dist } = setup(8, 3);
    const opt = bruteForceOptimum(dist, n);
    expect(solve(solvers['2opt'], n, dist).cost).toBeLessThanOrEqual(opt * 1.05);
  });

  it.each(['sa', 'ga'] as const)('%s aynı seed ile aynı sonucu verir', (id) => {
    const { n, dist } = setup(25);
    expect(solve(solvers[id], n, dist).tour).toEqual(solve(solvers[id], n, dist).tour);
  });
});

describe('performans (200 nokta)', () => {
  const { n, dist } = setup(200, 11);
  const time = (id: keyof typeof solvers) => {
    const t0 = performance.now();
    solve(solvers[id], n, dist);
    return performance.now() - t0;
  };

  it('NN + 2-opt 2 saniyenin altında', () => {
    expect(time('nn') + time('2opt')).toBeLessThan(2000);
  });

  it.each(['sa', 'ga'] as const)('%s 5 saniyenin altında', (id) => {
    expect(time(id)).toBeLessThan(5000);
  });
});
