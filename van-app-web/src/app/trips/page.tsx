"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { MapPin, Calendar, ChevronRight, Compass, Ruler, Camera, Globe, Zap, Map } from "lucide-react";
import { getTrips, getLocations, Trip, LocationPoint } from "@/services/tripService";
import { hasToken } from "@/services/authService";
import { useRouter } from "next/navigation";

const AllTripsMap = dynamic(() => import("@/components/AllTripsMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-slate-500 text-sm">
      <span className="animate-spin mr-2">🗺️</span> Chargement de la carte...
    </div>
  ),
});

interface TripRoute { trip: Trip; locations: LocationPoint[]; }

export default function TripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [routes, setRoutes] = useState<TripRoute[]>([]);
  const [showMap, setShowMap] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!hasToken()) { router.push("/login"); return; }
    getTrips().then(async (data) => {
      setTrips(data);
      // Charge les points GPS de chaque voyage en parallèle
      const routeData = await Promise.all(
        data.map(async (trip) => {
          try {
            const locations = await getLocations(trip.id);
            return { trip, locations };
          } catch {
            return { trip, locations: [] };
          }
        })
      );
      setRoutes(routeData.filter(r => r.locations.length > 0));
    })
    .catch(console.error)
    .finally(() => setIsLoading(false));
  }, [router]);

  const completed = trips.filter(t => t.status === 'completed').length;
  const active    = trips.filter(t => t.status === 'active').length;
  const filteredTrips = trips
    .filter(t => filter === 'all' || t.status === filter)
    .filter(t => t.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-indigo-400">
            <Compass className="w-6 h-6" /> VanApp
          </Link>
          <div className="flex gap-4">
            <Link href="/profile" className="text-slate-400 hover:text-white font-medium transition-colors">Profil</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">

        {/* Hero titre */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Mes Trajets</h1>
          <p className="text-slate-400 text-lg">Votre carnet de voyage connecté — tous vos souvenirs en un seul endroit.</p>
        </div>

        {/* Global stats banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/30 rounded-2xl p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-indigo-300">
              <Globe className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Total voyages</span>
            </div>
            <div className="text-4xl font-black text-white">{isLoading ? '…' : trips.length}</div>
            <div className="text-xs text-slate-400">{completed} terminé{completed > 1 ? 's' : ''} · {active} en cours</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-emerald-400">
              <Zap className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Actifs</span>
            </div>
            <div className="text-3xl font-black text-white">{active}</div>
            <div className="text-xs text-slate-500">voyage{active > 1 ? 's' : ''} en cours</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-rose-400">
              <Camera className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Terminés</span>
            </div>
            <div className="text-3xl font-black text-white">{completed}</div>
            <div className="text-xs text-slate-500">voyage{completed > 1 ? 's' : ''} archivé{completed > 1 ? 's' : ''}</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-amber-400">
              <Ruler className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Depuis</span>
            </div>
            <div className="text-xl font-black text-white">
              {trips.length > 0
                ? new Date(trips[trips.length - 1].start_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
                : '—'}
            </div>
            <div className="text-xs text-slate-500">premier voyage</div>
          </div>
        </div>

        {/* Carte mondiale de tous les voyages */}
        {routes.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-200">
                <Map className="w-5 h-5 text-indigo-400" />
                Carte de tous mes voyages
                <span className="text-xs text-slate-500 font-normal ml-1">{routes.length} tracé{routes.length > 1 ? 's' : ''}</span>
              </h2>
              <button
                onClick={() => setShowMap(v => !v)}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showMap ? '▲ Réduire' : '▼ Afficher'}
              </button>
            </div>
            {showMap && (
              <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-2xl" style={{ height: '380px' }}>
                <AllTripsMap routes={routes} />
              </div>
            )}
          </div>
        )}

        {/* Liste des voyages */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-200">Tous les voyages</h2>
          {active > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {active} en cours
            </span>
          )}
        </div>

        {/* Barre de recherche */}
        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un voyage..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors text-lg">×</button>
          )}
        </div>

        {/* Filtres */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['all', 'active', 'completed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                filter === f
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
              }`}
            >
              {f === 'all' ? `🗂️ Tous (${trips.length})` : f === 'active' ? `🟢 En cours (${active})` : `✅ Terminés (${completed})`}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-slate-900 border border-slate-800 rounded-2xl" />
            ))}
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800">
            <MapPin className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Aucun voyage {filter === 'active' ? 'en cours' : filter === 'completed' ? 'terminé' : ''} trouvé.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTrips.map((trip) => (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="group bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 transition-all hover:bg-slate-900 shadow-lg flex items-center justify-between"
              >
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
                    trip.status === 'active'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                  }`}>
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-xl font-bold group-hover:text-indigo-400 transition-colors">{trip.title}</h2>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        trip.status === 'active'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}>
                        {trip.status === 'active' ? '🟢 En cours' : '✅ Terminé'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                      <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(trip.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      {trip.end_date && (
                        <span className="flex items-center gap-1.5 text-slate-600">→ {new Date(trip.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-slate-600 group-hover:text-indigo-400 transition-colors hidden sm:block">
                  <ChevronRight className="w-6 h-6" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
