"use client";

import { useState, useRef, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ConfettiBurst } from "@/components/confetti";

interface Question {
  a: number;
  b: number;
  answer: number;
  options: number[];
}

interface ConfettiState { key: number; x: number; y: number }

function generateQuestions(tabla: number): Question[] {
  const questions: Question[] = [];
  const nums = Array.from({ length: 10 }, (_, i) => i + 1);
  // Shuffle
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }

  for (const b of nums) {
    const answer = tabla * b;
    const options = new Set<number>([answer]);
    while (options.size < 4) {
      const wrong = tabla * (Math.floor(Math.random() * 10) + 1) + (Math.floor(Math.random() * 5) - 2);
      if (wrong > 0 && wrong !== answer) options.add(wrong);
    }
    const shuffled = [...options].sort(() => Math.random() - 0.5);
    questions.push({ a: tabla, b, answer, options: shuffled });
  }
  return questions;
}

function generateChallengeQuestions(): Question[] {
  const questions: Question[] = [];
  for (let i = 0; i < 20; i++) {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    const answer = a * b;
    const options = new Set<number>([answer]);
    while (options.size < 4) {
      const wrong = (Math.floor(Math.random() * 9) + 1) * (Math.floor(Math.random() * 10) + 1);
      if (wrong !== answer) options.add(wrong);
    }
    questions.push({ a, b, answer, options: [...options].sort(() => Math.random() - 0.5) });
  }
  return questions;
}

const CATS = { correct: "😸", wrong: "😿", streak: "😻", thinking: "🤔", perfect: "🎉" };

