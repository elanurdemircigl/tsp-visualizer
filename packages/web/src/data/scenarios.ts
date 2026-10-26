import type { Point } from '@tsp/core';

// Koordinatlar OpenStreetMap Nominatim aramasından (2026-10-26). © OpenStreetMap katkıda bulunanlar, ODbL.
// Japon Parkı: aynı adlı tramvay durağının konumu (park durağın yanında).

const P = (id: string, label: string, lat: number, lng: number): Point => ({ id, label, lat, lng });

const historic: Point[] = [
  P('mevlana', 'Mevlana Müzesi', 37.87096, 32.50571),
  P('selimiye', 'Selimiye Camii', 37.8704, 32.50414),
  P('aziziye', 'Aziziye Camii', 37.86998, 32.5008),
  P('sems', 'Şems-i Tebrizi Camii', 37.87368, 32.49755),
  P('alaeddin', 'Alaeddin Camii', 37.87343, 32.49279),
  P('kulturpark', 'Kültürpark', 37.87514, 32.48918),
];

const campuses: Point[] = [
  P('selcuk', 'Selçuk Üniversitesi', 38.02421, 32.50571),
  P('ktun', 'Konya Teknik Üniversitesi', 38.0064, 32.51526),
  P('neu', 'NEÜ Köyceğiz Yerleşkesi', 37.86466, 32.41531),
  P('gidatarim', 'Konya Gıda ve Tarım Üniversitesi', 37.87463, 32.47396),
  P('kto', 'KTO Karatay Üniversitesi', 37.86482, 32.53692),
];

const landmarks: Point[] = [
  P('japon', 'Japon Parkı', 37.97691, 32.51619),
  P('bilim', 'Konya Bilim Merkezi', 37.98697, 32.59345),
  P('kelebek', 'Tropikal Kelebek Bahçesi', 37.94858, 32.46197),
  P('sille', 'Sille', 37.92821, 32.41847),
  P('gar', 'Konya Tren Garı', 37.86646, 32.47678),
  P('stadyum', 'Konya Büyükşehir Stadyumu', 37.94613, 32.4889),
];

export type Scenario = { id: string; name: string; points: Point[] };

export const SCENARIOS: Scenario[] = [
  { id: 'tarihi', name: 'Tarihi merkez (6)', points: historic },
  { id: 'kampus', name: 'Üniversite kampüsleri (5)', points: campuses },
  { id: 'konya', name: 'Konya turu (17)', points: [...historic, ...campuses, ...landmarks] },
];
