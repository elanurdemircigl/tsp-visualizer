import type { Point, SolverStep } from '@tsp/core';
import type { Map as LeafletMap } from 'leaflet';
import { useEffect, useMemo } from 'react';
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { edgeSegments, KONYA_CENTER, tourPath } from './geometry';

export type TourMapProps = {
  points: Point[];
  step?: SolverStep;
  /** Verilirse haritaya tıklamak nokta ekler. */
  onAddPoint?: (lat: number, lng: number) => void;
  /** Verilirse noktaya tıklamak onu siler. */
  onRemovePoint?: (id: string) => void;
  /** Tur rengi (yarış modunda algoritma başına farklı). */
  color?: string;
  /** Sol üst köşe etiketi (yarış modunda algoritma adı). */
  label?: string;
  /** Değiştiğinde harita noktalara sığdırılır (ör. yeni rastgele küme). */
  fitKey?: string | number;
  /** Leaflet haritası hazır olunca çağrılır (bölünmüş haritada senkron için). */
  onReady?: (map: LeafletMap) => void;
};

// Algoritma renklerinden (ui/theme.ts) ayrışsın diye nötr koyu renk.
const HIGHLIGHT_COLOR = '#0f172a';
const KM = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function TourMap({
  points,
  step,
  onAddPoint,
  onRemovePoint,
  color = '#4f46e5',
  label,
  fitKey,
  onReady,
}: TourMapProps) {
  const path = useMemo(() => (step ? tourPath(points, step.tour) : []), [points, step]);
  const highlights = useMemo(() => edgeSegments(points, step?.highlight), [points, step]);
  const start = step?.tour[0];

  return (
    <div className="relative h-full min-h-0 w-full">
      <MapContainer
        center={KONYA_CENTER}
        zoom={13}
        preferCanvas // yüzlerce nokta + saniyede 60 güncelleme için SVG'den hızlı
        className="h-full w-full"
        style={{ cursor: onAddPoint ? 'crosshair' : undefined }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> katkıda bulunanlar'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapHooks onAddPoint={onAddPoint} onReady={onReady} fitKey={fitKey} points={points} />

        {path.length > 1 && <Polyline positions={path} pathOptions={{ color, weight: 3, opacity: 0.85 }} />}
        {highlights.map((seg, i) => (
          <Polyline key={i} positions={seg} pathOptions={{ color: HIGHLIGHT_COLOR, weight: 6, opacity: 0.9 }} />
        ))}

        {points.map((p, i) => (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={i === start ? 7 : 5}
            bubblingMouseEvents={false} // noktaya tıklamak haritaya nokta eklemesin
            pathOptions={{
              color: '#0f172a',
              weight: 1.5,
              fillColor: i === start ? color : '#ffffff',
              fillOpacity: 1,
            }}
            eventHandlers={onRemovePoint ? { click: () => onRemovePoint(p.id) } : undefined}
          >
            {p.label && <Tooltip direction="top">{p.label}</Tooltip>}
          </CircleMarker>
        ))}
      </MapContainer>

      {label && (
        <div className="pointer-events-none absolute top-2 left-12 z-[1000] rounded bg-white/90 px-2 py-1 text-sm shadow">
          <span className="mr-1.5 inline-block size-2.5 rounded-full" style={{ background: color }} />
          <span className="font-medium">{label}</span>
          {step && <span className="ml-2 tabular-nums text-slate-600">{KM.format(step.cost / 1000)} km</span>}
        </div>
      )}
    </div>
  );
}

function MapHooks({
  onAddPoint,
  onReady,
  fitKey,
  points,
}: Pick<TourMapProps, 'onAddPoint' | 'onReady' | 'fitKey' | 'points'>) {
  const map = useMap();
  useMapEvents({
    click: (e) => onAddPoint?.(e.latlng.lat, e.latlng.lng),
  });

  useEffect(() => {
    onReady?.(map);
  }, [map, onReady]);

  // Kap boyutu değişince (ızgara yerleşimi, panel, pencere) Leaflet'e bildir.
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);

  useEffect(() => {
    if (fitKey === undefined || points.length < 2) return;
    // Bir kare bekle: yerleşim oturmadan sığdırılırsa harita çok uzaktan açılır.
    const frame = requestAnimationFrame(() => {
      map.invalidateSize();
      map.fitBounds(
        points.map((p) => [p.lat, p.lng] as [number, number]),
        { padding: [24, 24], animate: false },
      );
    });
    return () => cancelAnimationFrame(frame);
    // Bilerek sadece fitKey'e bağlı: tek nokta eklemek görünümü oynatmasın.
  }, [fitKey, map]);

  return null;
}