export default function QuizPage({ params }: { params: Promise<{ tabla: string }> }) {
  const { tabla: tablaStr } = use(params);
  const isChallenge = tablaStr === "desafio";
  const tabla = isChallenge ? 0 : parseInt(tablaStr);
  const router = useRouter();
  const supabase = createClient();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [catFace, setCatFace] = useState(CATS.thinking);
  const [confetti, setConfetti] = useState<ConfettiState | null>(null);
  const [bonusConfetti, setBonusConfetti] = useState<ConfettiState[]>([]);
  const [finished, setFinished] = useState(false);
  const [hasDiamond, setHasDiamond] = useState(false);
  const [timer, setTimer] = useState(5);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const confettiKey = useRef(0);

  useEffect(() => {
    setQuestions(isChallenge ? generateChallengeQuestions() : generateQuestions(tabla));
  }, [tabla, isChallenge]);

  // Challenge mode countdown timer — only resets on new question (current changes)
  const selectedRef = useRef<number | null>(null);
  selectedRef.current = selected;

  useEffect(() => {
    if (!isChallenge || finished || questions.length === 0) return;
    setTimer(5);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      // Don't tick if already answered
      if (selectedRef.current !== null) {
        clearInterval(timerRef.current!);
        return;
      }
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setSelected(-1);
          setIsCorrect(false);
          setCatFace(CATS.wrong);
          setStreak(0);
          setTimeout(() => {
            if (current + 1 >= questions.length) {
              setFinished(true);
            } else {
              setCurrent((c) => c + 1);
              setSelected(null);
              setIsCorrect(null);
              setCatFace(CATS.thinking);
            }
          }, 1500);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [current, isChallenge, finished, questions.length]);

  const handleAnswer = (option: number, e: React.MouseEvent) => {
    if (selected !== null) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSelected(option);
    const correct = option === questions[current].answer;
    setIsCorrect(correct);

    if (correct) {
      setScore((s) => s + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);

      // Cat reaction
      setCatFace(newStreak >= 3 ? CATS.streak : CATS.correct);

      // Confetti from the button
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      confettiKey.current++;
      setConfetti({ key: confettiKey.current, x: rect.left + rect.width / 2, y: rect.top });

      // Super confetti on streaks of 3, 5, 7
      if (newStreak === 3 || newStreak === 5 || newStreak === 7) {
        setTimeout(() => {
          const w = window.innerWidth;
          const h = window.innerHeight;
          const bursts = [
            { x: w * 0.3, y: h * 0.3 },
            { x: w * 0.7, y: h * 0.3 },
          ].map((pos) => {
            confettiKey.current++;
            return { key: confettiKey.current, ...pos };
          });
          setBonusConfetti(bursts);
        }, 300);
      }
    } else {
      setCatFace(CATS.wrong);
      setStreak(0);
    }

    // Next question after delay
    const newScore = correct ? score + 1 : score;
    setTimeout(() => {
      if (current + 1 >= questions.length) {
        saveProgress(newScore);
        setFinished(true);
      } else {
        setConfetti(null);
        setBonusConfetti([]);
        setCurrent((c) => c + 1);
        setSelected(null);
        setIsCorrect(null);
        setCatFace(CATS.thinking);
      }
    }, correct ? 1000 : 2000);
  };

  const saveProgress = async (finalScore: number) => {
    if (isChallenge) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const errors = questions.length - finalScore;
    const stars = errors === 0 ? 3 : errors <= 2 ? 2 : 1;

    const { data: existing } = await supabase
      .from("matecata_progress")
      .select("stars, consecutive_perfects, times_played")
      .eq("user_id", user.id)
      .eq("tabla", tabla)
      .single();

    const newStars = Math.max(stars, existing?.stars || 0);
    const prevConsecutive = (existing as any)?.consecutive_perfects || 0;
    const newConsecutive = stars === 3 ? prevConsecutive + 1 : 0;

    await supabase.from("matecata_progress").upsert(
      {
        user_id: user.id,
        tabla,
        stars: newStars,
        best_streak: Math.max(bestStreak, streak),
        last_score: finalScore,
        times_played: (existing as any)?.times_played ? (existing as any).times_played + 1 : 1,
        consecutive_perfects: newConsecutive,
      },
      { onConflict: "user_id,tabla" }
    );

    // Diamond if 5 consecutive perfects
    if (newConsecutive >= 5) setHasDiamond(true);

    // Fire celebration if perfect
    if (errors === 0) {
      setTimeout(() => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const positions = [
          { x: w * 0.5, y: h * 0.2 },
          { x: w * 0.2, y: h * 0.4 },
          { x: w * 0.8, y: h * 0.4 },
          { x: w * 0.3, y: h * 0.6 },
          { x: w * 0.7, y: h * 0.6 },
        ];
        const makeBursts = () => positions.map((pos) => {
          confettiKey.current++;
          return { key: confettiKey.current, ...pos };
        });
        setBonusConfetti(makeBursts());
        setTimeout(() => setBonusConfetti(makeBursts()), 800);
        setTimeout(() => setBonusConfetti(makeBursts()), 1600);
      }, 300);
    }
  };

  if (questions.length === 0) return null;

  const q = questions[current];
  const finalScore = score;
  const errors = questions.length - finalScore;
  const stars = errors === 0 ? 3 : errors <= 2 ? 2 : 1;

  // Results screen
  if (finished) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4 animate-bounce-in">
          {hasDiamond ? "💎" : stars === 3 ? "🏆" : stars === 2 ? "⭐" : "👏"}
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {isChallenge ? "¡Desafío completado!" : `¡Tabla del ${tabla} completada!`}
        </h1>
        <p className="text-4xl font-bold orange-shimmer mb-4">{finalScore}/{questions.length}</p>

        {!isChallenge && (
          <div className="flex justify-center gap-1 mb-4">
            {[1, 2, 3].map((s) => (
              <span key={s} className={`text-3xl ${s <= stars ? "" : "opacity-20"}`}>⭐</span>
            ))}
            {hasDiamond && <span className="text-3xl animate-bounce-in">💎</span>}
          </div>
        )}

        {bestStreak > 0 && (
          <p className="text-sm text-muted mb-6">🔥 Mejor racha: {bestStreak}</p>
        )}

        <div className="space-y-3 max-w-xs mx-auto">
          <button
            onClick={() => {
              setQuestions(isChallenge ? generateChallengeQuestions() : generateQuestions(tabla));
              setCurrent(0);
              setScore(0);
              setStreak(0);
              setBestStreak(0);
              setSelected(null);
              setIsCorrect(null);
              setCatFace(CATS.thinking);
              setHasDiamond(false);
              setFinished(false);
            }}
            className="w-full bg-orange text-black font-bold py-3 rounded-xl text-lg"
          >
            ¡Jugar de nuevo!
          </button>
          <button
            onClick={() => router.push("/jugar")}
            className="w-full bg-surface border border-border text-foreground font-medium py-3 rounded-xl"
          >
            Volver al menú
          </button>
        </div>

        {confetti && <ConfettiBurst key={confetti.key} x={confetti.x} y={confetti.y} onDone={() => setConfetti(null)} />}
        {bonusConfetti.map((c) => <ConfettiBurst key={c.key} x={c.x} y={c.y} onDone={() => setBonusConfetti((prev) => prev.filter((b) => b.key !== c.key))} />)}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* Progress bar */}
      <div className="w-full bg-border rounded-full h-2 mb-6">
        <div
          className="bg-orange h-2 rounded-full transition-all duration-300"
          style={{ width: `${((current) / questions.length) * 100}%` }}
        />
      </div>

      {/* Streak */}
      {streak > 0 && (
        <div className="text-sm font-medium text-orange mb-2 animate-bounce-in">
          🔥 Racha: {streak}
        </div>
      )}

      {/* Cat */}
      <div className={`text-6xl mb-6 ${isCorrect === true ? "animate-jump" : isCorrect === false ? "animate-shake" : ""}`}>
        {catFace}
      </div>

      {/* Question */}
      <div className="text-center mb-8">
        <p className="text-5xl font-bold text-foreground mb-2">
          {q.a} × {q.b}
        </p>
        <p className="text-xl text-muted">= ?</p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {q.options.map((option) => {
          let bg = "bg-surface border-border hover:border-orange/50";
          if (selected !== null) {
            if (option === q.answer) bg = "bg-green-500/20 border-green-500";
            else if (option === selected) bg = "bg-red-500/20 border-red-500";
          }

          return (
            <button
              key={option}
              onClick={(e) => handleAnswer(option, e)}
              disabled={selected !== null}
              className={`${bg} border rounded-2xl py-5 text-2xl font-bold text-foreground transition-all active:scale-95 disabled:cursor-default`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {isCorrect === false && selected !== null && (
        <p className="mt-4 text-sm text-red-400 animate-bounce-in">
          La respuesta es {q.answer}
        </p>
      )}

      {/* Score */}
      <p className="mt-6 text-xs text-muted">
        Pregunta {current + 1} de {questions.length} · {score} correctas
      </p>

      {/* Timer (challenge mode) */}
      {isChallenge && selected === null && (
        <div className={`mt-3 text-3xl font-bold ${timer <= 2 ? "text-red-500 animate-bounce-in" : "text-orange"}`}>
          ⏱️ {timer}
        </div>
      )}

      {confetti && <ConfettiBurst key={confetti.key} x={confetti.x} y={confetti.y} onDone={() => setConfetti(null)} />}
      {bonusConfetti.map((c) => <ConfettiBurst key={c.key} x={c.x} y={c.y} onDone={() => setBonusConfetti((prev) => prev.filter((b) => b.key !== c.key))} />)}
    </div>
  );
}
