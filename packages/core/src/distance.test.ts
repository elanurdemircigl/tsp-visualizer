import { describe, expect, it } from 'vitest';
import { distanceMatrix, haversine, tourLength } from './distance';
import type { Point } from './types';

const mevlana: Point = { id: 'mevlana', lat: 37.8707, lng: 32.5048 };
const alaaddin: Point = { id: 'alaaddin', lat: 37.8728, lng: 32.4931 };

describe('haversine', () => {
  it('aynı nokta için 0 döner', () => {
    expect(haversine(mevlana, mevlana)).toBe(0);
  });

  it('Mevlana – Alaaddin Tepesi yaklaşık 1 km', () => {
    const d = haversine(mevlana, alaaddin);
    expect(d).toBeGreaterThan(950);
    expect(d).toBeLessThan(1150);
  });

  it('ekvatorda 1 derece boylam ≈ 111.2 km', () => {
    const d = haversine({ id: 'a', lat: 0, lng: 0 }, { id: 'b', lat: 0, lng: 1 });
    expect(d).toBeCloseTo(111_195, -2);
  });
});

describe('distanceMatrix', () => {
  it('simetrik ve köşegeni sıfır', () => {
    const pts = [mevlana, alaaddin, { id: 'x', lat: 37.9, lng: 32.55 }];
    const n = pts.length;
    const dist = distanceMatrix(pts);
    for (let i = 0; i < n; i++) {
      expect(dist[i * n + i]).toBe(0);
      for (let j = 0; j < n; j++) expect(dist[i * n + j]).toBe(dist[j * n + i]);
    }
  });
});

describe('tourLength', () => {
  it('kapalı turu (dönüş dahil) toplar', () => {
    // 4 nokta, kare: kenar 1
    const n = 4;
    const dist = new Float64Array(n * n);
    const set = (i: number, j: number, d: number) => {
      dist[i * n + j] = d;
      dist[j * n + i] = d;
    };
    set(0, 1, 1); set(1, 2, 1); set(2, 3, 1); set(3, 0, 1);
    set(0, 2, Math.SQRT2); set(1, 3, Math.SQRT2);
    expect(tourLength([0, 1, 2, 3], dist, n)).toBe(4);
    expect(tourLength([0, 2, 1, 3], dist, n)).toBeCloseTo(2 + 2 * Math.SQRT2);
  });
});
