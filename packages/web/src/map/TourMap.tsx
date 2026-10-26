import type { Point, SolverStep } from '@tsp/core';
import { MapContainer, TileLayer } from 'react-leaflet';

// Konya merkez (Alaaddin Tepesi civarı)
const KONYA_CENTER: [number, number] = [37.8728, 32.4931];

export type TourMapProps = {
  points: Point[];
  step?: SolverStep;
};

// Faz 0 iskeleti: sadece harita. Nokta ekleme, tur çizimi ve vurgulama Harita ajanının işi.
export function TourMap(_props: TourMapProps) {
  return (
    <MapContainer center={KONYA_CENTER} zoom={13} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> katkıda bulunanlar'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  );
}
