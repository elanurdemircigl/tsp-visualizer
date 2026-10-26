import type { SolverStep } from '@tsp/core';

/** Tohumlu, hızlı PRNG (mulberry32). Aynı seed → aynı dizi; yarışta adil karşılaştırma için. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** tour[i..j] aralığını yerinde ters çevirir. */
export function reverse(tour: number[], i: number, j: number): void {
  while (i < j) {
    const tmp = tour[i]!;
    tour[i++] = tour[j]!;
    tour[j--] = tmp;
  }
}

/** Fisher–Yates ile 0..n-1 rastgele permütasyon. */
export function randomTour(n: number, rand: () => number): number[] {
  const tour = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = tour[i]!;
    tour[i] = tour[j]!;
    tour[j] = tmp;
  }
  return tour;
}

/** Açgözlü en yakın komşu turu (2-opt başlangıcı için). */
export function nearestNeighborTour(dist: Float64Array, n: number, start = 0): number[] {
  if (n === 0) return [];
  const visited = new Uint8Array(n);
  const tour = [start];
  visited[start] = 1;
  for (let k = 1; k < n; k++) {
    const cur = tour[k - 1]!;
    let best = -1;
    let bestD = Infinity;
    for (let j = 0; j < n; j++) {
      const d = dist[cur * n + j]!;
      if (!visited[j] && d < bestD) {
        bestD = d;
        best = j;
      }
    }
    visited[best] = 1;
    tour.push(best);
  }
  return tour;
}

/** Generator'ı sonuna kadar çalıştırır ve son adımı döndürür (test ve benchmark için). */
export function runToEnd(gen: Generator<SolverStep>): SolverStep {
  let last: SolverStep | undefined;
  for (const step of gen) last = step;
  if (!last) throw new Error('Çözücü hiç adım üretmedi');
  return last;
}
