import { tourLength, type Solver } from '@tsp/core';
import { nearestNeighborTour, reverse } from './utils';

type TwoOptParams = { maxPasses: number };

/**
 * 2-opt yerel arama — En Yakın Komşu turundan başlar; kesişen iki kenarı
 * (a,b),(c,d) → (a,c),(b,d) ile değiştirip aradaki yolu ters çevirir.
 * Her iyileştirici hamle bir adımdır; iyileşme kalmayınca durur.
 */
export const twoOpt: Solver<TwoOptParams> = {
  id: '2opt',
  name: '2-opt',
  defaultParams: { maxPasses: 1000 },
  *solve(dist, n, params) {
    if (n === 0) return;
    const tour = nearestNeighborTour(dist, n);
    let cost = tourLength(tour, dist, n);
    let iteration = 0;
    yield { iteration, tour: [...tour], cost, bestCost: cost, note: 'Başlangıç: En Yakın Komşu turu' };
    if (n < 4) return;

    for (let pass = 0; pass < params.maxPasses; pass++) {
      let improved = false;
      for (let i = 0; i < n - 2; i++) {
        for (let j = i + 2; j < n; j++) {
          if (i === 0 && j === n - 1) continue; // aynı iki kenar
          const a = tour[i]!;
          const b = tour[i + 1]!;
          const c = tour[j]!;
          const d = tour[(j + 1) % n]!;
          const delta = dist[a * n + c]! + dist[b * n + d]! - dist[a * n + b]! - dist[c * n + d]!;
          if (delta < -1e-9) {
            reverse(tour, i + 1, j);
            cost += delta;
            improved = true;
            iteration++;
            yield {
              iteration,
              tour: [...tour],
              cost,
              bestCost: cost,
              highlight: [[a, c], [b, d]],
              note: `(${a},${b}) ve (${c},${d}) kenarları değiştirildi: ${Math.round(-delta)} m kısaldı`,
            };
          }
        }
      }
      if (!improved) break;
    }
  },
};
