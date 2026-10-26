# AGENTS.md — Tüm ajanların ortak kuralları

Bu repo birden fazla kodlama ajanının (veya geliştiricinin) paralel çalışacağı şekilde bölünmüştür.
Modüller arasındaki **tek bağ** `packages/core/src/types.ts` dosyasıdır.

## Roller ve klasör sahipliği

| Ajan | Yazabildiği klasörler | Dal |
|---|---|---|
| 1. Koordinatör (Mimar) | `packages/core/`, kök dosyalar, `AGENTS.md` | `main` |
| 2. Algoritma | `packages/solvers/`, `packages/web/src/worker/` | `agent/solvers` |
| 3. Harita & Animasyon | `packages/web/src/map/` | `agent/map` |
| 4. UI & Grafik | `packages/web/src/ui/` | `agent/ui` |
| 5. Backend (v2) | `backend/` | `agent/backend` |
| 6. Test & QA | `e2e/`, `benchmarks/` | `agent/qa` |
| 7. DevOps & Doküman | `.github/`, `docs/`, `README.md` | `agent/devops` |

Her ajan tüm repoyu **okuyabilir**, ama yalnızca kendi klasörlerine **yazar**.

Tek kişilik geliştirmede aynı anda **en fazla 3 ajan** çalışır (Faz 1: Algoritma, Harita, UI).
QA ve DevOps işlerini (E2E, benchmark, deploy) Koordinatör yürütür; Backend ajanı v2'de başlar.

## Kurallar

1. Her ajan kendi dalında çalışır ve PR ile `main`'e birleşir; birleştirmeyi Koordinatör yapar.
2. Başka ajanın klasörüne dokunmak yasak. İhtiyaç varsa `docs/requests.md` dosyasına not düşülür.
3. `packages/core/src/types.ts` sadece Koordinatör tarafından değiştirilir; değişiklik `docs/requests.md`'de duyurulur.
4. Harita ve UI ajanları gerçek çözücü hazır olana kadar sahte (mock) `SolverStep` akışı kullanır.
5. Her PR: `pnpm test` ve `pnpm typecheck` geçmeli, kısa özet + (UI değişikliğiyse) ekran görüntüsü içermeli.

## Sözleşme özeti

- Her çözücü `Solver` arayüzünü uygular ve `solve()` bir `Generator<SolverStep>` döndürür.
- Mesafe matrisi `Float64Array`, satır-öncelikli: `dist[i * n + j]` (metre). `@tsp/core` içindeki `distanceMatrix()` ile üretilir.
- Worker protokolü `WorkerCommand` / `WorkerEvent` tipleridir. Worker `step` olaylarını **en fazla saniyede 60** gönderir;
  çözücü daha hızlı adım üretirse aradaki adımlar atlanır, sadece en güncel adım gönderilir.
  Worker iletişimi düz `postMessage` ile yapılır (Comlink kullanılmaz).
- Yarış modunda her algoritma **ayrı bir Worker**'da çalışır; hepsine aynı nokta kümesi gönderilir.
- Rastgelelik kullanan çözücüler (SA, GA) `seed` parametresi alır; aynı seed aynı sonucu verir.

## Komutlar

```sh
pnpm install
pnpm dev        # web uygulaması
pnpm test       # tüm paketlerin testleri
pnpm typecheck
```

## "Bitti" tanımı (ajan prompt'larına eklenir)

Her ajan prompt'u şunları içerir: rolü, yazabildiği klasörler, okuyabileceği dosyalar ve ölçülebilir bir "bitti" tanımı.
Örnek (Algoritma ajanı): `pnpm test` geçiyor; 10 noktalı bilinen örnekte 2-opt, En Yakın Komşu'dan kısa tur buluyor;
200 nokta için NN + 2-opt 2 saniyenin altında bitiyor; SA ve GA varsayılan parametrelerle
(SA ≈ 300 bin hamle, GA 500 nesil × 100 birey) 200 noktada 5 saniyenin altında bitiyor.
