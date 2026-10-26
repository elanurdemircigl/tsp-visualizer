import type { Point, SolverStep } from '@tsp/core';
import type { Map as LeafletMap } from 'leaflet';
import { useCallback, useEffect, useRef } from 'react';
import { TourMap } from './TourMap';

export type Lane = {
  id: string;
  label: string;
  color: string;
  step?: SolverStep;
};

export type SplitMapProps = {
  points: Point[];
  lanes: Lane[]; // 2–4
  fitKey?: string | number;
};

/** Yarış modu: aynı nokta kümesi, algoritma başına bir harita; kaydırma/yakınlaştırma senkron. */
export function SplitMap({ points, lanes, fitKey }: SplitMapProps) {
  const maps = useRef(new Map<string, LeafletMap>());
  const syncing = useRef(false);

  const register = useCallback((id: string, map: LeafletMap) => {
    if (maps.current.get(id) === map) return;
    maps.current.set(id, map);
    map.on('move', () => {
      if (syncing.current) return;
      syncing.current = true;
      for (const [otherId, other] of maps.current) {
        if (otherId !== id) other.setView(map.getCenter(), map.getZoom(), { animate: false });
      }
      syncing.current = false;
    });
  }, []);

  // Yarıştan çıkan algoritmanın haritasını kayıttan düş.
  useEffect(() => {
    const ids = new Set(lanes.map((l) => l.id));
    for (const id of maps.current.keys()) if (!ids.has(id)) maps.current.delete(id);
  }, [lanes]);

  const cols = lanes.length <= 2 ? 'grid-cols-2 grid-rows-1' : 'grid-cols-2 grid-rows-2';

  return (
    <div className={`grid h-full w-full gap-1 bg-slate-300 ${cols}`}>
      {lanes.map((lane) => (
        <TourMap
          key={lane.id}
          points={points}
          step={lane.step}
          color={lane.color}
          label={lane.label}
          fitKey={fitKey}
          onReady={(map) => register(lane.id, map)}
        />
      ))}
    </div>
  );
}
