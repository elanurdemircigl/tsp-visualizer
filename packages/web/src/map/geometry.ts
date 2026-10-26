import type { Point } from '@tsp/core';

export type LatLng = [number, number];

/** Konya merkezini kapsayan ~10 km'lik kutu (rastgele nokta üretimi için). */
export const KONYA_BOUNDS = { south: 37.83, north: 37.92, west: 32.43, east: 32.56 };
export const KONYA_CENTER: LatLng = [37.8728, 32.4931];

/**
 * Tur sırasına göre çizgi koordinatları. Tur tüm noktaları içeriyorsa başa dönülür;
 * kısmi turda (ör. En Yakın Komşu kurulurken) yol açık bırakılır.
 */
export function tourPath(points: Point[], tour: number[]): LatLng[] {
  const path: LatLng[] = [];
  for (const i of tour) {
    const p = points[i];
    if (p) path.push([p.lat, p.lng]);
  }
  if (path.length > 2 && tour.length === points.length) path.push(path[0]!);
  return path;
}

/** Vurgulanan kenarların (nokta indeksi çiftleri) çizgi parçaları. */
export function edgeSegments(points: Point[], edges: [number, number][] = []): LatLng[][] {
  const segments: LatLng[][] = [];
  for (const [a, b] of edges) {
    const p = points[a];
    const q = points[b];
    if (p && q) segments.push([[p.lat, p.lng], [q.lat, q.lng]]);
  }
  return segments;
}

/** Kutunun içinde n rastgele nokta. */
export function randomPoints(
  n: number,
  rand: () => number = Math.random,
  bounds = KONYA_BOUNDS,
): Point[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `r${i}`,
    lat: bounds.south + rand() * (bounds.north - bounds.south),
    lng: bounds.west + rand() * (bounds.east - bounds.west),
  }));
}
