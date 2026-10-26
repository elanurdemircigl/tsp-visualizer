import type { Point, WorkerEvent } from '@tsp/core';
import { describe, expect, it } from 'vitest';
import { createSession } from './session';

const points: Point[] = Array.from({ length: 12 }, (_, i) => ({
  id: String(i),
  lat: 37.87 + Math.sin(i * 1.7) * 0.03,
  lng: 32.49 + Math.cos(i * 2.3) * 0.04,
}));

function harness() {
  const events: WorkerEvent[] = [];
  const queue: (() => void)[] = [];
  const delays: number[] = [];
  let clock = 0;
  const session = createSession({
    post: (e) => events.push(e),
    schedule: (fn) => queue.push(fn),
    delay: (fn, ms) => {
      delays.push(ms);
      queue.push(fn);
    },
    now: () => (clock += 1), // her okuma 1 ms ilerler: dilim başına birkaç adım
  });
  const drain = (max = 10_000) => {
    for (let k = 0; k < max && queue.length; k++) queue.shift()!();
  };
  return { session, events, queue, delays, drain };
}

const stepIterations = (events: WorkerEvent[]) =>
  events.flatMap((e) => (e.type === 'step' ? [e.step.iteration] : []));

describe('Worker oturumu', () => {
  it('start → step(ler) → done akışını üretir', () => {
    const { session, events, drain } = harness();
    session.handle({ type: 'start', solverId: '2opt', points, params: {} });
    drain();
    const done = events.at(-1);
    expect(done?.type).toBe('done');
    if (done?.type !== 'done') return;
    expect([...done.step.tour].sort((a, b) => a - b)).toEqual(points.map((_, i) => i));
    expect(done.elapsedMs).toBeGreaterThan(0);
  });

  it('adımları seyreltir: her generator adımı UI\'a gitmez', () => {
    const { session, events, drain } = harness();
    session.handle({ type: 'start', solverId: 'sa', points, params: {} });
    drain();
    const steps = events.filter((e) => e.type === 'step');
    const done = events.at(-1);
    expect(done?.type).toBe('done');
    if (done?.type !== 'done') return;
    expect(steps.length).toBeGreaterThan(0);
    expect(steps.length).toBeLessThan(done.step.iteration);
  });

  it('pause ilerlemeyi durdurur, step tek adım ilerletir, resume devam ettirir', () => {
    const { session, events, queue, drain } = harness();
    session.handle({ type: 'start', solverId: 'nn', points, params: {} });
    session.handle({ type: 'pause' });
    drain();
    expect(events).toHaveLength(0);
    expect(queue).toHaveLength(0);

    session.handle({ type: 'step' });
    session.handle({ type: 'step' });
    expect(events.map((e) => e.type)).toEqual(['step', 'step']);
    expect(events.map((e) => (e.type === 'step' ? e.step.iteration : -1))).toEqual([0, 1]);

    session.handle({ type: 'resume' });
    drain();
    expect(events.at(-1)?.type).toBe('done');
  });

  it('stop sonrası done gönderilmez', () => {
    const { session, events, drain } = harness();
    session.handle({ type: 'start', solverId: 'ga', points, params: { generations: 50 } });
    session.handle({ type: 'stop' });
    drain();
    expect(events.some((e) => e.type === 'done')).toBe(false);
  });

  it('parametreler varsayılanların üzerine yazılır', () => {
    const { session, events, drain } = harness();
    session.handle({ type: 'start', solverId: 'ga', points, params: { generations: 3 } });
    drain();
    const done = events.at(-1);
    expect(done?.type === 'done' && done.step.iteration).toBe(3);
  });

  it('hız sınırlıyken her adımı tek tek ve aralıklı gönderir', () => {
    const { session, events, delays, drain } = harness();
    session.handle({ type: 'start', solverId: 'nn', points, params: {}, stepsPerSecond: 5 });
    drain();
    expect(stepIterations(events)).toEqual(points.map((_, i) => i));
    expect(events.at(-1)?.type).toBe('done');
    expect(delays.every((ms) => ms === 200)).toBe(true);
  });

  it('speed komutu çalışırken hızı değiştirir', () => {
    const { session, events, delays, drain } = harness();
    session.handle({ type: 'start', solverId: 'nn', points, params: {}, stepsPerSecond: 2 });
    session.handle({ type: 'speed', stepsPerSecond: 0 });
    drain();
    expect(delays).toHaveLength(0);
    expect(events.at(-1)?.type).toBe('done');
  });

  it('paused: true ile duraklatılmış başlar', () => {
    const { session, events, queue } = harness();
    session.handle({ type: 'start', solverId: 'nn', points, params: {}, paused: true });
    expect(queue).toHaveLength(0);
    session.handle({ type: 'step' });
    expect(stepIterations(events)).toEqual([0]);
  });

  it('hızlı duraklat/devam ikinci bir döngü açmaz', () => {
    const { session, queue } = harness();
    session.handle({ type: 'start', solverId: 'ga', points, params: {} });
    session.handle({ type: 'pause' });
    session.handle({ type: 'resume' });
    session.handle({ type: 'pause' });
    session.handle({ type: 'resume' });
    expect(queue).toHaveLength(1);
  });

  it('sınırsız hızda atlanan adımların iyileşmeleri de trace ile gelir', () => {
    const { session, events, drain } = harness();
    session.handle({ type: 'start', solverId: '2opt', points, params: {} });
    drain();
    const trace = events.flatMap((e) => (e.type === 'step' || e.type === 'done' ? e.trace : []));
    const done = events.at(-1);
    if (done?.type !== 'done') throw new Error('done gelmedi');
    // 2-opt her adımda iyileşir: trace, gönderilen adım sayısından fazla nokta içerir
    expect(trace.length).toBeGreaterThan(events.length);
    expect(trace.at(-1)).toEqual({ iteration: done.step.iteration, bestCost: done.step.bestCost });
    for (let i = 1; i < trace.length - 1; i++) expect(trace[i]!.bestCost).toBeLessThan(trace[i - 1]!.bestCost);
  });

  it('NN kısmi turları trace\'e girmez', () => {
    const { session, events, drain } = harness();
    session.handle({ type: 'start', solverId: 'nn', points, params: {} });
    drain();
    const trace = events.flatMap((e) => (e.type === 'step' || e.type === 'done' ? e.trace : []));
    // Tek tam tur → tek nokta (bitişte ikinci kez eklenmez)
    expect(trace).toHaveLength(1);
    expect(trace[0]!.iteration).toBe(points.length - 1);
  });

  it('yeni start eski koşuyu iptal eder', () => {
    const { session, events, drain } = harness();
    session.handle({ type: 'start', solverId: 'ga', points, params: { generations: 1000 } });
    session.handle({ type: 'start', solverId: 'nn', points, params: {} });
    drain();
    const dones = events.filter((e) => e.type === 'done');
    expect(dones).toHaveLength(1);
    expect(dones[0]?.type === 'done' && dones[0].step.iteration).toBe(points.length - 1);
  });
});
