import type { SolverId } from '@tsp/core';
import { solvers } from '@tsp/solvers';
import { formatInt, formatKm } from './format';
import type { RunState } from './runState';
import { ALGO_STYLES } from './theme';
import type { Runs } from './useSolverRuns';

const STATUS_LABEL: Record<RunState['status'], string> = {
  running: 'Çalışıyor',
  paused: 'Duraklatıldı',
  done: 'Bitti',
  error: 'Hata',
};

/** Tur uzunluğu, süre, iterasyon; bitenler arasında en iyiye göre fark. */
export function ResultsTable({ runs }: { runs: Runs }) {
  const ids = Object.keys(runs) as SolverId[];
  const doneCosts = ids.flatMap((id) => (runs[id]!.status === 'done' && runs[id]!.step ? [runs[id]!.step!.bestCost] : []));
  const best = doneCosts.length ? Math.min(...doneCosts) : undefined;

  return (
    <div className="h-full overflow-auto p-3">
      <h2 className="mb-1 text-sm font-semibold text-slate-700">Sonuçlar</h2>
      {ids.length === 0 ? (
        <p className="text-sm text-slate-400">Henüz çalıştırılmadı.</p>
      ) : (
        <table className="w-full text-sm" aria-label="Algoritma sonuçları">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
              <th className="whitespace-nowrap px-1.5 py-1 font-medium">Algoritma</th>
              <th className="whitespace-nowrap px-1.5 py-1 font-medium">Durum</th>
              <th className="whitespace-nowrap px-1.5 py-1 text-right font-medium">En iyi tur</th>
              <th className="whitespace-nowrap px-1.5 py-1 text-right font-medium">Fark</th>
              <th className="whitespace-nowrap px-1.5 py-1 text-right font-medium">Süre</th>
              <th className="whitespace-nowrap px-1.5 py-1 text-right font-medium">İterasyon</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {ids.map((id) => {
              const run = runs[id]!;
              const cost = run.step?.bestCost;
              const isBest = run.status === 'done' && cost !== undefined && cost === best;
              const gap = run.status === 'done' && cost !== undefined && best ? ((cost - best) / best) * 100 : undefined;
              return (
                <tr key={id} data-testid={`result-${id}`} className="border-b border-slate-100">
                  <td className="whitespace-nowrap px-1.5 py-1">
                    <span className="mr-1.5 inline-block size-2.5 rounded-full" style={{ background: ALGO_STYLES[id].color }} />
                    {solvers[id].name}
                  </td>
                  <td className="whitespace-nowrap px-1.5 py-1 text-slate-600">{run.error ? `Hata: ${run.error}` : STATUS_LABEL[run.status]}</td>
                  <td className={`whitespace-nowrap px-1.5 py-1 text-right ${isBest ? 'font-semibold' : ''}`}>
                    {cost !== undefined ? formatKm(cost) : '—'}
                  </td>
                  <td className="whitespace-nowrap px-1.5 py-1 text-right text-slate-600">
                    {isBest ? 'en iyi' : gap !== undefined ? `+%${gap.toLocaleString('tr-TR', { maximumFractionDigits: gap < 1 ? 2 : 1 })}` : '—'}
                  </td>
                  <td className="whitespace-nowrap px-1.5 py-1 text-right text-slate-600">
                    {run.elapsedMs !== undefined ? `${formatInt(Math.round(run.elapsedMs))} ms` : '—'}
                  </td>
                  <td className="whitespace-nowrap px-1.5 py-1 text-right text-slate-600">{run.step ? formatInt(run.step.iteration) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
