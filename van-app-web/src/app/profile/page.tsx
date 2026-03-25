"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Settings, LogOut, Map, Shield, Bell, Globe, Lock, Smartphone, CheckCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getMe, logout, hasToken, type User as UserType } from "@/services/authService";
import { getTrips } from "@/services/tripService";

type Tab = 'info' | 'settings' | 'security';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [tripCount, setTripCount] = useState(0);
  const [logoutSuccess, setLogoutSuccess] = useState(false);

  useEffect(() => {
    if (!hasToken()) { router.push("/login"); return; }
    Promise.all([
      getMe().then(setUser),
      getTrips().then(t => setTripCount(t.length)),
    ])
      .catch(() => logout().then(() => router.push("/login")))
      .finally(() => setIsLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-medium">Récupération de vos données...</p>
        </div>
      </div>
    );
  }

  const navItems: { key: Tab; icon: React.ReactNode; label: string }[] = [
    { key: 'info',     icon: <User className="w-5 h-5" />,    label: 'Informations' },
    { key: 'settings', icon: <Settings className="w-5 h-5" />, label: 'Paramètres' },
    { key: 'security', icon: <Shield className="w-5 h-5" />,   label: 'Sécurité' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/icon.png" alt="VanApp" width={36} height={36} className="rounded-xl" />
            <span className="font-bold text-xl text-indigo-400">VanApp</span>
          </Link>
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
                <p className="text-sm text-slate-400">Pilote de Van 🚐</p>
              </div>
            </div>

            <nav className="space-y-1">
              {navItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-left ${
                    activeTab === item.key
                      ? 'bg-indigo-600/10 text-indigo-400'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  {item.icon} {item.label}
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-colors mt-8 text-left"
              >
                <LogOut className="w-5 h-5" /> Déconnexion
              </button>
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1">

            {/* ── INFORMATIONS ── */}
            {activeTab === 'info' && (
              <div>
                <h1 className="text-3xl font-bold mb-8">Informations Personnelles</h1>
                <div className="grid gap-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
                      <User className="w-5 h-5 text-indigo-400" /> Détails du compte
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

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
                      <Map className="w-5 h-5 text-indigo-400" /> Statistiques globales
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                        <div className="text-3xl font-bold text-white mb-1">{tripCount}</div>
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Voyages</div>
                      </div>
                      <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                        <div className="text-3xl font-bold text-indigo-400 mb-1">🚐</div>
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Vanlifer</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── PARAMÈTRES ── */}
            {activeTab === 'settings' && (
              <div>
                <h1 className="text-3xl font-bold mb-8">Paramètres</h1>
                <div className="grid gap-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
                      <Globe className="w-5 h-5 text-indigo-400" /> Langue & Région
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-slate-400 mb-2 block">Langue de l'interface</label>
                        <select className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-indigo-500 transition-colors">
                          <option value="fr">🇫🇷 Français</option>
                          <option value="en">🇬🇧 English</option>
                          <option value="nl">🇧🇪 Nederlands</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-slate-400 mb-2 block">Format de distance</label>
                        <div className="flex gap-3">
                          {['Kilomètres (km)', 'Miles (mi)'].map((unit, i) => (
                            <button key={unit} className={`flex-1 py-3 rounded-xl border font-medium text-sm transition-colors ${i === 0 ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-400' : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                              {unit}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
                      <Bell className="w-5 h-5 text-indigo-400" /> Notifications
                    </h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Notifications push mobile', sub: 'Alertes lors de la dernière synchronisation GPS', on: true },
                        { label: 'Résumé hebdomadaire', sub: 'Recevez un récapitulatif de vos voyages par e-mail', on: false },
                        { label: 'Alertes de sécurité', sub: 'Connexion depuis un nouvel appareil', on: true },
                      ].map(item => (
                        <div key={item.label} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
                          <div>
                            <p className="font-medium text-white">{item.label}</p>
                            <p className="text-sm text-slate-500">{item.sub}</p>
                          </div>
                          <div className={`w-12 h-6 rounded-full flex items-center transition-colors ${item.on ? 'bg-indigo-600' : 'bg-slate-700'} px-1`}>
                            <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${item.on ? 'translate-x-6' : 'translate-x-0'}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
                      <Smartphone className="w-5 h-5 text-indigo-400" /> Application mobile
                    </h3>
                    <div className="space-y-3 text-sm text-slate-400">
                      <div className="flex justify-between"><span>Intervalle GPS (arrière-plan)</span><span className="text-white font-medium">5 secondes</span></div>
                      <div className="flex justify-between"><span>Précision GPS</span><span className="text-white font-medium">BestForNavigation</span></div>
                      <div className="flex justify-between"><span>Envoi batch vers serveur</span><span className="text-white font-medium">Toutes les 10s</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── SÉCURITÉ ── */}
            {activeTab === 'security' && (
              <div>
                <h1 className="text-3xl font-bold mb-8">Sécurité</h1>
                <div className="grid gap-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
                      <Lock className="w-5 h-5 text-indigo-400" /> Compte
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                        <div>
                          <p className="font-medium">E-mail de connexion</p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                        <div>
                          <p className="font-medium">Authentification</p>
                          <p className="text-sm text-slate-500">Token JWT via Laravel Sanctum</p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                        <div>
                          <p className="font-medium">Stockage sécurisé mobile</p>
                          <p className="text-sm text-slate-500">Token chiffré via expo-secure-store</p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
                      <LogOut className="w-5 h-5 text-red-400" /> Session
                    </h3>
                    {logoutSuccess ? (
                      <div className="flex items-center gap-3 text-emerald-400 font-medium">
                        <CheckCircle className="w-5 h-5" /> Session terminée avec succès.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-slate-400 text-sm">Terminer votre session active sur tous les appareils connectés à ce compte.</p>
                        <button
                          onClick={async () => {
                            await logout();
                            setLogoutSuccess(true);
                            setTimeout(() => router.push('/login'), 1500);
                          }}
                          className="px-5 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-xl font-medium transition-colors text-sm"
                        >
                          Se déconnecter de tous les appareils
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
