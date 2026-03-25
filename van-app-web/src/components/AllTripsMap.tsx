"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Trip, LocationPoint } from "@/services/tripService";

// Couleurs distinctes pour chaque voyage
const PALETTE = [
  "#6366f1", // indigo
  "#22c55e", // green
  "#f59e0b", // amber
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#a855f7", // purple
  "#14b8a6", // teal
];

interface TripRoute {
  trip: Trip;
  locations: LocationPoint[];
}

function FitBounds({ routes }: { routes: TripRoute[] }) {
  const map = useMap();
  useEffect(() => {
    const allPoints = routes.flatMap(r =>
      r.locations.map(l => [l.latitude, l.longitude] as [number, number])
    );
    if (allPoints.length > 0) {
      map.fitBounds(allPoints, { padding: [40, 40], maxZoom: 13 });
    }
  }, [routes, map]);
  return null;
}

export default function AllTripsMap({ routes }: { routes: TripRoute[] }) {
  const hasData = routes.some(r => r.locations.length > 0);

  return (
    <MapContainer
      center={[50.85, 4.35]}
      zoom={6}
      style={{ height: "100%", width: "100%", background: "#0f172a" }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {routes.map((route, idx) => {
        if (route.locations.length < 2) return null;
        const color = PALETTE[idx % PALETTE.length];
        const coords = route.locations.map(l => [l.latitude, l.longitude] as [number, number]);
        return (
          <Polyline
            key={route.trip.id}
            positions={coords}
            pathOptions={{ color, weight: 3, opacity: 0.85 }}
          >
            <Tooltip sticky>
              <span className="font-semibold">{route.trip.title}</span>
              <br />
              <span className="text-xs text-gray-500">{route.locations.length} points GPS</span>
            </Tooltip>
          </Polyline>
        );
      })}

      {hasData && <FitBounds routes={routes} />}
    </MapContainer>
  );
}
