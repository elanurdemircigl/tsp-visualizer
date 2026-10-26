import type { SolverId } from '@tsp/core';

export type ParamMeta = { label: string; min: number; max: number; step: number; help?: string };

/** Parametre formunun alanları; anahtarlar çözücülerin defaultParams'ı ile aynı. */
export const PARAM_META: Record<SolverId, Record<string, ParamMeta>> = {
  nn: {
    start: { label: 'Başlangıç noktası', min: 0, max: 499, step: 1, help: 'Turun başladığı noktanın sırası' },
  },
  '2opt': {
    maxPasses: { label: 'En fazla geçiş', min: 1, max: 1000, step: 1, help: 'Tüm kenar çiftlerinin taranma sayısı' },
  },
  sa: {
    initialTemp: { label: 'Başlangıç sıcaklığı (m)', min: 10, max: 10000, step: 10 },
    coolingRate: { label: 'Soğuma oranı', min: 0.9, max: 0.9999, step: 0.0005, help: 'Her seviyede T ← T × oran' },
    minTemp: { label: 'Bitiş sıcaklığı (m)', min: 0.01, max: 100, step: 0.1 },
    iterationsPerTemp: { label: 'Sıcaklık başına deneme', min: 10, max: 2000, step: 10 },
    seed: { label: 'Seed', min: 0, max: 99999, step: 1 },
  },
  ga: {
    populationSize: { label: 'Popülasyon', min: 10, max: 500, step: 10 },
    generations: { label: 'Nesil sayısı', min: 10, max: 5000, step: 10 },
    mutationRate: { label: 'Mutasyon oranı', min: 0, max: 1, step: 0.01 },
    eliteCount: { label: 'Elit birey', min: 0, max: 20, step: 1 },
    tournamentSize: { label: 'Turnuva boyutu', min: 2, max: 20, step: 1 },
    seed: { label: 'Seed', min: 0, max: 99999, step: 1 },
  },
};
