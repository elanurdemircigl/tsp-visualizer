import type { Solver } from '@tsp/core';

type NNParams = { start: number };

/**
 * En Yakın Komşu — O(n²). Her adımda tura bir nokta eklenir;
 * ara adımlarda `cost`, kısmi turun başa dönüş dahil uzunluğudur.
 */
export const nearestNeighbor: Solver<NNParams> = {
  id: 'nn',
  name: 'En Yakın Komşu',
  defaultParams: { start: 0 },
  *solve(dist, n, params) {
    if (n === 0) return;
    const start = Math.min(Math.max(0, Math.floor(params.start)), n - 1);
    const visited = new Uint8Array(n);
    const tour = [start];
    visited[start] = 1;
    let pathLength = 0;

    yield { iteration: 0, tour: [start], cost: 0, bestCost: 0, note: `Başlangıç noktası: ${start}` };

    for (let k = 1; k < n; k++) {
      const cur = tour[k - 1]!;
      let next = -1;
      let nextD = Infinity;
      for (let j = 0; j < n; j++) {
        const d = dist[cur * n + j]!;
        if (!visited[j] && d < nextD) {
          nextD = d;
          next = j;
        }
      }
      visited[next] = 1;
      tour.push(next);
      pathLength += nextD;
      const cost = pathLength + dist[next * n + start]!;
      yield {
        iteration: k,
        tour: [...tour],
        cost,
        bestCost: cost,
        highlight: [[cur, next]],
        note: `${cur} noktasına en yakın ziyaret edilmemiş nokta ${next} (${Math.round(nextD)} m)`,
      };
    }
  },
};
