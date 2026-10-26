import type { Point, SolverId, SolverParams } from '@tsp/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createSolverRunner, type SolverRunner } from '../worker/client';
import { applyEvent, initialRun, type RunState } from './runState';

export type Runs = Partial<Record<SolverId, RunState>>;

/** Algoritma başına bir Worker; yarışta hepsi aynı nokta kümesiyle paralel çalışır. */
export function useSolverRuns() {
  const runners = useRef(new Map<SolverId, SolverRunner>());
  const [runs, setRuns] = useState<Runs>({});

  const terminateAll = useCallback(() => {
    for (const r of runners.current.values()) r.terminate();
    runners.current.clear();
  }, []);
  useEffect(() => terminateAll, [terminateAll]);

  const start = useCallback(
    (
      ids: SolverId[],
      points: Point[],
      params: Partial<Record<SolverId, SolverParams>>,
      opts: { stepsPerSecond: number; paused?: boolean },
    ) => {
      terminateAll();
      setRuns(Object.fromEntries(ids.map((id) => [id, initialRun(!!opts.paused)])));
      for (const id of ids) {
        const runner = createSolverRunner((event) =>
          setRuns((prev) => {
            const run = prev[id];
            return run ? { ...prev, [id]: applyEvent(run, event) } : prev;
          }),
        );
        runners.current.set(id, runner);
        runner.send({ type: 'start', solverId: id, points, params: params[id] ?? {}, ...opts });
        if (opts.paused) runner.send({ type: 'step' }); // adım modunda ilk basış ilk adımı göstersin
      }
    },
    [terminateAll],
  );

  // Komutlar setRuns updater'ı içinden gönderilmez: StrictMode updater'ı iki kez çağırır.
  const runsRef = useRef(runs);
  runsRef.current = runs;

  /** Belirli durumdaki koşulara komut gönderir ve durumlarını günceller. */
  const command = useCallback(
    (from: RunState['status'], cmd: 'pause' | 'resume' | 'step', to: RunState['status']) => {
      const ids = (Object.keys(runsRef.current) as SolverId[]).filter((id) => runsRef.current[id]?.status === from);
      for (const id of ids) runners.current.get(id)?.send({ type: cmd });
      setRuns((prev) => {
        const next = { ...prev };
        for (const id of ids) {
          const run = prev[id];
          if (run?.status === from) next[id] = { ...run, status: to };
        }
        return next;
      });
    },
    [],
  );

  const pause = useCallback(() => command('running', 'pause', 'paused'), [command]);
  const resume = useCallback(() => command('paused', 'resume', 'running'), [command]);
  const step = useCallback(() => command('paused', 'step', 'paused'), [command]);

  const setSpeed = useCallback((stepsPerSecond: number) => {
    for (const r of runners.current.values()) r.send({ type: 'speed', stepsPerSecond });
  }, []);

  const reset = useCallback(() => {
    terminateAll();
    setRuns({});
  }, [terminateAll]);

  const statuses = Object.values(runs).map((r) => r!.status);
  return {
    runs,
    start,
    pause,
    resume,
    step,
    setSpeed,
    reset,
    isRunning: statuses.includes('running'),
    isPaused: !statuses.includes('running') && statuses.includes('paused'),
    hasRuns: statuses.length > 0,
  };
}
