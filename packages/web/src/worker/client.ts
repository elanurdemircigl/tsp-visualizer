import type { WorkerCommand, WorkerEvent } from '@tsp/core';

export type SolverRunner = {
  send: (cmd: WorkerCommand) => void;
  terminate: () => void;
};

/**
 * Bir çözücü Worker'ı oluşturur. Yarış modunda her algoritma için ayrı runner açılır.
 *
 *   const runner = createSolverRunner((e) => { if (e.type === 'step') ... });
 *   runner.send({ type: 'start', solverId: '2opt', points, params: {} });
 */
export function createSolverRunner(onEvent: (event: WorkerEvent) => void): SolverRunner {
  const worker = new Worker(new URL('./solver.worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (e: MessageEvent<WorkerEvent>) => onEvent(e.data);
  worker.onerror = (e) => onEvent({ type: 'error', message: e.message });
  return {
    send: (cmd) => worker.postMessage(cmd),
    terminate: () => worker.terminate(),
  };
}
