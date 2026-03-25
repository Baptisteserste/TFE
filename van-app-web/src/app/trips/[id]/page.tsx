"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { MapPin, Navigation, ImageIcon, Camera, Clock, Ruler, Timer, Gauge } from "lucide-react";
import Link from "next/link";
import { getLocations, getMedias, LocationPoint, Media } from "@/services/tripService";
import { hasToken } from "@/services/authService";

const TripMap = dynamic(() => import("@/components/TripMap"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-slate-900 text-slate-500">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-4">🗺️</div>
        <p>Chargement de la carte...</p>
      </div>
    </div>
  ),
});

// Formule de Haversine
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function computeStats(locs: LocationPoint[]) {
  if (locs.length < 2) return { distanceKm: 0, durationMin: 0, avgSpeedKmh: 0 };
  let d = 0;
  for (let i = 1; i < locs.length; i++) d += haversineKm(locs[i-1].latitude, locs[i-1].longitude, locs[i].latitude, locs[i].longitude);
  const start = new Date(locs[0].timestamp).getTime();
  const end = new Date(locs[locs.length-1].timestamp).getTime();
  const durationMin = Math.round((end - start) / 60000);
  const avgSpeedKmh = durationMin > 0 ? Math.round((d / durationMin) * 60) : 0;
  return { distanceKm: Math.round(d * 10) / 10, durationMin, avgSpeedKmh };
}

function fmtDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m > 0 ? `${h}h${String(m).padStart(2,'0')}` : `${h}h`;
}

export default function TripDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  
  const [locations, setLocations] = useState<LocationPoint[]>([]);
  const [medias, setMedias] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'gps' | 'photos'>('gps');

  useEffect(() => {
    if (!hasToken()) {
      router.push("/login");
      return;
    }
    
    Promise.all([
      getLocations(id).then(setLocations),
      getMedias(id).then(setMedias)
    ])
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [id, router]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
  const BASE_URL = API_URL.replace('/api', '');

  const latestLocation = locations[locations.length - 1];
  const photos = medias.filter(m => m.image_path);
  const notes = medias.filter(m => !m.image_path && m.description);
  const stats = computeStats(locations);
  
  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-50 overflow-hidden">
      {/* Header */}
      <header className="flex-none border-b border-slate-800 bg-slate-950/80 backdrop-blur-md z-50">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/trips" className="text-slate-400 hover:text-white transition-colors bg-slate-900 border border-slate-800 p-2 rounded-lg">
              <span className="sr-only">Retour</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </Link>
            <div>
              <h1 className="font-bold text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-400" />
                Détail du voyage #{id}
              </h1>
              <div className="text-xs text-indigo-400 font-medium flex items-center gap-1">
                {locations.length} points GPS · {medias.length} médias
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <Link href="/profile" className="text-sm px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg transition-colors font-medium">Profil</Link>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 border-r border-slate-800 bg-slate-950 flex flex-col z-10 shadow-2xl">
          
          {/* Stats */}
          <div className="p-4 border-b border-slate-800 grid grid-cols-2 gap-3">
            {/* Distance */}
            <div className="col-span-2 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 rounded-xl p-3 flex items-center gap-3">
              <div className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg"><Ruler className="w-5 h-5"/></div>
              <div>
                <div className="text-xs text-slate-400">Distance totale</div>
                <div className="font-black text-xl text-white">{isLoading ? '…' : stats.distanceKm} <span className="text-sm text-slate-400 font-normal">km</span></div>
              </div>
            </div>
            {/* Durée */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
              <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg"><Timer className="w-4 h-4"/></div>
              <div>
                <div className="text-xs text-slate-400">Durée</div>
                <div className="font-bold">{isLoading ? '…' : fmtDuration(stats.durationMin)}</div>
              </div>
            </div>
            {/* Vitesse moy */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
              <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg"><Gauge className="w-4 h-4"/></div>
              <div>
                <div className="text-xs text-slate-400">Vitesse moy.</div>
                <div className="font-bold">{isLoading ? '…' : stats.avgSpeedKmh} <span className="text-xs text-slate-500 font-normal">km/h</span></div>
              </div>
            </div>
            {/* Photos */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
              <div className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg"><Camera className="w-4 h-4"/></div>
              <div>
                <div className="text-xs text-slate-400">Photos</div>
                <div className="font-bold">{photos.length}</div>
              </div>
            </div>
            {/* Notes */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
              <div className="p-1.5 bg-violet-500/10 text-violet-400 rounded-lg"><ImageIcon className="w-4 h-4"/></div>
              <div>
                <div className="text-xs text-slate-400">Notes</div>
                <div className="font-bold">{notes.length}</div>
              </div>
            </div>
          </div>


          {/* Tabs */}
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setActiveTab('gps')}
              className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'gps' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Clock className="w-4 h-4" /> Tracé GPS
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'photos' ? 'text-rose-400 border-b-2 border-rose-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Camera className="w-4 h-4" /> Médias {medias.length > 0 && <span className="bg-rose-500/20 text-rose-300 text-xs px-1.5 py-0.5 rounded-full">{medias.length}</span>}
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'gps' && (
              <div className="p-6">
                <ul className="space-y-4 relative before:absolute before:inset-y-0 before:left-[11px] before:w-0.5 before:bg-slate-800">
                  {locations.slice(-10).reverse().map((loc, i) => (
                    <li key={i} className="flex gap-4 relative">
                      <span className={`w-6 h-6 rounded-full border-4 border-slate-950 flex-shrink-0 relative z-10 ${i === 0 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-indigo-500'}`} />
                      <div>
                        <p className={`font-semibold text-sm ${i === 0 ? 'text-emerald-400' : 'text-slate-200'}`}>Lat {loc.latitude.toFixed(4)}</p>
                        <p className={`font-semibold text-sm ${i === 0 ? 'text-emerald-400' : 'text-slate-200'}`}>Lng {loc.longitude.toFixed(4)}</p>
                        <span className="text-xs font-medium text-slate-500">{new Date(loc.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeTab === 'photos' && (
              <div className="p-4 space-y-4">
                {medias.length === 0 && !isLoading && (
                  <div className="text-center text-slate-500 mt-8">
                    <Camera className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Aucun média pour ce voyage.</p>
                  </div>
                )}

                {/* Photos */}
                {photos.map(media => (
                  <div key={media.id} className="group rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={`${BASE_URL}/storage/${media.image_path}`}
                        alt={media.description || "Photo du voyage"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-3">
                      {media.description && <p className="text-sm font-semibold text-white mb-1">{media.description}</p>}
                      <p className="text-xs text-rose-400 font-bold">{new Date(media.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                      <p className="text-xs text-slate-500 mt-0.5">📍 {media.latitude.toFixed(4)}, {media.longitude.toFixed(4)}</p>
                    </div>
                  </div>
                ))}

                {/* Notes textuelles */}
                {notes.map(note => (
                  <div key={note.id} className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">📝</span>
                      <div>
                        <p className="text-sm text-white font-medium">{note.description}</p>
                        <p className="text-xs text-violet-400 font-bold mt-1">{new Date(note.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        <p className="text-xs text-slate-500 mt-0.5">📍 {note.latitude.toFixed(4)}, {note.longitude.toFixed(4)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Real Leaflet Map */}
        <div className="flex-1 relative">
          <TripMap locations={locations} medias={medias} baseUrl={BASE_URL} />
        </div>
      </div>
    </div>
  );
}
