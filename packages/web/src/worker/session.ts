import { distanceMatrix, type SolverStep, type WorkerCommand, type WorkerEvent } from '@tsp/core';
import { solvers } from '@tsp/solvers';

const STEP_INTERVAL_MS = 1000 / 60; // UI'a en fazla saniyede 60 adım
const SLICE_MS = 8; // bir dilimde çözücüye ayrılan süre; arada komutlar (pause/stop) işlenir

export type SessionDeps = {
  post: (event: WorkerEvent) => void;
  /** Bir sonraki dilimi kuyruğa alır (Worker'da MessageChannel, testte elle boşaltılan kuyruk). */
  schedule: (fn: () => void) => void;
  now?: () => number;
};

/**
 * Worker'ın protokol mantığı. Çözücü kendi hızında çalışır; UI'a yalnızca
 * en güncel adım, en fazla STEP_INTERVAL_MS aralıkla gönderilir.
 */
export function createSession({ post, schedule, now = () => performance.now() }: SessionDeps) {
  let gen: Generator<SolverStep> | null = null;
  let latest: SolverStep | null = null;
  let lastPost = -Infinity;
  let paused = false;
  let elapsedMs = 0; // yalnızca aktif hesaplama süresi
  let runId = 0;

  const fail = (err: unknown) => {
    gen = null;
    post({ type: 'error', message: err instanceof Error ? err.message : String(err) });
  };

  /** Bir adım ilerletir; çözücü bittiyse false döner. */
  const advance = (): boolean => {
    const r = gen!.next();
    if (r.done) return false;
    latest = r.value;
    return true;
  };

  // elapsedMs son dilim eklendikten sonra çağrılmalı.
  const finish = () => {
    gen = null;
    if (latest) post({ type: 'done', step: latest, elapsedMs });
    else post({ type: 'error', message: 'Çözücü hiç adım üretmedi' });
  };

  const loop = (id: number) => {
    if (id !== runId || paused || !gen) return;
    const t0 = now();
    let finished = false;
    try {
      while (now() - t0 < SLICE_MS) {
        if (!advance()) {
          finished = true;
          break;
        }
      }
    } catch (err) {
      fail(err);
      return;
    } finally {
      elapsedMs += now() - t0;
    }
    if (finished) return finish();
    const t = now();
    if (latest && t - lastPost >= STEP_INTERVAL_MS) {
      post({ type: 'step', step: latest });
      lastPost = t;
    }
    schedule(() => loop(id));
  };

  const handle = (cmd: WorkerCommand) => {
    switch (cmd.type) {
      case 'start': {
        const solver = solvers[cmd.solverId];
        if (!solver) return fail(`Bilinmeyen çözücü: ${cmd.solverId}`);
        const id = ++runId;
        const n = cmd.points.length;
        gen = solver.solve(distanceMatrix(cmd.points), n, { ...solver.defaultParams, ...cmd.params });
        latest = null;
        lastPost = -Infinity;
        paused = false;
        elapsedMs = 0;
        schedule(() => loop(id));
        return;
      }
      case 'pause':
        paused = true;
        if (latest) post({ type: 'step', step: latest });
        return;
      case 'resume':
        if (!paused) return;
        paused = false;
        schedule(() => loop(runId));
        return;
      case 'step': {
        if (!paused || !gen) return;
        const t0 = now();
        let more: boolean;
        try {
          more = advance();
        } catch (err) {
          fail(err);
          return;
        } finally {
          elapsedMs += now() - t0;
        }
        if (more) post({ type: 'step', step: latest! });
        else finish();
        return;
      }
      case 'stop':
        runId++;
        gen = null;
        paused = false;
        return;
    }
  };

  return { handle };
}
