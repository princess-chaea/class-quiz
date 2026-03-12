"use client";

import { Button } from "@/components/ui/Button";
import { Trophy, Home, LogOut, Medal } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface LeaderboardProps {
  players: any[];
}

export function Leaderboard({ players }: LeaderboardProps) {
  const router = useRouter();
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const top3 = sortedPlayers.slice(0, 3);
  const others = sortedPlayers.slice(3);

  return (
    <div className="min-h-screen bg-indigo-900 overflow-y-auto p-8 flex flex-col items-center">
      <div className="max-w-4xl w-full">
        <h1 className="text-6xl font-jua text-white text-center mb-16 animate-pop shadow-indigo-900 drop-shadow-2xl">
          🏆 최종 순위 발표 🏆
        </h1>

        {/* Podium */}
        <div className="flex justify-center items-end gap-4 mb-20 px-4">
          {/* 2nd Place */}
          {top3[1] && (
            <div className="flex flex-col items-center animate-pop" style={{ animationDelay: '200ms' }}>
              <div className="bg-gray-300 w-24 h-24 rounded-full border-4 border-white flex items-center justify-center text-4xl mb-4 shadow-xl">
                 🥈
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 w-32 text-center border border-white/10 shadow-lg">
                <div className="font-black text-white truncate">{top3[1].nickname}</div>
                <div className="text-yellow-400 font-black">{top3[1].score}점</div>
              </div>
              <div className="w-32 h-32 bg-gray-400/50 rounded-t-2xl mt-4 flex items-center justify-center text-white font-black text-2xl">2nd</div>
            </div>
          )}

          {/* 1st Place */}
          {top3[0] && (
            <div className="flex flex-col items-center animate-pop">
              <div className="bg-yellow-400 w-32 h-32 rounded-full border-8 border-white flex items-center justify-center text-6xl mb-4 shadow-2xl animate-bounce">
                 🥇
              </div>
              <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-6 w-48 text-center border border-white/20 shadow-2xl relative">
                <div className="absolute -top-4 -right-4 bg-red-500 text-white p-2 rounded-xl rotate-12 font-black shadow-lg">WINNER</div>
                <div className="text-2xl font-black text-white truncate">{top3[0].nickname}</div>
                <div className="text-3xl font-black text-yellow-400 drop-shadow-md">{top3[0].score}점</div>
              </div>
              <div className="w-48 h-48 bg-yellow-500/50 rounded-t-3xl mt-4 flex items-center justify-center text-white font-black text-4xl">1st</div>
            </div>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <div className="flex flex-col items-center animate-pop" style={{ animationDelay: '400ms' }}>
              <div className="bg-orange-600 w-20 h-20 rounded-full border-4 border-white flex items-center justify-center text-3xl mb-4 shadow-xl">
                 🥉
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 w-32 text-center border border-white/10 shadow-lg">
                <div className="font-black text-white truncate">{top3[2].nickname}</div>
                <div className="text-yellow-400 font-black">{top3[2].score}점</div>
              </div>
              <div className="w-32 h-24 bg-orange-700/50 rounded-t-2xl mt-4 flex items-center justify-center text-white font-black text-2xl">3rd</div>
            </div>
          )}
        </div>

        {/* Other Players */}
        {others.length > 0 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 mb-12 border border-white/10">
            {others.map((player, index) => (
              <div 
                key={player.id} 
                className="flex justify-between items-center p-4 border-b border-white/10 last:border-0 hover:bg-white/5 transition-colors rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <span className="text-white/40 font-black text-xl w-8">{index + 4}</span>
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-white relative">
                    {player.nickname[0]}
                    {player.team && (
                      <div className={cn(
                        "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-indigo-900",
                        player.team === 'RED' ? 'bg-red-500' :
                        player.team === 'BLUE' ? 'bg-blue-500' :
                        player.team === 'GREEN' ? 'bg-green-500' : 'bg-yellow-400'
                      )} />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-white">{player.nickname}</span>
                    {player.team && (
                      <span className="text-[10px] font-black opacity-50 text-white uppercase tracking-wider">
                        {player.team === 'RED' ? '빨강팀' :
                         player.team === 'BLUE' ? '파랑팀' :
                         player.team === 'GREEN' ? '초록팀' : '노랑팀'}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-2xl font-black text-indigo-300">{player.score}점</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-center gap-6">
           <Button 
             size="xl" 
             variant="ghost" 
             className="text-white border-white/20 hover:bg-white/10"
             onClick={() => router.push("/dashboard")}
           >
             <Home className="mr-2" /> 대시보드로
           </Button>
           <Button 
             size="xl" 
             className="px-12 bg-white text-indigo-900 hover:bg-gray-100 font-black shadow-xl"
             onClick={() => window.location.reload()}
           >
             한 게임 더!
           </Button>
        </div>
      </div>
    </div>
  );
}
