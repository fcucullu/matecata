"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Star } from "lucide-react";

interface LevelProgress {
  tabla: number;
  stars: number;
  best_streak: number;
  consecutive_perfects: number;
}

const TABLAS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const CAT_FACES = ["😺", "😸", "😻", "🐱", "😼", "😽", "🙀", "😹", "😾"];

export default function JugarPage() {
  const supabase = createClient();
  const [progress, setProgress] = useState<Record<number, LevelProgress>>({});

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("matecata_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("mode", "multiply");

    const map: Record<number, LevelProgress> = {};
    data?.forEach((p) => { map[p.tabla] = p; });
    setProgress(map);
  };

  return (
    <div>
      <div className="text-center mb-8">
        <div className="text-5xl mb-2 animate-jump">😸</div>
        <h1 className="text-3xl font-bold orange-shimmer mb-1">MateCata</h1>
        <p className="text-sm text-muted">¡Elige una tabla para practicar multiplicación!</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {TABLAS.map((tabla) => {
          const p = progress[tabla];
          const stars = p?.stars || 0;
          const hasDiamond = (p?.consecutive_perfects || 0) >= 3;

          return (
            <Link
              key={tabla}
              href={`/multiplicar/${tabla}`}
              className={`bg-surface rounded-2xl border p-4 flex flex-col items-center gap-2 transition-all active:scale-95 ${
                hasDiamond ? "border-yellow/50" : "border-border hover:border-orange/30"
              }`}
            >
              <span className="text-3xl">{CAT_FACES[tabla - 1]}</span>
              <span className="text-lg font-bold text-foreground">×{tabla}</span>
              <div className="flex gap-0.5 items-center">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= stars ? "text-yellow fill-yellow" : "text-border"
                    }`}
                  />
                ))}
                {hasDiamond && <span className="text-sm ml-0.5">💎</span>}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Challenge mode */}
      <Link
        href="/multiplicar/desafio"
        className="block mt-6 bg-orange/10 border border-orange/30 rounded-2xl p-4 text-center hover:bg-orange/20 transition-colors"
      >
        <span className="text-2xl block mb-1">🎯</span>
        <span className="font-bold text-orange">Modo Desafío</span>
        <p className="text-xs text-muted mt-1">Preguntas aleatorias de todas las tablas</p>
      </Link>
    </div>
  );
}
