import type { SolverStep, TracePoint, WorkerEvent } from '@tsp/core';

export type RunStatus = 'running' | 'paused' | 'done' | 'error';

export type RunState = {
  status: RunStatus;
  step?: SolverStep;
  history: TracePoint[]; // yakınsama grafiği
  elapsedMs?: number;
  error?: string;
};

const MAX_HISTORY = 4000;

export const initialRun = (paused: boolean): RunState => ({ status: paused ? 'paused' : 'running', history: [] });

/** Worker'ın gönderdiği iyileşmeleri ekler; aynı iterasyon tekrar gelirse atlar. */
function appendTrace(history: TracePoint[], trace: TracePoint[]): TracePoint[] {
  if (trace.length === 0) return history;
  const lastIt = history.at(-1)?.iteration ?? -1;
  const fresh = trace.filter((p) => p.iteration > lastIt);
  if (fresh.length === 0) return history;
  const next = history.concat(fresh);
  // Çok uzun koşularda her ikinci noktayı at (ilk ve son korunur).
  return next.length > MAX_HISTORY ? next.filter((_, i) => i % 2 === 0 || i === next.length - 1) : next;
}

export function applyEvent(run: RunState, event: WorkerEvent): RunState {
  switch (event.type) {
    case 'step':
      return { ...run, step: event.step, history: appendTrace(run.history, event.trace) };
    case 'done':
      return {
        ...run,
        status: 'done',
        step: { ...event.step, highlight: undefined }, // bittiğinde son hamle vurgusu kalmasın
        elapsedMs: event.elapsedMs,
        history: appendTrace(run.history, event.trace),
      };
    case 'error':
      return { ...run, status: 'error', error: event.message };
  }
}
