// TSPLIB benchmark: her çözücüyü bilinen optimumu olan örneklerde çalıştırır, sapma ve süreyi raporlar.
// Kullanım: pnpm bench  → benchmarks/results.md
// Veri: TSPLIB95 (Reinelt); data/*.tsp dosyaları github.com/mastqe/tsplib aynasından alındı
// (resmi sunucu erişilemiyordu). Doğrulama: satır sayıları DIMENSION ile aynı, hiçbir sonuç optimumun
// altında değil ve berlin52'de En Yakın Komşu literatürdeki %19,1 sapmayı veriyor.
import { tourLength, type SolverId } from '@tsp/core';
import { runToEnd, solvers } from '@tsp/solvers';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

// Bilinen optimumlar: TSPLIB95 (Reinelt), EUC_2D mesafeleriyle.
const INSTANCES = [
  { name: 'berlin52', optimum: 7542 },
  { name: 'eil76', optimum: 538 },
  { name: 'kroA100', optimum: 21282 },
];
const SEEDS = [1, 2, 3, 4, 5]; // rastgele çözücüler (SA, GA) için ortalama
const IDS = Object.keys(solvers) as SolverId[];

/** NODE_COORD_SECTION'dan EUC_2D mesafe matrisi (TSPLIB: Öklid mesafesi en yakın tamsayıya yuvarlanır). */
export function parseTsp(text: string): { n: number; dist: Float64Array } {
  const lines = text.split(/\r?\n/);
  const type = lines.find((l) => l.startsWith('EDGE_WEIGHT_TYPE'))?.split(':')[1]?.trim();
  if (type !== 'EUC_2D') throw new Error(`Desteklenmeyen EDGE_WEIGHT_TYPE: ${type}`);
  const start = lines.findIndex((l) => l.trim() === 'NODE_COORD_SECTION') + 1;
  const coords: [number, number][] = [];
  for (const line of lines.slice(start)) {
    const parts = line.trim().split(/\s+/);
    if (parts[0] === 'EOF' || parts.length < 3) break;
    coords.push([Number(parts[1]), Number(parts[2])]);
  }
  const n = coords.length;
  const dist = new Float64Array(n * n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const [xi, yi] = coords[i]!;
      const [xj, yj] = coords[j]!;
      dist[i * n + j] = Math.round(Math.hypot(xi - xj, yi - yj));
    }
  }
  return { n, dist };
}

type Row = { instance: string; n: number; id: SolverId; gapPct: number; bestGapPct: number; ms: number };

function bench(): Row[] {
  const rows: Row[] = [];
  for (const { name, optimum } of INSTANCES) {
    const { n, dist } = parseTsp(readFileSync(join(here, 'data', `${name}.tsp`), 'utf8'));
    for (const id of IDS) {
      const solver = solvers[id];
      const seeds = 'seed' in solver.defaultParams ? SEEDS : [undefined];
      const gaps: number[] = [];
      let totalMs = 0;
      for (const seed of seeds) {
        const params = seed === undefined ? solver.defaultParams : { ...solver.defaultParams, seed };
        const t0 = performance.now();
        const last = runToEnd(solver.solve(dist, n, params));
        totalMs += performance.now() - t0;
        // bestCost yerine turu yeniden ölç: çözücünün kendi hesabına güvenme
        gaps.push(((tourLength(last.tour, dist, n) - optimum) / optimum) * 100);
      }
      rows.push({
        instance: name,
        n,
        id,
        gapPct: gaps.reduce((a, b) => a + b, 0) / gaps.length,
        bestGapPct: Math.min(...gaps),
        ms: totalMs / seeds.length,
      });
      console.log(`${name.padEnd(9)} ${solver.name.padEnd(20)} %${rows.at(-1)!.gapPct.toFixed(1).padStart(6)}  ${Math.round(rows.at(-1)!.ms)} ms`);
    }
  }
  return rows;
}

function toMarkdown(rows: Row[]): string {
  const pct = (x: number) => `%${x.toFixed(1).replace('.', ',')}`;
  const head = '| Örnek | n | Algoritma | Optimuma sapma | En iyi seed | Süre |\n|---|---:|---|---:|---:|---:|';
  const body = rows.map((r) => {
    const random = 'seed' in solvers[r.id].defaultParams;
    return `| ${r.instance} | ${r.n} | ${solvers[r.id].name} | ${pct(r.gapPct)}${random ? '¹' : ''} | ${random ? pct(r.bestGapPct) : '—'} | ${Math.round(r.ms)} ms |`;
  });
  return [
    head,
    ...body,
    '',
    `¹ ${SEEDS.length} farklı seed'in ortalaması. Varsayılan parametreler; süreler tek iş parçacığında Node ${process.versions.node} ile ölçüldü.`,
  ].join('\n');
}

const rows = bench();
writeFileSync(join(here, 'results.md'), `${toMarkdown(rows)}\n`);
console.log('\n→ benchmarks/results.md');
