"use client";

import { useGame } from "@/hooks/useGame";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Trophy, Home, RotateCcw, Medal } from "lucide-react";
import confetti from "canvas-confetti";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export default function ResultsPage() {
  const { code } = useParams();
  const router = useRouter();
  const { players, loading } = useGame(code as string);

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  useEffect(() => {
    if (!loading && players.length > 0) {
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [loading, players.length]);

  if (loading) return <div className="p-8 text-center font-bold">결과 집계 중...</div>;

  return (
    <div className="min-h-screen bg-indigo-600 text-white flex flex-col items-center p-8">
      <div className="w-full max-w-4xl text-center animate-pop">
        <Trophy size={120} className="mx-auto text-yellow-400 mb-6 drop-shadow-2xl" />
        <h1 className="text-6xl md:text-8xl font-jua mb-12 drop-shadow-lg">최종 순위 발표!</h1>

        {/* Podium */}
        <div className="grid grid-cols-3 gap-4 items-end mb-16 h-64">
          {/* 2nd Place */}
          <div className="flex flex-col items-center">
            <div className="text-xl font-bold mb-2 truncate w-full">{sortedPlayers[1]?.nickname || "-"}</div>
            <div className="bg-gray-300 w-full h-32 rounded-t-3xl shadow-xl flex items-center justify-center relative border-x-4 border-t-4 border-gray-100">
               <Medal size={48} className="text-gray-500" />
               <div className="absolute -bottom-4 text-4xl font-black text-gray-600">2</div>
            </div>
            <div className="mt-6 font-bold">{sortedPlayers[1]?.score || 0}점</div>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center">
            <div className="text-2xl font-black mb-2 truncate w-full text-yellow-300 animate-pulse">{sortedPlayers[0]?.nickname || "-"}</div>
            <div className="bg-yellow-400 w-full h-48 rounded-t-3xl shadow-2xl flex items-center justify-center relative border-x-4 border-t-4 border-yellow-200">
               <Trophy size={64} className="text-yellow-700" />
               <div className="absolute -bottom-4 text-6xl font-black text-yellow-800">1</div>
            </div>
            <div className="mt-6 text-2xl font-black text-yellow-300">{sortedPlayers[0]?.score || 0}점</div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center">
            <div className="text-xl font-bold mb-2 truncate w-full">{sortedPlayers[2]?.nickname || "-"}</div>
            <div className="bg-orange-400 w-full h-24 rounded-t-3xl shadow-xl flex items-center justify-center relative border-x-4 border-t-4 border-orange-200">
               <Medal size={40} className="text-orange-700" />
               <div className="absolute -bottom-4 text-4xl font-black text-orange-800">3</div>
            </div>
            <div className="mt-6 font-bold">{sortedPlayers[2]?.score || 0}점</div>
          </div>
        </div>

        {/* Other Rankings */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedPlayers.slice(3).map((player, index) => (
              <div key={player.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-4">
                  <span className="text-white/40 font-black">{index + 4}위</span>
                  <span className="text-xl font-bold">{player.nickname}</span>
                </div>
                <span className="font-bold text-indigo-200">{player.score}점</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-6 justify-center">
          <Button size="xl" onClick={() => router.push("/")} className="bg-white text-indigo-600 hover:bg-gray-100">
            <Home size={24} className="mr-2" /> 처음으로
          </Button>
          <Button size="xl" variant="yellow">
            <RotateCcw size={24} className="mr-2" /> 다시 하기
          </Button>
        </div>
      </div>
    </div>
  );
}
