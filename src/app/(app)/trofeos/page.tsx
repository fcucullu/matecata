"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Progress {
  tabla: number;
  stars: number;
  best_streak: number;
  times_played: number;
}

const TROPHIES = [
  { id: "first", emoji: "🌟", name: "Primera Tabla", desc: "Completa tu primera tabla", check: (p: Progress[]) => p.length >= 1 },
  { id: "five", emoji: "🏅", name: "Medio Camino", desc: "Completa 5 tablas", check: (p: Progress[]) => p.length >= 5 },
  { id: "all", emoji: "🏆", name: "Maestro MateCata", desc: "Completa las 9 tablas", check: (p: Progress[]) => p.length >= 9 },
  { id: "perfect1", emoji: "💎", name: "Perfección", desc: "3 estrellas en una tabla", check: (p: Progress[]) => p.some((x) => x.stars === 3) },
  { id: "perfect5", emoji: "👑", name: "Rey de las Tablas", desc: "3 estrellas en 5 tablas", check: (p: Progress[]) => p.filter((x) => x.stars === 3).length >= 5 },
  { id: "perfectAll", emoji: "🌈", name: "Leyenda", desc: "3 estrellas en TODAS las tablas", check: (p: Progress[]) => p.filter((x) => x.stars === 3).length >= 9 },
  { id: "streak5", emoji: "🔥", name: "En Llamas", desc: "Racha de 5 respuestas correctas", check: (p: Progress[]) => p.some((x) => x.best_streak >= 5) },
  { id: "streak10", emoji: "⚡", name: "Imparable", desc: "Racha de 10 respuestas correctas", check: (p: Progress[]) => p.some((x) => x.best_streak >= 10) },
  { id: "practice", emoji: "📚", name: "Estudiante", desc: "Juega 10 veces en total", check: (p: Progress[]) => p.reduce((sum, x) => sum + (x.times_played || 0), 0) >= 10 },
  { id: "practice50", emoji: "🎓", name: "Graduado", desc: "Juega 50 veces en total", check: (p: Progress[]) => p.reduce((sum, x) => sum + (x.times_played || 0), 0) >= 50 },
];

export default function TrofeosPage() {
  const supabase = createClient();
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("matecata_progress")
      .select("*")
      .eq("user_id", user.id);

    setProgress(data ?? []);
    setLoading(false);
  };

  const totalStars = progress.reduce((sum, p) => sum + p.stars, 0);
  const unlockedCount = TROPHIES.filter((t) => t.check(progress)).length;

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold orange-shimmer mb-1">Trofeos</h1>
        <p className="text-sm text-muted">{unlockedCount}/{TROPHIES.length} desbloqueados · ⭐ {totalStars}/27</p>
      </div>

      {loading ? (
        <p className="text-center text-muted text-sm py-8">Cargando...</p>
      ) : (
        <div className="space-y-3">
          {TROPHIES.map((trophy) => {
            const unlocked = trophy.check(progress);
            return (
              <div
                key={trophy.id}
                className={`bg-surface rounded-xl p-4 border flex items-center gap-4 ${
                  unlocked ? "border-orange/30" : "border-border opacity-40"
                }`}
              >
                <span className={`text-3xl ${unlocked ? "" : "grayscale"}`}>{trophy.emoji}</span>
                <div>
                  <h3 className="font-medium text-foreground text-sm">{trophy.name}</h3>
                  <p className="text-xs text-muted">{trophy.desc}</p>
                </div>
                {unlocked && <span className="ml-auto text-orange text-sm">✓</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
