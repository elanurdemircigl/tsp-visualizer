import { tourLength, type Solver } from '@tsp/core';
import { mulberry32, randomTour, reverse } from './utils';

type GAParams = {
  populationSize: number;
  generations: number;
  mutationRate: number; // çocuk başına ters çevirme mutasyonu olasılığı
  eliteCount: number; // değişmeden aktarılan en iyi birey sayısı
  tournamentSize: number;
  seed: number;
};

type Individual = { tour: number[]; cost: number };

/** Sıralı çaprazlama (OX): p1'den bir dilim, kalan sırayı p2'den alır. */
function orderCrossover(p1: number[], p2: number[], rand: () => number): number[] {
  const n = p1.length;
  let i = Math.floor(rand() * n);
  let j = Math.floor(rand() * n);
  if (i > j) [i, j] = [j, i];
  const child = new Array<number>(n);
  const used = new Uint8Array(n);
  for (let k = i; k <= j; k++) {
    child[k] = p1[k]!;
    used[p1[k]!] = 1;
  }
  let pos = (j + 1) % n;
  for (let k = 0; k < n; k++) {
    const gene = p2[(j + 1 + k) % n]!;
    if (used[gene]) continue;
    child[pos] = gene;
    pos = (pos + 1) % n;
  }
  return child;
}

/**
 * Genetik Algoritma — rastgele popülasyon, turnuva seçimi, OX çaprazlama,
 * ters çevirme mutasyonu ve elitizm. Her nesil bir adımdır.
 */
export const geneticAlgorithm: Solver<GAParams> = {
  id: 'ga',
  name: 'Genetik Algoritma',
  defaultParams: { populationSize: 100, generations: 500, mutationRate: 0.2, eliteCount: 2, tournamentSize: 5, seed: 42 },
  *solve(dist, n, params) {
    if (n === 0) return;
    const rand = mulberry32(params.seed);
    const popSize = Math.max(2, Math.floor(params.populationSize));
    const elite = Math.min(Math.max(0, Math.floor(params.eliteCount)), popSize - 1);
    const tSize = Math.max(1, Math.floor(params.tournamentSize));
    const evaluate = (tour: number[]): Individual => ({ tour, cost: tourLength(tour, dist, n) });

    let population = Array.from({ length: popSize }, () => evaluate(randomTour(n, rand)));
    population.sort((x, y) => x.cost - y.cost);
    let best = population[0]!;
    yield { iteration: 0, tour: [...best.tour], cost: best.cost, bestCost: best.cost, note: `Nesil 0: ${popSize} rastgele birey` };
    if (n < 4) return;

    const tournament = (): Individual => {
      let winner = population[Math.floor(rand() * popSize)]!;
      for (let k = 1; k < tSize; k++) {
        const rival = population[Math.floor(rand() * popSize)]!;
        if (rival.cost < winner.cost) winner = rival;
      }
      return winner;
    };

    for (let gen = 1; gen <= params.generations; gen++) {
      const next = population.slice(0, elite);
      while (next.length < popSize) {
        const child = orderCrossover(tournament().tour, tournament().tour, rand);
        if (rand() < params.mutationRate) {
          let i = Math.floor(rand() * n);
          let j = Math.floor(rand() * n);
          if (i > j) [i, j] = [j, i];
          reverse(child, i, j);
        }
        next.push(evaluate(child));
      }
      next.sort((x, y) => x.cost - y.cost);
      population = next;
      const genBest = population[0]!;
      if (genBest.cost < best.cost) best = genBest;
      yield {
        iteration: gen,
        tour: [...genBest.tour],
        cost: genBest.cost,
        bestCost: best.cost,
        note: `Nesil ${gen}: en iyi ${Math.round(genBest.cost)} m`,
      };
    }
  },
};
