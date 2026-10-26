import type { Point } from './types';

const EARTH_RADIUS_M = 6_371_008.8;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** İki nokta arasındaki kuş uçuşu mesafe (metre). */
export function haversine(a: Point, b: Point): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** n×n satır-öncelikli simetrik mesafe matrisi: dist[i * n + j]. */
export function distanceMatrix(points: Point[]): Float64Array {
  const n = points.length;
  const dist = new Float64Array(n * n);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = haversine(points[i]!, points[j]!);
      dist[i * n + j] = d;
      dist[j * n + i] = d;
    }
  }
  return dist;
}

/** Kapalı turun toplam uzunluğu (son noktadan başa dönüş dahil). */
export function tourLength(tour: number[], dist: Float64Array, n: number): number {
  let total = 0;
  for (let k = 0; k < tour.length; k++) {
    const from = tour[k]!;
    const to = tour[(k + 1) % tour.length]!;
    total += dist[from * n + to]!;
  }
  return total;
}
