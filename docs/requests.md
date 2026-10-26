# Ajanlar arası istekler

Başka bir ajanın klasöründe değişiklik gerekiyorsa buraya yazın. Format:

```
- [ ] (isteyen → sahibi) Kısa açıklama — neden gerekli
```

## Açık istekler

_(henüz yok)_

## Duyurular (types.ts değişiklikleri)

- 2026-10-26 — İlk sürüm: `Point`, `SolverId`, `SolverStep`, `Solver`, `WorkerCommand`, `WorkerEvent`.
- 2026-10-26 — `WorkerCommand.start`'a `stepsPerSecond?` ve `paused?` eklendi; yeni `speed` komutu (hız ayarı).
  Hız sınırlıyken her çözücü adımı UI'a gönderilir; sınırsızken en fazla saniyede 60.
- 2026-10-26 — `step` ve `done` olaylarına `trace: TracePoint[]` eklendi. Worker, atlanan adımlar dahil
  en iyi maliyetin düştüğü anları kaydeder; yakınsama grafiği bundan çizilir (hızlı çözücülerde grafik boş kalmasın).
