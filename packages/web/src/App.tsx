import type { Point, SolverId, SolverParams } from '@tsp/core';
import { solvers } from '@tsp/solvers';
import { useState } from 'react';
import { randomPoints } from './map/geometry';
import { SplitMap, type Lane } from './map/SplitMap';
import { TourMap } from './map/TourMap';
import { ControlPanel, type Mode } from './ui/ControlPanel';
import { ConvergenceChart } from './ui/ConvergenceChart';
import { ResultsTable } from './ui/ResultsTable';
import { ALGO_STYLES } from './ui/theme';
import { useSolverRuns } from './ui/useSolverRuns';

const IDS = Object.keys(solvers) as SolverId[];
const DEFAULT_PARAMS = Object.fromEntries(IDS.map((id) => [id, { ...solvers[id].defaultParams }])) as Record<SolverId, SolverParams>;

export default function App() {
  const [points, setPoints] = useState<Point[]>(() => randomPoints(50));
  const [randomN, setRandomN] = useState(50);
  const [fitKey, setFitKey] = useState(0);
  const [mode, setMode] = useState<Mode>('single');
  const [selected, setSelected] = useState<SolverId>('2opt');
  const [raceIds, setRaceIds] = useState<SolverId[]>(IDS);
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [speed, setSpeed] = useState(60);
  const sim = useSolverRuns();

  const active = mode === 'single' ? [selected] : raceIds;

  /** Nokta kümesi değişince eski sonuçlar geçersiz. */
  const editPoints = (next: Point[], fit = false) => {
    sim.reset();
    setPoints(next);
    if (fit) setFitKey((k) => k + 1);
  };

  const start = (paused = false) => sim.start(active, points, params, { stepsPerSecond: speed, paused });

  const lanes: Lane[] = raceIds.map((id) => ({
    id,
    label: solvers[id].name,
    color: ALGO_STYLES[id].color,
    step: sim.runs[id]?.step,
  }));

  return (
    <div className="flex h-full flex-col bg-slate-50 text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
        <h1 className="text-base font-semibold">TSP Algoritma Görselleştirici</h1>
        <a className="text-sm text-slate-500 hover:text-slate-900" href="https://github.com/elanurdemircigl/tsp-visualizer">
          GitHub
        </a>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="border-b border-slate-200 bg-white lg:w-80 lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-b-0">
          <ControlPanel
            pointCount={points.length}
            randomN={randomN}
            onRandomNChange={setRandomN}
            onRandom={() => editPoints(randomPoints(randomN), true)}
            onClear={() => editPoints([])}
            mode={mode}
            onModeChange={(m) => {
              sim.reset();
              setMode(m);
            }}
            selected={selected}
            onSelectedChange={(id) => {
              sim.reset();
              setSelected(id);
            }}
            raceIds={raceIds}
            onRaceIdsChange={setRaceIds}
            params={params}
            onParamsChange={(id, v) => setParams((prev) => ({ ...prev, [id]: v }))}
            speed={speed}
            onSpeedChange={(s) => {
              setSpeed(s);
              sim.setSpeed(s);
            }}
            isRunning={sim.isRunning}
            isPaused={sim.isPaused}
            hasRuns={sim.hasRuns}
            onStart={() => start()}
            onPause={sim.pause}
            onResume={sim.resume}
            onStep={() => (sim.isPaused ? sim.step() : start(true))}
            onReset={sim.reset}
          />
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="h-[55vh] min-h-0 lg:h-auto lg:flex-1">
            {mode === 'race' ? (
              <SplitMap points={points} lanes={lanes} fitKey={fitKey} />
            ) : (
              <TourMap
                points={points}
                step={sim.runs[selected]?.step}
                color={ALGO_STYLES[selected].color}
                fitKey={fitKey}
                onAddPoint={(lat, lng) => editPoints([...points, { id: crypto.randomUUID(), lat, lng }])}
                onRemovePoint={(id) => editPoints(points.filter((p) => p.id !== id))}
              />
            )}
          </div>
          <div className="grid border-t border-slate-200 bg-white lg:h-64 lg:grid-cols-2">
            <div className="h-64 lg:h-auto lg:border-r lg:border-slate-200">
              <ConvergenceChart runs={sim.runs} />
            </div>
            <ResultsTable runs={sim.runs} />
          </div>
        </main>
      </div>
    </div>
  );
}
