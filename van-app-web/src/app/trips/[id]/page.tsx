"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MapPin, Navigation, Compass, Crosshair } from "lucide-react";
import Link from "next/link";
import { getLocations, LocationPoint } from "@/services/tripService";
import { hasToken } from "@/services/authService";

export default function TripDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  
  const [locations, setLocations] = useState<LocationPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!hasToken()) {
      router.push("/login");
      return;
    }
    
    getLocations(id)
      .then(setLocations)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [id, router]);

  const latestLocation = locations[locations.length - 1];
  
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
                <Compass className="w-5 h-5 text-indigo-400" />
                Détail du voyage #{id}
              </h1>
              <div className="text-xs text-indigo-400 font-medium flex items-center gap-1">
                {locations.length} points GPS collectés
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
        {/* Sidebar content */}
        <aside className="w-80 border-r border-slate-800 bg-slate-950 flex flex-col z-10 shadow-2xl">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-2xl font-black text-white tracking-tight mb-6">Résumé Brut</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg"><MapPin className="w-5 h-5"/></div>
                <div>
                  <div className="text-sm text-slate-400 font-medium">Nb Coordonnées</div>
                  <div className="text-lg font-bold">{locations.length} <span className="text-sm text-slate-500 font-normal">points</span></div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><Navigation className="w-5 h-5"/></div>
                <div>
                  <div className="text-sm text-slate-400 font-medium">Vitesse dernière</div>
                  <div className="text-lg font-bold">{latestLocation?.speed ? Math.round(latestLocation.speed * 3.6) : '--'} <span className="text-sm text-slate-500 font-normal">km/h</span></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            <h3 className="font-semibold text-slate-400 uppercase tracking-wider text-xs mb-4">Derniers points enregistrés</h3>
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
        </aside>

        {/* Map Area Mock */}
        <div className="flex-1 relative bg-slate-900">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
          
          {/* FAKE MAP STYLING */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <Compass className="w-32 h-32 text-slate-800 mb-4 animate-[spin_10s_linear_infinite]" />
            <div className="text-slate-600 font-bold tracking-widest uppercase text-xl">Carte Réel Temps (Simulée)</div>
            {locations.length > 0 ? (
              <div className="mt-4 bg-slate-800 text-slate-300 px-4 py-2 rounded-full text-sm">
                Affiche les tracés de {locations.length} points
              </div>
            ) : (
              <div className="mt-4 text-slate-500 text-sm">Aucune donnée GPS pour le moment.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
