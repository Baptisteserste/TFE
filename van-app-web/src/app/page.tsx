import Link from "next/link";
import { ArrowRight, MapPin, Compass, User } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      {/* Navigation */}
      <nav className="absolute top-0 w-full p-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-xl tracking-tight">
          <Compass className="w-8 h-8" />
          <span>VanApp</span>
        </div>
        <div className="flex gap-6 items-center text-sm font-medium">
          <Link href="/trips" className="hover:text-indigo-400 transition-colors">Explorer</Link>
          <Link href="/profile" className="flex items-center gap-2 bg-indigo-600/20 text-indigo-400 px-4 py-2 rounded-full border border-indigo-500/20 hover:bg-indigo-600/30 transition-all">
            <User className="w-4 h-4" />
            Profil
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative flex flex-col items-center justify-center min-h-screen px-4 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] opacity-50 mix-blend-screen pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950/0 to-slate-950/0 pointer-events-none" />

        <div className="z-10 text-center max-w-3xl flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 mb-8 shadow-2xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            VanApp Web Tracking en direct
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
            Vos voyages. <br className="hidden md:block" />
            <span className="text-indigo-400">Cartographiés.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl leading-relaxed">
            Suivez vos trajets en van, analysez vos itinéraires, et revivez vos souvenirs sur une carte interactive premium. Tout est synchronisé depuis votre mobile.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link 
              href="/trips" 
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-indigo-500 hover:scale-[1.02] transition-all shadow-xl shadow-indigo-500/20"
            >
              <MapPin className="w-5 h-5" />
              Voir mes trajets
            </Link>
            <Link 
              href="/profile" 
              className="flex items-center justify-center gap-2 bg-slate-900 text-slate-300 px-8 py-4 rounded-2xl font-semibold hover:bg-slate-800 hover:text-white border border-slate-800 transition-all"
            >
              Paramètres
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
