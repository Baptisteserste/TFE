"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, AlertCircle, ArrowRight, User } from "lucide-react";
import { login, register } from "@/services/authService";
import Link from "next/link";
import Image from "next/image";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        if (name.trim().length < 2) { setError("Le nom doit contenir au moins 2 caractères."); setIsLoading(false); return; }
        await register(name, email, password);
      }
      router.push("/trips");
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;

      if (!status) {
        setError("Impossible de contacter le serveur. Vérifiez votre connexion ou réessayez dans quelques secondes (le serveur peut être en veille).");
      } else if (status === 401 || status === 422) {
        setError(msg || "Identifiants invalides. Vérifiez votre email et mot de passe.");
      } else {
        setError(msg || "Une erreur est survenue. Réessayez.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-indigo-400 font-bold text-xl">
        <Image src="/icon.png" alt="VanApp" width={36} height={36} className="rounded-xl" />
        <span>VanApp</span>
      </Link>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />

        <div className="p-8 sm:p-10">
          {/* Onglets */}
          <div className="flex bg-slate-950 rounded-xl p-1 mb-8 border border-slate-800">
            {(["login", "register"] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  mode === m
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {m === "login" ? "Se connecter" : "Créer un compte"}
              </button>
            ))}
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">
              {mode === "login" ? "Bienvenue" : "Rejoindre VanApp"}
            </h1>
            <p className="text-slate-400 text-sm">
              {mode === "login"
                ? "Connectez-vous pour accéder à vos trajets"
                : "Créez votre compte gratuitement"}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nom — uniquement à l'inscription */}
            {mode === "register" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300 block">Nom complet</label>
                <div className="relative">
                  <User className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    placeholder="Jean Dupont"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 block">Adresse E-mail</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 block">Mot de passe</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>
              {mode === "register" && (
                <p className="text-xs text-slate-500">Minimum 8 caractères</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all mt-2"
            >
              {isLoading
                ? (mode === "login" ? "Connexion..." : "Création...")
                : (mode === "login" ? "Se connecter" : "Créer mon compte")}
              {!isLoading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </div>

      <p className="text-slate-600 text-xs mt-6">
        VanApp — Carnet de voyage connecté · TFE 2025-2026
      </p>
    </div>
  );
}
