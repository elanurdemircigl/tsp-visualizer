import type { Solver, SolverId } from '@tsp/core';
import { geneticAlgorithm } from './ga';
import { nearestNeighbor } from './nn';
import { simulatedAnnealing } from './sa';
import { twoOpt } from './twoOpt';

export const solvers: Record<SolverId, Solver> = {
  nn: nearestNeighbor as Solver,
  '2opt': twoOpt as Solver,
  sa: simulatedAnnealing as Solver,
  ga: geneticAlgorithm as Solver,
};

export { geneticAlgorithm, nearestNeighbor, simulatedAnnealing, twoOpt };
export { mulberry32, runToEnd } from './utils';
