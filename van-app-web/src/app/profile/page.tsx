"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Settings, LogOut, Map, Calendar, Shield } from "lucide-react";
import Link from "next/link";
import { getMe, logout, hasToken, type User as UserType } from "@/services/authService";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!hasToken()) {
      router.push("/login");
      return;
    }

    getMe()
      .then((data) => {
        setUser(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        logout().then(() => router.push("/login"));
      });
  }, [router]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium">Récupération de vos données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl text-indigo-400">VanApp</Link>
          <div className="flex gap-4">
            <Link href="/trips" className="text-slate-400 hover:text-white font-medium transition-colors">Trajets</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Sidebar */}
          <aside className="w-full md:w-64 flex-shrink-0 space-y-2">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <span className="text-2xl font-bold text-white uppercase">{user.name.charAt(0)}</span>
              </div>
              <div>
                <h2 className="font-bold text-lg">{user.name}</h2>
                <p className="text-sm text-slate-400">Pilote de Van</p>
              </div>
            </div>
            
            <nav className="space-y-1">
              <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-600/10 text-indigo-400 font-medium">
                <User className="w-5 h-5" /> Informations
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-900 hover:text-white transition-colors">
                <Settings className="w-5 h-5" /> Paramètres
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-900 hover:text-white transition-colors">
                <Shield className="w-5 h-5" /> Sécurité
              </a>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-colors mt-8 text-left">
                <LogOut className="w-5 h-5" /> Déconnexion
              </button>
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-8">Informations Personnelles</h1>
            
            <div className="grid gap-6">
              {/* Profile Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
                  <User className="w-5 h-5 text-indigo-400" />
                  Détails du compte
                </h3>
                
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm text-slate-500 mb-1 block">Nom complet</label>
                    <div className="font-medium text-lg">{user.name}</div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-500 mb-1 block">Adresse e-mail</label>
                    <div className="font-medium text-lg">{user.email}</div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-500 mb-1 block">Rôle</label>
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Utilisateur Actif
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-500 mb-1 block">ID Compte</label>
                    <div className="font-mono text-slate-400">#{user.id.toString().padStart(6, '0')}</div>
                  </div>
                </div>
              </div>

              {/* Stats Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl opacity-50">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
                  <Map className="w-5 h-5 text-indigo-400" />
                  Statistiques de conduite (bientôt)
                </h3>
                
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-3xl font-bold text-white mb-1">-</div>
                    <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Trajets</div>
                  </div>
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-3xl font-bold text-white mb-1">-</div>
                    <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Kilomètres</div>
                  </div>
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-3xl font-bold text-white mb-1">-</div>
                    <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Sur la route</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
