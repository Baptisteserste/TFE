import { MapPin, Navigation, Compass, Calendar, Clock, Crosshair } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TripDetailPage({ params }: PageProps) {
  const { id } = await params;
  
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
                Trip #{id} - Exploration
              </h1>
              <div className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Suivi en temps réel actif
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
                  <div className="text-sm text-slate-400 font-medium">Distance</div>
                  <div className="text-lg font-bold">180 <span className="text-sm text-slate-500 font-normal">km</span></div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><Navigation className="w-5 h-5"/></div>
                <div>
                  <div className="text-sm text-slate-400 font-medium">Vitesse Max</div>
                  <div className="text-lg font-bold">110 <span className="text-sm text-slate-500 font-normal">km/h</span></div>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg"><Clock className="w-5 h-5"/></div>
                <div>
                  <div className="text-sm text-slate-400 font-medium">Durée</div>
                  <div className="text-lg font-bold">2h 15m</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            <h3 className="font-semibold text-slate-400 uppercase tracking-wider text-xs mb-4">Points d'intérêt traversés</h3>
            <ul className="space-y-4 relative before:absolute before:inset-y-0 before:left-[11px] before:w-0.5 before:bg-slate-800">
              {['Annecy (Départ)', 'Chambéry', 'Grenoble', 'Valence (Arrivée en cours)'].map((point, i, arr) => (
                <li key={i} className="flex gap-4 relative">
                  <span className={`w-6 h-6 rounded-full border-4 border-slate-950 flex-shrink-0 relative z-10 ${i === arr.length - 1 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-indigo-500'}`} />
                  <div>
                    <p className={`font-semibold ${i === arr.length - 1 ? 'text-emerald-400' : 'text-slate-200'}`}>{point}</p>
                    <span className="text-sm font-medium text-slate-500">{10 + i * 2}:00 AM</span>
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
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <Compass className="w-32 h-32 mx-auto text-slate-800 mb-4 animate-[spin_10s_linear_infinite]" />
              <div className="text-slate-600 font-bold tracking-widest uppercase text-xl">Carte Interactive Interactive</div>
              <div className="text-slate-500 text-sm mt-2">Intégration d'une bibliothèque de cartographie comme Leaflet ou Mapbox à venir...</div>
            </div>
            
            {/* Fake route line */}
            <svg className="absolute w-full h-full drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" preserveAspectRatio="none">
              <path d="M 200,800 Q 300,500 500,400 T 800,200" fill="none" stroke="currentColor" strokeWidth="6" className="text-indigo-500" strokeDasharray="10 10" />
            </svg>

            {/* Current Position Marker */}
            <div className="absolute top-[200px] left-[800px] w-8 h-8 -ml-4 -mt-4 bg-emerald-500 rounded-full border-4 border-white shadow-[0_0_20px_rgba(16,185,129,0.8)] flex items-center justify-center animate-pulse">
              <Crosshair className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="absolute top-6 right-6 p-4 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl shadow-2xl flex flex-col gap-3">
             <button className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center transition-colors">
               <span className="text-xl leading-none font-bold">+</span>
             </button>
             <button className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center transition-colors">
               <span className="text-2xl leading-none font-bold block -mt-1">-</span>
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
