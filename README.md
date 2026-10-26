# TSP Algoritma Görselleştirici

Konya haritası üzerinde Gezgin Satıcı Problemi (TSP) için sezgisel algoritmaları adım adım canlı çalıştıran ve yan yana yarıştıran web uygulaması.

**Canlı demo:** https://elanurdemircigl.github.io/tsp-visualizer/

> 🚧 Faz 1 tamamlandı: 4 algoritma, harita, kontrol paneli, yakınsama grafiği ve yarış modu. GIF ve benchmark tablosu sonraki fazda.

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
