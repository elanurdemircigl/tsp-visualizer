import { distanceMatrix, type SolverStep, type TracePoint, type WorkerCommand, type WorkerEvent } from '@tsp/core';
import { solvers } from '@tsp/solvers';

const STEP_INTERVAL_MS = 1000 / 60; // sınırsız hızda UI'a en fazla saniyede 60 adım
const SLICE_MS = 8; // bir dilimde çözücüye ayrılan süre; arada komutlar (pause/stop) işlenir

export type SessionDeps = {
  post: (event: WorkerEvent) => void;
  /** Bir sonraki dilimi hemen kuyruğa alır (Worker'da MessageChannel, testte elle boşaltılan kuyruk). */
  schedule: (fn: () => void) => void;
  /** Hız sınırlıyken bir sonraki adımı ms sonra çalıştırır. */
  delay?: (fn: () => void, ms: number) => void;
  now?: () => number;
};

/**
 * Worker'ın protokol mantığı. Sınırsız hızda çözücü kendi hızında çalışır ve UI'a yalnızca
 * en güncel adım gönderilir; hız sınırlıyken (stepsPerSecond > 0) her adım tek tek gönderilir.
 */
export function createSession({
  post,
  schedule,
  delay = (fn, ms) => setTimeout(fn, ms),
  now = () => performance.now(),
}: SessionDeps) {
  let gen: Generator<SolverStep> | null = null;
  let latest: SolverStep | null = null;
  let lastPost = -Infinity;
  let paused = false;
  let stepsPerSecond = 0;
  let elapsedMs = 0; // yalnızca aktif hesaplama süresi
  let runId = 0;
  let pendingRun = -1; // beklemedeki dilimin koşusu: aynı koşu için ikinci döngü açılmasın
  let n = 0;
  let trace: TracePoint[] = []; // son mesajdan bu yana iyileşmeler
  let tracedBest = Infinity;
  let tracedIteration = -1;

  const fail = (err: unknown) => {
    gen = null;
    post({ type: 'error', message: err instanceof Error ? err.message : String(err) });
  };

  /** Bir adım ilerletir; çözücü bittiyse false döner. */
  const advance = (): boolean => {
    const r = gen!.next();
    if (r.done) return false;
    latest = r.value;
    // Yalnızca tam turlar: NN kısmi turu kurarken maliyeti büyür, bu yakınsama değil.
    if (latest.tour.length === n && latest.bestCost < tracedBest - 1e-9) {
      tracedBest = latest.bestCost;
      tracedIteration = latest.iteration;
      trace.push({ iteration: latest.iteration, bestCost: latest.bestCost });
    }
    return true;
  };

  const takeTrace = () => {
    const t = trace;
    trace = [];
    return t;
  };

  const postStep = () => post({ type: 'step', step: latest!, trace: takeTrace() });

  // elapsedMs son dilim eklendikten sonra çağrılmalı.
  const finish = () => {
    gen = null;
    if (!latest) return post({ type: 'error', message: 'Çözücü hiç adım üretmedi' });
    // Eğri son iterasyona kadar uzansın (sonda iyileşme olmasa da).
    if (latest.tour.length === n && latest.iteration !== tracedIteration) {
      trace.push({ iteration: latest.iteration, bestCost: latest.bestCost });
    }
    post({ type: 'done', step: latest, elapsedMs, trace: takeTrace() });
  };

  const kick = (id: number, ms = 0) => {
    if (pendingRun === id) return;
    pendingRun = id;
    const run = () => {
      if (pendingRun === id) pendingRun = -1;
      loop(id);
    };
    if (ms > 0) delay(run, ms);
    else schedule(run);
  };

  /** Tek adım ilerletir ve süresini sayar; hata olursa null döner. */
  const timedAdvance = (): boolean | null => {
    const t0 = now();
    try {
      return advance();
    } catch (err) {
      fail(err);
      return null;
    } finally {
      elapsedMs += now() - t0;
    }
  };

  const loop = (id: number) => {
    if (id !== runId || paused || !gen) return;

    if (stepsPerSecond > 0) {
      const more = timedAdvance();
      if (more === null) return;
      if (!more) return finish();
      postStep();
      kick(id, 1000 / stepsPerSecond);
      return;
    }

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
      postStep();
      lastPost = t;
    }
    kick(id);
  };

  const handle = (cmd: WorkerCommand) => {
    switch (cmd.type) {
      case 'start': {
        const solver = solvers[cmd.solverId];
        if (!solver) return fail(`Bilinmeyen çözücü: ${cmd.solverId}`);
        const id = ++runId;
        n = cmd.points.length;
        gen = solver.solve(distanceMatrix(cmd.points), n, { ...solver.defaultParams, ...cmd.params });
        latest = null;
        lastPost = -Infinity;
        paused = cmd.paused ?? false;
        stepsPerSecond = Math.max(0, cmd.stepsPerSecond ?? 0);
        elapsedMs = 0;
        trace = [];
        tracedBest = Infinity;
        tracedIteration = -1;
        if (!paused) kick(id);
        return;
      }
      case 'pause':
        paused = true;
        if (latest) postStep();
        return;
      case 'resume':
        if (!paused) return;
        paused = false;
        kick(runId);
        return;
      case 'step': {
        if (!paused || !gen) return;
        const more = timedAdvance();
        if (more === null) return;
        if (more) postStep();
        else finish();
        return;
      }
      case 'speed':
        stepsPerSecond = Math.max(0, cmd.stepsPerSecond);
        return;
      case 'stop':
        runId++;
        gen = null;
        paused = false;
        return;
    }
  };

  return { handle };
}
