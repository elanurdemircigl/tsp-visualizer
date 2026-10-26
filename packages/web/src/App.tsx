import type { Point, SolverId, SolverStep, WorkerEvent } from '@tsp/core';
import { solvers } from '@tsp/solvers';
import { useEffect, useRef, useState } from 'react';
import { randomPoints } from './map/geometry';
import { SplitMap, type Lane } from './map/SplitMap';
import { TourMap } from './map/TourMap';
import { createSolverRunner, type SolverRunner } from './worker/client';

// GEÇİCİ deneme paneli: haritayı ve Worker'ı gerçek çözücülerle uçtan uca görmek için.
// Faz 1'de UI ajanı bunu src/ui altındaki kontrol paneliyle değiştirir.

const COLORS: Record<SolverId, string> = { nn: '#0891b2', '2opt': '#4f46e5', sa: '#c026d3', ga: '#16a34a' };
const IDS = Object.keys(solvers) as SolverId[];

type Result = { step?: SolverStep; elapsedMs?: number; error?: string };

export default function App() {
  const [points, setPoints] = useState<Point[]>(() => randomPoints(50));
  const [fitKey, setFitKey] = useState(0);
  const [solverId, setSolverId] = useState<SolverId>('2opt');
  const [race, setRace] = useState(false);
  const [results, setResults] = useState<Partial<Record<SolverId, Result>>>({});
  const runners = useRef(new Map<SolverId, SolverRunner>());

  const stopAll = () => {
    for (const r of runners.current.values()) r.terminate();
    runners.current.clear();
  };
  useEffect(() => stopAll, []);

  const run = () => {
    stopAll();
    setResults({});
    for (const id of race ? IDS : [solverId]) {
      const runner = createSolverRunner((e: WorkerEvent) =>
        setResults((prev) => ({
          ...prev,
          [id]:
            e.type === 'step' ? { step: e.step }
            : e.type === 'done' ? { step: { ...e.step, highlight: undefined }, elapsedMs: e.elapsedMs }
            : { ...prev[id], error: e.message },
        })),
      );
      runners.current.set(id, runner);
      runner.send({ type: 'start', solverId: id, points, params: {} });
    }
  };

  const editPoints = (next: Point[]) => {
    stopAll();
    setResults({});
    setPoints(next);
  };

  const lanes: Lane[] = IDS.map((id) => ({ id, label: solvers[id].name, color: COLORS[id], step: results[id]?.step }));

  return (
    <div className="flex h-full flex-col bg-slate-50 text-slate-900">
      <header className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-2 text-sm">
        <h1 className="mr-4 text-base font-semibold">TSP Algoritma Görselleştirici</h1>
        <button className="rounded border px-2 py-1" onClick={() => { editPoints(randomPoints(50)); setFitKey((k) => k + 1); }}>
          Rastgele 50
        </button>
        <button className="rounded border px-2 py-1" onClick={() => { editPoints(randomPoints(200)); setFitKey((k) => k + 1); }}>
          Rastgele 200
        </button>
        <button className="rounded border px-2 py-1" onClick={() => editPoints([])}>Temizle</button>
        <span className="mx-2 text-slate-400">|</span>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={race} onChange={(e) => setRace(e.target.checked)} /> Yarış
        </label>
        {!race && (
          <select className="rounded border px-1 py-1" value={solverId} onChange={(e) => setSolverId(e.target.value as SolverId)}>
            {IDS.map((id) => <option key={id} value={id}>{solvers[id].name}</option>)}
          </select>
        )}
        <button className="rounded bg-indigo-600 px-3 py-1 text-white disabled:opacity-40" disabled={points.length < 2} onClick={run}>
          Çalıştır
        </button>
        <span className="ml-auto tabular-nums text-slate-600">
          {points.length} nokta
          {IDS.filter((id) => results[id]).map((id) => {
            const r = results[id]!;
            return (
              <span key={id} className="ml-3" style={{ color: COLORS[id] }}>
                {id}: {r.error ?? (r.step ? `${(r.step.bestCost / 1000).toFixed(2)} km` : '…')}
                {r.elapsedMs !== undefined && ` (${Math.round(r.elapsedMs)} ms)`}
              </span>
            );
          })}
        </span>
      </header>
      <main className="min-h-0 flex-1">
        {race ? (
          <SplitMap points={points} lanes={lanes} fitKey={fitKey} />
        ) : (
          <TourMap
            points={points}
            step={results[solverId]?.step}
            color={COLORS[solverId]}
            fitKey={fitKey}
            onAddPoint={(lat, lng) => editPoints([...points, { id: crypto.randomUUID(), lat, lng }])}
            onRemovePoint={(id) => editPoints(points.filter((p) => p.id !== id))}
          />
        )}
      </main>
    </div>
  );
}
