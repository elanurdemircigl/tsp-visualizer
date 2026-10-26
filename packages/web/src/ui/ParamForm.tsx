import type { SolverId, SolverParams } from '@tsp/core';
import { useEffect, useState } from 'react';
import { PARAM_META, type ParamMeta } from './paramMeta';

type Props = {
  solverId: SolverId;
  values: SolverParams;
  onChange: (values: SolverParams) => void;
  disabled?: boolean;
};

/** Algoritmaya göre dinamik parametre formu (alanlar PARAM_META'dan). */
export function ParamForm({ solverId, values, onChange, disabled }: Props) {
  return (
    <div className="grid gap-2">
      {Object.entries(PARAM_META[solverId]).map(([key, meta]) => (
        <NumberField
          key={key}
          meta={meta}
          value={values[key]!}
          disabled={disabled}
          onCommit={(v) => onChange({ ...values, [key]: v })}
        />
      ))}
    </div>
  );
}

/** Yazarken serbest; odaktan çıkınca (veya Enter) sınırlara çekip kaydeder. */
function NumberField({
  meta,
  value,
  disabled,
  onCommit,
}: {
  meta: ParamMeta;
  value: number;
  disabled?: boolean;
  onCommit: (v: number) => void;
}) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);

  const commit = () => {
    const v = Number(text.replace(',', '.'));
    if (!Number.isFinite(v)) return setText(String(value));
    const clamped = Math.min(meta.max, Math.max(meta.min, v));
    setText(String(clamped));
    if (clamped !== value) onCommit(clamped);
  };

  return (
    <label className="grid gap-0.5 text-sm">
      <span className="text-slate-700" title={meta.help}>
        {meta.label}
        <span className="ml-1 text-xs text-slate-400">
          ({meta.min}–{meta.max})
        </span>
      </span>
      <input
        inputMode="decimal"
        className="rounded border border-slate-300 bg-white px-2 py-1 tabular-nums disabled:bg-slate-100 disabled:text-slate-500"
        value={text}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
      />
    </label>
  );
}
