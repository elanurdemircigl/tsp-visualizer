import type { SolverId, SolverParams } from '@tsp/core';
import { solvers } from '@tsp/solvers';
import { describe, expect, it } from 'vitest';
import { randomPoints } from '../map/geometry';
import { decodeShare, encodeShare, type ShareState } from './share';

const IDS = Object.keys(solvers) as SolverId[];
const defaults = () =>
  Object.fromEntries(IDS.map((id) => [id, { ...solvers[id].defaultParams }])) as Record<SolverId, SolverParams>;

const base = (): ShareState => ({
  points: [
    { id: 'a', lat: 37.870961234, lng: 32.505711234, label: 'Mevlana Müzesi' },
    { id: 'b', lat: 37.87259, lng: 32.49221 },
  ],
  mode: 'race',
  selected: 'sa',
  raceIds: ['2opt', 'ga'],
  params: { ...defaults(), sa: { ...solvers.sa.defaultParams, coolingRate: 0.99 } },
  speed: 5,
});

describe('paylaşım linki', () => {
  it('gidiş-dönüş: noktalar (5 ondalık), etiketler, mod ve parametreler korunur', async () => {
    const link = await encodeShare(base());
    expect(link.startsWith('#s=')).toBe(true);
    expect(link).toMatch(/^#s=[A-Za-z0-9_-]+$/); // URL'de kaçış gerektirmez
    const back = await decodeShare(link);
    expect(back).toMatchObject({ mode: 'race', selected: 'sa', raceIds: ['2opt', 'ga'], speed: 5 });
    expect(back!.points).toEqual([
      { id: 's0', lat: 37.87096, lng: 32.50571, label: 'Mevlana Müzesi' },
      { id: 's1', lat: 37.87259, lng: 32.49221 },
    ]);
    expect(back!.params.sa!.coolingRate).toBe(0.99);
    expect(back!.params.ga).toEqual(solvers.ga.defaultParams);
  });

  it('500 nokta makul uzunlukta bir link üretir', async () => {
    const link = await encodeShare({ ...base(), points: randomPoints(500) });
    expect(link.length).toBeLessThan(8000);
  });

  it('bozuk veya yabancı hash için null döner', async () => {
    expect(await decodeShare('')).toBeNull();
    expect(await decodeShare('#baska')).toBeNull();
    expect(await decodeShare('#s=bozukveri!!')).toBeNull();
  });
});
