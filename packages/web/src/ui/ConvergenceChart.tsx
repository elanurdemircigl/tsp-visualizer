import type { SolverId } from '@tsp/core';
import { solvers } from '@tsp/solvers';
import { useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatInt, formatKm, formatTick, logTicks } from './format';
import { ALGO_STYLES } from './theme';
import type { Runs } from './useSolverRuns';

const AXIS = { fontSize: 11, fill: '#64748b' };

/** Tüm algoritmalar aynı grafikte: iterasyon × en iyi tur uzunluğu. */
export function ConvergenceChart({ runs }: { runs: Runs }) {
  const [log, setLog] = useState(true);
  const ids = (Object.keys(runs) as SolverId[]).filter((id) => runs[id]!.history.length > 0);

  // Log ölçekte 0 olamaz: x = iterasyon + 1.
  const series = ids.map((id) => ({
    id,
    data: runs[id]!.history.map((h) => ({ x: h.iteration + 1, y: h.bestCost / 1000 })),
  }));
  const all = series.flatMap((s) => s.data);
  const xMax = Math.max(1, ...all.map((d) => d.x));
  const yMin = Math.min(...all.map((d) => d.y));
  const yMax = Math.max(...all.map((d) => d.y));
  const pad = Math.max((yMax - yMin) * 0.05, 0.5);

  return (
    <div className="flex h-full min-h-0 flex-col p-3">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Yakınsama: en iyi tur uzunluğu (km)</h2>
        <label className="flex items-center gap-1 text-xs text-slate-500">
          <input type="checkbox" checked={log} onChange={(e) => setLog(e.target.checked)} />
          Log ölçek
        </label>
      </div>
      {ids.length === 0 ? (
        <p className="m-auto text-sm text-slate-400">Bir algoritma başlatınca burada görünür.</p>
      ) : (
        <div className="min-h-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis
                type="number"
                dataKey="x"
                scale={log ? 'log' : 'linear'}
                domain={log ? [1, xMax] : [0, xMax]}
                ticks={log ? logTicks(xMax) : undefined}
                allowDataOverflow
                tick={AXIS}
                stroke="#cbd5e1"
                tickFormatter={formatTick}
                label={{ value: 'iterasyon', position: 'insideBottomRight', offset: -2, fontSize: 11, fill: '#94a3b8' }}
              />
              <YAxis
                type="number"
                dataKey="y"
                domain={[Math.max(0, Math.floor(yMin - pad)), Math.ceil(yMax + pad)]}
                width={40}
                tick={AXIS}
                stroke="#cbd5e1"
                allowDecimals={false}
              />
              <Tooltip
                formatter={(v: number, name: string) => [formatKm(v * 1000), name]}
                labelFormatter={(x: number) => `İterasyon ${formatInt(x - 1)}`}
                contentStyle={{ fontSize: 12 }}
              />
              {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12, color: '#334155' }} />}
              {series.map(({ id, data }) => (
                <Line
                  key={id}
                  data={data}
                  dataKey="y"
                  name={solvers[id].name}
                  type="stepAfter"
                  stroke={ALGO_STYLES[id].color}
                  strokeDasharray={ALGO_STYLES[id].dash}
                  strokeWidth={2}
                  // NN gibi tek tam tur üretenlerde çizgi yok; nokta göster
                  dot={data.length === 1 ? { r: 5, strokeWidth: 2, fill: ALGO_STYLES[id].color } : false}
                  isAnimationActive={false} // saniyede 60 güncellemede animasyon takılır
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
