import type { Point } from '@tsp/core';
import { describe, expect, it } from 'vitest';
import { edgeSegments, KONYA_BOUNDS, randomPoints, tourPath } from './geometry';

const pts: Point[] = [
  { id: 'a', lat: 1, lng: 10 },
  { id: 'b', lat: 2, lng: 20 },
  { id: 'c', lat: 3, lng: 30 },
];

describe('tourPath', () => {
  it('tam turu başa dönerek kapatır', () => {
    expect(tourPath(pts, [2, 0, 1])).toEqual([[3, 30], [1, 10], [2, 20], [3, 30]]);
  });

  it('kısmi turu açık bırakır', () => {
    expect(tourPath(pts, [0, 2])).toEqual([[1, 10], [3, 30]]);
  });

  it('geçersiz indeksleri atlar (noktalar değişirken gelen eski adım)', () => {
    expect(tourPath(pts, [0, 7])).toEqual([[1, 10]]);
  });
});

describe('edgeSegments', () => {
  it('kenar çiftlerini koordinata çevirir', () => {
    expect(edgeSegments(pts, [[0, 2]])).toEqual([[[1, 10], [3, 30]]]);
    expect(edgeSegments(pts)).toEqual([]);
  });
});

describe('randomPoints', () => {
  it('kutunun içinde benzersiz id ile n nokta üretir', () => {
    const r = randomPoints(50);
    expect(r).toHaveLength(50);
    expect(new Set(r.map((p) => p.id)).size).toBe(50);
    for (const p of r) {
      expect(p.lat).toBeGreaterThanOrEqual(KONYA_BOUNDS.south);
      expect(p.lat).toBeLessThanOrEqual(KONYA_BOUNDS.north);
      expect(p.lng).toBeGreaterThanOrEqual(KONYA_BOUNDS.west);
      expect(p.lng).toBeLessThanOrEqual(KONYA_BOUNDS.east);
    }
  });
});
