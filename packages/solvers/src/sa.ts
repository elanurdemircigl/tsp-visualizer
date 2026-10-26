import { tourLength, type Solver } from '@tsp/core';
import { mulberry32, randomTour, reverse } from './utils';

type SAParams = {
  initialTemp: number; // metre cinsinden
  coolingRate: number; // her sıcaklık seviyesinde T *= coolingRate
  minTemp: number;
  iterationsPerTemp: number;
  seed: number;
};

/**
 * Benzetimli Tavlama — rastgele turdan başlar, rastgele 2-opt hamlesi dener.
 * Kötüleştiren hamleyi exp(-Δ/T) olasılıkla kabul eder; T soğudukça açgözlüleşir.
 * Her sıcaklık seviyesi bir adımdır; son adım bulunan en iyi turdur.
 */
export const simulatedAnnealing: Solver<SAParams> = {
  id: 'sa',
  name: 'Benzetimli Tavlama',
  defaultParams: { initialTemp: 1000, coolingRate: 0.995, minTemp: 0.5, iterationsPerTemp: 200, seed: 42 },
  *solve(dist, n, params) {
    if (n === 0) return;
    const rand = mulberry32(params.seed);
    const cooling = Math.min(Math.max(params.coolingRate, 0.5), 0.9999);
    const perTemp = Math.max(1, Math.floor(params.iterationsPerTemp));
    const minTemp = Math.max(params.minTemp, 1e-6);

    const tour = randomTour(n, rand);
    let cost = tourLength(tour, dist, n);
    let best = [...tour];
    let bestCost = cost;
    let iteration = 0;
    yield { iteration, tour: [...tour], cost, bestCost, note: 'Başlangıç: rastgele tur' };
    if (n < 4) return;

    for (let T = params.initialTemp; T > minTemp; T *= cooling) {
      let accepted = 0;
      for (let k = 0; k < perTemp; k++) {
        iteration++;
        let i = Math.floor(rand() * n);
        let j = Math.floor(rand() * n);
        if (i > j) [i, j] = [j, i];
        if (j - i < 1 || (i === 0 && j === n - 1)) continue;
        // tour[i..j] ters çevrilirse (a,b) ve (c,d) kenarları (a,c) ve (b,d) olur
        const a = tour[(i - 1 + n) % n]!;
        const b = tour[i]!;
        const c = tour[j]!;
        const d = tour[(j + 1) % n]!;
        const delta = dist[a * n + c]! + dist[b * n + d]! - dist[a * n + b]! - dist[c * n + d]!;
        if (delta < 0 || rand() < Math.exp(-delta / T)) {
          reverse(tour, i, j);
          cost += delta;
          accepted++;
          if (cost < bestCost - 1e-9) {
            bestCost = cost;
            best = [...tour];
          }
        }
      }
      yield {
        iteration,
        tour: [...tour],
        cost,
        bestCost,
        note: `T = ${T.toFixed(1)} m, kabul edilen hamle: ${accepted}/${perTemp}`,
      };
    }

    yield { iteration, tour: best, cost: bestCost, bestCost, note: 'Soğuma bitti: bulunan en iyi tur' };
  },
};
