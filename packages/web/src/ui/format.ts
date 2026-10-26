const kmFormat = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const intFormat = new Intl.NumberFormat('tr-TR');

/** Metre → "59,65 km" */
export const formatKm = (m: number) => `${kmFormat.format(m / 1000)} km`;

/** 303400 → "303.400" */
export const formatInt = (v: number) => intFormat.format(v);

/** Eksen etiketi: 1, 10, 100, 1k, 10k… */
export const formatTick = (v: number) => (v >= 1000 ? `${formatInt(Math.round(v / 1000))}k` : String(v));

/** [1, max] aralığında 10'un kuvvetleri (log eksen tick'leri). */
export function logTicks(max: number): number[] {
  const ticks: number[] = [];
  for (let t = 1; t <= max; t *= 10) ticks.push(t);
  return ticks;
}
