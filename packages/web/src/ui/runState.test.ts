import type { SolverStep } from '@tsp/core';
import { describe, expect, it } from 'vitest';
import { applyEvent, initialRun } from './runState';

const step = (iteration: number, bestCost = 100): SolverStep => ({
  iteration,
  tour: [0, 1, 2],
  cost: bestCost,
  bestCost,
  highlight: [[0, 1]],
});
const pt = (iteration: number, bestCost: number) => ({ iteration, bestCost });

describe('applyEvent', () => {
  it('step: son adımı tutar, trace\'i geçmişe ekler', () => {
    let run = initialRun(false);
    run = applyEvent(run, { type: 'step', step: step(5), trace: [pt(0, 200), pt(3, 150)] });
    run = applyEvent(run, { type: 'step', step: step(9), trace: [pt(7, 120)] });
    expect(run.step?.iteration).toBe(9);
    expect(run.history).toEqual([pt(0, 200), pt(3, 150), pt(7, 120)]);
  });

  it('aynı iterasyonu iki kez eklemez', () => {
    let run = initialRun(false);
    run = applyEvent(run, { type: 'step', step: step(2), trace: [pt(2, 100)] });
    run = applyEvent(run, { type: 'step', step: step(2), trace: [pt(2, 100)] });
    expect(run.history).toHaveLength(1);
  });

  it('done: durum, süre, vurgunun temizlenmesi ve son trace', () => {
    const run = applyEvent(initialRun(false), { type: 'done', step: step(9, 80), elapsedMs: 12, trace: [pt(9, 80)] });
    expect(run.status).toBe('done');
    expect(run.elapsedMs).toBe(12);
    expect(run.step?.highlight).toBeUndefined();
    expect(run.history).toEqual([pt(9, 80)]);
  });

  it('error durumu ve mesajı', () => {
    const run = applyEvent(initialRun(true), { type: 'error', message: 'x' });
    expect(run).toMatchObject({ status: 'error', error: 'x' });
  });

  it('çok uzun geçmişi seyreltir, son noktayı korur', () => {
    let run = initialRun(false);
    for (let i = 0; i < 4100; i++) run = applyEvent(run, { type: 'step', step: step(i), trace: [pt(i, 5000 - i)] });
    expect(run.history.length).toBeLessThanOrEqual(4000);
    expect(run.history.at(-1)?.iteration).toBe(4099);
  });
});
