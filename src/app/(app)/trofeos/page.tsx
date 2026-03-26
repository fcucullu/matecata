"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Progress {
  tabla: number;
  stars: number;
  best_streak: number;
  times_played: number;
  mode: string;
}

type TrophyDef = {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  section: "multiply" | "divide" | "global";
  check: (mul: Progress[], div: Progress[], all: Progress[]) => boolean;
};

const TROPHIES: TrophyDef[] = [
  // Multiplicar
  { id: "mul_first", emoji: "🌟", name: "Primera Tabla ✕", desc: "Completa tu primera tabla de multiplicar", section: "multiply", check: (m) => m.length >= 1 },
  { id: "mul_five", emoji: "🏅", name: "Medio Camino ✕", desc: "Completa 5 tablas de multiplicar", section: "multiply", check: (m) => m.length >= 5 },
  { id: "mul_all", emoji: "🏆", name: "Maestro ✕", desc: "Completa las 9 tablas de multiplicar", section: "multiply", check: (m) => m.length >= 9 },
  { id: "mul_perfect", emoji: "💎", name: "Perfección ✕", desc: "3 estrellas en una tabla de multiplicar", section: "multiply", check: (m) => m.some((x) => x.stars === 3) },
  { id: "mul_perfectAll", emoji: "👑", name: "Rey ✕", desc: "3 estrellas en TODAS las tablas de multiplicar", section: "multiply", check: (m) => m.filter((x) => x.stars === 3).length >= 9 },

  // Dividir
  { id: "div_first", emoji: "🌟", name: "Primera División", desc: "Completa tu primera tabla de dividir", section: "divide", check: (_, d) => d.length >= 1 },
  { id: "div_five", emoji: "🏅", name: "Medio Camino ÷", desc: "Completa 5 tablas de dividir", section: "divide", check: (_, d) => d.length >= 5 },
  { id: "div_all", emoji: "🏆", name: "Maestro ÷", desc: "Completa las 9 tablas de dividir", section: "divide", check: (_, d) => d.length >= 9 },
  { id: "div_perfect", emoji: "💎", name: "Perfección ÷", desc: "3 estrellas en una tabla de dividir", section: "divide", check: (_, d) => d.some((x) => x.stars === 3) },
  { id: "div_perfectAll", emoji: "👑", name: "Rey ÷", desc: "3 estrellas en TODAS las tablas de dividir", section: "divide", check: (_, d) => d.filter((x) => x.stars === 3).length >= 9 },

  // Globales
  { id: "streak5", emoji: "🔥", name: "En Llamas", desc: "Racha de 5 respuestas correctas", section: "global", check: (_, __, a) => a.some((x) => x.best_streak >= 5) },
  { id: "streak10", emoji: "⚡", name: "Imparable", desc: "Racha de 10 respuestas correctas", section: "global", check: (_, __, a) => a.some((x) => x.best_streak >= 10) },
  { id: "practice", emoji: "📚", name: "Estudiante", desc: "Juega 10 veces en total", section: "global", check: (_, __, a) => a.reduce((sum, x) => sum + (x.times_played || 0), 0) >= 10 },
  { id: "practice50", emoji: "🎓", name: "Graduado", desc: "Juega 50 veces en total", section: "global", check: (_, __, a) => a.reduce((sum, x) => sum + (x.times_played || 0), 0) >= 50 },
  { id: "both_all", emoji: "🌈", name: "Leyenda MateCata", desc: "Completa TODAS las tablas de multiplicar Y dividir", section: "global", check: (m, d) => m.length >= 9 && d.length >= 9 },
  { id: "both_perfect", emoji: "✨", name: "Perfección Total", desc: "3 estrellas en TODO (multiplicar y dividir)", section: "global", check: (m, d) => m.filter((x) => x.stars === 3).length >= 9 && d.filter((x) => x.stars === 3).length >= 9 },
];

const SECTIONS = [
  { key: "multiply" as const, label: "✕ Multiplicar" },
  { key: "divide" as const, label: "÷ Dividir" },
  { key: "global" as const, label: "🌍 Globales" },
];

export default function TrofeosPage() {
  const supabase = createClient();
  const [allProgress, setAllProgress] = useState<Progress[]>([]);
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

    setAllProgress(data ?? []);
    setLoading(false);
  };

  const mul = allProgress.filter((p) => p.mode === "multiply");
  const div = allProgress.filter((p) => p.mode === "divide");
  const totalStars = allProgress.reduce((sum, p) => sum + p.stars, 0);
  const unlockedCount = TROPHIES.filter((t) => t.check(mul, div, allProgress)).length;

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold orange-shimmer mb-1">Trofeos</h1>
        <p className="text-sm text-muted">{unlockedCount}/{TROPHIES.length} desbloqueados · ⭐ {totalStars}/54</p>
      </div>

      {loading ? (
        <p className="text-center text-muted text-sm py-8">Cargando...</p>
      ) : (
        <div className="space-y-6">
          {SECTIONS.map((section) => {
            const sectionTrophies = TROPHIES.filter((t) => t.section === section.key);
            return (
              <div key={section.key}>
                <h2 className="text-sm font-semibold text-muted mb-2">{section.label}</h2>
                <div className="space-y-2">
                  {sectionTrophies.map((trophy) => {
                    const unlocked = trophy.check(mul, div, allProgress);
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
