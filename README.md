# TSP Algoritma Görselleştirici

Konya haritası üzerinde Gezgin Satıcı Problemi (TSP) için sezgisel algoritmaları adım adım canlı çalıştıran ve yan yana yarıştıran web uygulaması.

> 🚧 Faz 0 — iskelet. Canlı demo, GIF ve benchmark tablosu MVP ile eklenecek.

## Kurulum

```sh
pnpm install
pnpm dev
```

## Yapı

```
packages/
  core/      # tipler (types.ts) + haversine mesafe matrisi
  solvers/   # NN, 2-opt, SA, GA çözücüleri
  web/       # React + Leaflet uygulaması (map/, ui/, worker/)
e2e/         # Playwright testleri
```

Geliştirme kuralları ve ajan rolleri için bkz. [AGENTS.md](AGENTS.md).
