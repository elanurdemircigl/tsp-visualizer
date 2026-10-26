import type { Point, SolverId, SolverParams } from '@tsp/core';
import { solvers } from '@tsp/solvers';
import type { Mode } from './ControlPanel';

/** Paylaşım linkine giren durum. v2'de backend kısa link + kayıt ekler; bu biçim backend'siz çalışır. */
export type ShareState = {
  points: Point[];
  mode: Mode;
  selected: SolverId;
  raceIds: SolverId[];
  params: Record<SolverId, SolverParams>;
  speed: number;
};

type Packed = {
  v: 1;
  p: ([number, number] | [number, number, string])[]; // 5 ondalık ≈ 1 m
  m: Mode;
  s: SolverId;
  r: SolverId[];
  sp: number;
  pr?: Partial<Record<SolverId, SolverParams>>; // yalnızca varsayılandan farklı olanlar
};

const PREFIX = '#s=';
const IDS = Object.keys(solvers) as SolverId[];
const round5 = (x: number) => Math.round(x * 1e5) / 1e5;

async function pipe(bytes: Uint8Array<ArrayBuffer>, stream: CompressionStream | DecompressionStream) {
  const out = new Blob([bytes]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const fromBase64Url = (s: string) =>
  Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

export async function encodeShare(state: ShareState): Promise<string> {
  const pr: Packed['pr'] = {};
  for (const id of IDS) {
    const diff = Object.fromEntries(
      Object.entries(state.params[id]).filter(([k, v]) => solvers[id].defaultParams[k] !== v),
    );
    if (Object.keys(diff).length) pr[id] = diff;
  }
  const packed: Packed = {
    v: 1,
    p: state.points.map((pt) =>
      pt.label ? [round5(pt.lat), round5(pt.lng), pt.label] : [round5(pt.lat), round5(pt.lng)],
    ),
    m: state.mode,
    s: state.selected,
    r: state.raceIds,
    sp: state.speed,
    ...(Object.keys(pr).length ? { pr } : {}),
  };
  const json = new TextEncoder().encode(JSON.stringify(packed));
  return PREFIX + toBase64Url(await pipe(json, new CompressionStream('deflate-raw')));
}

/** Geçersiz veya bozuk linkte null döner (uygulama varsayılanla açılır). */
export async function decodeShare(hash: string): Promise<ShareState | null> {
  if (!hash.startsWith(PREFIX)) return null;
  try {
    const bytes = await pipe(fromBase64Url(hash.slice(PREFIX.length)), new DecompressionStream('deflate-raw'));
    const packed = JSON.parse(new TextDecoder().decode(bytes)) as Packed;
    if (packed.v !== 1 || !Array.isArray(packed.p)) return null;
    const valid = (id: unknown): id is SolverId => IDS.includes(id as SolverId);
    const raceIds = (packed.r ?? []).filter(valid);
    return {
      points: packed.p.map(([lat, lng, label], i) => ({ id: `s${i}`, lat, lng, ...(label ? { label } : {}) })),
      mode: packed.m === 'race' ? 'race' : 'single',
      selected: valid(packed.s) ? packed.s : '2opt',
      raceIds: raceIds.length >= 2 ? raceIds : IDS,
      params: Object.fromEntries(
        IDS.map((id) => [id, { ...solvers[id].defaultParams, ...(packed.pr?.[id] ?? {}) }]),
      ) as Record<SolverId, SolverParams>,
      speed: Number.isFinite(packed.sp) ? packed.sp : 60,
    };
  } catch {
    return null;
  }
}
