import type { SolverId } from '@tsp/core';

export type AlgoStyle = { color: string; dash?: string };

// Kategorik palet (dataviz doğrulayıcısı, açık zemin, tüm çiftler): normal görüş PASS.
// sa↔ga renk körlüğünde sınırda (ΔE 6.9) → GA kesikli çizgiyle ikincil olarak ayrılır.
export const ALGO_STYLES: Record<SolverId, AlgoStyle> = {
  nn: { color: '#eda100' },
  '2opt': { color: '#2a78d6' },
  sa: { color: '#e34948' },
  ga: { color: '#1baf7a', dash: '6 4' },
};

export const SPEEDS = [
  { label: '1 adım/sn', value: 1 },
  { label: '5 adım/sn', value: 5 },
  { label: '20 adım/sn', value: 20 },
  { label: '60 adım/sn', value: 60 },
  { label: 'Sınırsız', value: 0 },
] as const;
