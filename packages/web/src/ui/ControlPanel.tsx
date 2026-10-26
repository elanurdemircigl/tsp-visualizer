import type { SolverId, SolverParams } from '@tsp/core';
import { solvers } from '@tsp/solvers';
import type { ReactNode } from 'react';
import { ParamForm } from './ParamForm';
import { ALGO_STYLES, SPEEDS } from './theme';

export type Mode = 'single' | 'race';

export type ControlPanelProps = {
  pointCount: number;
  randomN: number;
  onRandomNChange: (n: number) => void;
  onRandom: () => void;
  onClear: () => void;

  mode: Mode;
  onModeChange: (mode: Mode) => void;
  selected: SolverId;
  onSelectedChange: (id: SolverId) => void;
  raceIds: SolverId[];
  onRaceIdsChange: (ids: SolverId[]) => void;
  params: Record<SolverId, SolverParams>;
  onParamsChange: (id: SolverId, values: SolverParams) => void;

  speed: number;
  onSpeedChange: (speed: number) => void;
  isRunning: boolean;
  isPaused: boolean;
  hasRuns: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStep: () => void;
  onReset: () => void;
};

const IDS = Object.keys(solvers) as SolverId[];

export function ControlPanel(p: ControlPanelProps) {
  const active = p.mode === 'single' ? [p.selected] : p.raceIds;
  const locked = p.isRunning || p.isPaused; // koşu sürerken parametre değişmez
  const canStart = p.pointCount >= 2 && active.length >= (p.mode === 'race' ? 2 : 1);

  return (
    <div className="grid gap-5 p-4">
      <Section title="Noktalar">
        <p className="text-sm text-slate-600">
          <span className="font-semibold tabular-nums text-slate-900" data-testid="point-count">
            {p.pointCount}
          </span>{' '}
          nokta
          {p.mode === 'single' && <span className="block text-xs text-slate-400">Haritaya tıkla: ekle · noktaya tıkla: sil</span>}
        </p>
        <label className="grid gap-1 text-sm text-slate-700">
          <span className="flex justify-between">
            Rastgele nokta sayısı <span className="tabular-nums">{p.randomN}</span>
          </span>
          <input
            type="range"
            min={10}
            max={500}
            step={10}
            value={p.randomN}
            onChange={(e) => p.onRandomNChange(Number(e.target.value))}
          />
        </label>
        <div className="flex gap-2">
          <Button onClick={p.onRandom}>Rastgele üret</Button>
          <Button onClick={p.onClear}>Temizle</Button>
        </div>
      </Section>

      <Section title="Mod">
        <div className="grid grid-cols-2 rounded-md border border-slate-300 p-0.5 text-sm" role="radiogroup">
          {(['single', 'race'] as const).map((m) => (
            <button
              key={m}
              role="radio"
              aria-checked={p.mode === m}
              className={`rounded px-2 py-1 ${p.mode === m ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
              onClick={() => p.onModeChange(m)}
              disabled={locked}
            >
              {m === 'single' ? 'Tek algoritma' : 'Yarış'}
            </button>
          ))}
        </div>
      </Section>

      <Section title={p.mode === 'single' ? 'Algoritma' : 'Yarışacaklar (2–4)'}>
        {p.mode === 'single' ? (
          <select
            aria-label="Algoritma"
            className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
            value={p.selected}
            disabled={locked}
            onChange={(e) => p.onSelectedChange(e.target.value as SolverId)}
          >
            {IDS.map((id) => (
              <option key={id} value={id}>
                {solvers[id].name}
              </option>
            ))}
          </select>
        ) : (
          <div className="grid gap-1 text-sm">
            {IDS.map((id) => (
              <label key={id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={p.raceIds.includes(id)}
                  disabled={locked}
                  onChange={(e) =>
                    p.onRaceIdsChange(e.target.checked ? IDS.filter((x) => x === id || p.raceIds.includes(x)) : p.raceIds.filter((x) => x !== id))
                  }
                />
                <span className="inline-block size-2.5 rounded-full" style={{ background: ALGO_STYLES[id].color }} />
                {solvers[id].name}
              </label>
            ))}
          </div>
        )}
      </Section>

      <Section title="Parametreler">
        {active.map((id) =>
          p.mode === 'single' ? (
            <ParamForm key={id} solverId={id} values={p.params[id]} disabled={locked} onChange={(v) => p.onParamsChange(id, v)} />
          ) : (
            <details key={id} className="rounded border border-slate-200 px-2 py-1">
              <summary className="cursor-pointer text-sm text-slate-700">{solvers[id].name}</summary>
              <div className="py-2">
                <ParamForm solverId={id} values={p.params[id]} disabled={locked} onChange={(v) => p.onParamsChange(id, v)} />
              </div>
            </details>
          ),
        )}
      </Section>

      <Section title="Çalıştır">
        <label className="grid gap-1 text-sm text-slate-700">
          Hız
          <select
            aria-label="Hız"
            className="rounded border border-slate-300 bg-white px-2 py-1"
            value={p.speed}
            onChange={(e) => p.onSpeedChange(Number(e.target.value))}
          >
            {SPEEDS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {p.isRunning ? (
            <Button primary onClick={p.onPause}>Duraklat</Button>
          ) : p.isPaused ? (
            <Button primary onClick={p.onResume}>Devam</Button>
          ) : (
            <Button primary onClick={p.onStart} disabled={!canStart}>Başlat</Button>
          )}
          <Button onClick={p.onStep} disabled={p.isRunning || !canStart}>Adım</Button>
          <Button onClick={p.onReset} disabled={!p.hasRuns}>Sıfırla</Button>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-2">
      <h2 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{title}</h2>
      {children}
    </section>
  );
}

function Button({
  primary,
  ...props
}: { primary?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-40 ${
        primary ? 'bg-slate-900 text-white hover:bg-slate-700' : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
      }`}
    />
  );
}
