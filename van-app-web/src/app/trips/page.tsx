import Link from "next/link";
import { MapPin, Calendar, Clock, ChevronRight, Compass } from "lucide-react";

// Fake data for visual mockup
const TRIPS = [
  {
    id: 1,
    title: "Voyage en Bretagne",
    status: "Terminé",
    date: "12 Oct 2023",
    duration: "4h 30m",
    distance: "320 km",
    locations: 154
  },
  {
    id: 2,
    title: "Roadtrip Alpes",
    status: "En cours",
    date: "Aujourd'hui",
    duration: "2h 15m",
    distance: "180 km",
    locations: 89
  },
  {
    id: 3,
    title: "Côte d'Azur",
    status: "Terminé",
    date: "05 Sep 2023",
    duration: "8h 45m",
    distance: "850 km",
    locations: 412
  }
];

export default function TripsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Header */}
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
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">Mes Trajets</h1>
            <p className="text-slate-400 text-lg">Retrouvez l'historique complet de vos voyages.</p>
          </div>
        </div>

        <div className="grid gap-4">
          {TRIPS.map((trip) => (
            <Link 
              key={trip.id} 
              href={`/trips/${trip.id}`}
              className="group bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 transition-all hover:bg-slate-900 shadow-lg hover:shadow-indigo-500/10 flex items-center justify-between"
            >
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
                  trip.status === 'En cours' 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                }`}>
                  <MapPin className="w-6 h-6" />
                </div>
                
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-bold group-hover:text-indigo-400 transition-colors">{trip.title}</h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      trip.status === 'En cours'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}>
                      {trip.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {trip.date}</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {trip.duration}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {trip.distance}</span>
                  </div>
                </div>
              </div>

              <div className="text-slate-600 group-hover:text-indigo-400 transition-colors hidden sm:block">
                <ChevronRight className="w-6 h-6" />
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
