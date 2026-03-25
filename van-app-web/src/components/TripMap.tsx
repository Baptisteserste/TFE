"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocationPoint, Media } from "@/services/tripService";

// Fix Leaflet default icon paths broken by webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const startIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const endIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const photoIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

/** Ajuste le zoom pour englober tout le tracé */
function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 1) {
      map.fitBounds(coords, { padding: [40, 40] });
    } else if (coords.length === 1) {
      map.setView(coords[0], 14);
    }
  }, [coords, map]);
  return null;
}

interface TripMapProps {
  locations: LocationPoint[];
  medias: Media[];
  baseUrl: string;
}

export default function TripMap({ locations, medias, baseUrl }: TripMapProps) {
  const coords: [number, number][] = locations.map(l => [l.latitude, l.longitude]);
  const first = coords[0];
  const last = coords[coords.length - 1];

  const defaultCenter: [number, number] = first ?? [50.85045, 4.34878];

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBounds coords={coords} />

      {/* Tracé GPS */}
      {coords.length > 1 && (
        <Polyline positions={coords} color="#EF4444" weight={5} opacity={0.9} />
      )}

      {/* Marqueur départ */}
      {first && (
        <Marker position={first} icon={startIcon}>
          <Popup>🚀 Départ</Popup>
        </Marker>
      )}

      {/* Marqueur arrivée */}
      {last && coords.length > 1 && (
        <Marker position={last} icon={endIcon}>
          <Popup>🏁 Arrivée</Popup>
        </Marker>
      )}

      {/* Marqueurs photos / notes */}
      {medias.map(media => (
        <Marker
          key={media.id}
          position={[media.latitude, media.longitude]}
          icon={photoIcon}
        >
          <Popup>
            <div className="text-sm max-w-[200px]">
              {media.image_path && (
                <img
                  src={`${baseUrl}/storage/${media.image_path}`}
                  alt="Photo"
                  className="w-full rounded mb-2 object-cover max-h-32"
                />
              )}
              {media.description && <p className="font-semibold">{media.description}</p>}
              <p className="text-slate-500 text-xs mt-1">
                {new Date(media.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
