"use client";

import { useGame } from "@/hooks/useGame";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { Loader2, Zap, Shield, HelpCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { GameDisplay } from "@/components/game/GameDisplay";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export default function StudentWaitingRoom() {
  const { code } = useParams();
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "";
  const router = useRouter();
  
  const { game, players, loading, error } = useGame(code as string);
  const [playerResult, setPlayerResult] = useState<any>(null);

  // Fetch result when game status changes to RESULT
  useEffect(() => {
    if (game?.status === 'ENDED') {
      router.push(`/play/${code}/results?name=${name}`);
    }
  }, [game?.status, code, name, router]);

  useEffect(() => {
    if (game?.status === 'RESULT' && players.length > 0) {
      const me = players.find(p => p.nickname === name);
      if (me && !playerResult) { // Fetch only if we don't have result for this round
        const fetchResult = async () => {
          const { data } = await supabase
            .from("answers")
            .select("is_correct, points_awarded, event")
            .eq("game_id", game.id)
            .eq("player_id", me.id)
            .eq("q_index", game.current_q_index)
            .maybeSingle(); // Use maybeSingle to avoid 406 errors
          
          if (data) setPlayerResult(data);
        };
        fetchResult();
      }
    } else if (game?.status === 'PLAYING') {
      setPlayerResult(null);
    }
  }, [game?.status, game?.current_q_index, players, name, !!playerResult]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-yellow-50">
      <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
      <h2 className="text-xl font-bold">서버와 대화 중...</h2>
    </div>
  );

  if (error || !game) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-6 text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-4">입장 정보를 찾을 수 없습니다.</h2>
      <Button onClick={() => router.push("/")}>홈으로 돌아가기</Button>
    </div>
  );

  const me = players.find(p => p.nickname === name);

  const handleSubmitAnswer = async (answer: string) => {
    if (!me || !game) return;
    try {
      const currentQuestion = game.options?.questions[game.current_q_index];
      const isCorrect = answer.toLowerCase() === currentQuestion?.a.toLowerCase();
      
      const { error } = await supabase
        .from("answers")
        .insert([{
          game_id: game.id,
          player_id: me.id,
          q_index: game.current_q_index,
          answer: answer.trim(),
          is_correct: isCorrect
        }]);

      if (error) throw error;
    } catch (err) {
      alert("정답 제출 실패: " + (err as Error).message);
    }
  };

  // If game is in ENDED status, show ResultsPage
  if (game.status === 'ENDED') {
    router.push(`/play/${code}/results?name=${name}`);
    return null;
  }

  // If game is in PLAYING or RESULT status, show GameDisplay
  if (game.status === 'PLAYING' || game.status === 'RESULT') {
    return (
      <div className="min-h-screen bg-indigo-50 flex flex-col items-center justify-center p-6">
        <GameDisplay 
          game={game} 
          player={me} 
          onSubmit={handleSubmitAnswer} 
          result={playerResult}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ... existing waiting room UI ... */}

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-white to-indigo-50">
        <div className="animate-bounce mb-8">
          <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center shadow-2xl border-8 border-indigo-100 relative">
            <HelpCircle size={80} className="text-indigo-400" />
            <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-3 rounded-2xl animate-pulse">
              <Zap size={24} fill="white" />
            </div>
          </div>
        </div>

        <h1 className="text-4xl font-jua text-indigo-900 mb-4">선생님이 게임을 <br/>시작하기를 기다리고 있어요!</h1>
        <p className="text-gray-500 font-bold mb-8">준비를 마쳤나요? <br/>곧 재미있는 퀴즈가 시작됩니다!</p>

        {/* My Team Info */}
        {me?.team && (
          <div className={cn(
            "p-6 rounded-3xl shadow-lg border-4 w-full max-w-sm animate-pop",
            me.team === 'RED' ? 'bg-red-50 border-red-200 text-red-700' :
            me.team === 'BLUE' ? 'bg-blue-50 border-blue-200 text-blue-700' :
            me.team === 'GREEN' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'
          )}>
            <div className="text-sm font-black uppercase tracking-widest mb-1">My Team</div>
            <h3 className="text-3xl font-jua mb-4">
              {me.team === 'RED' ? '빨강팀' :
               me.team === 'BLUE' ? '파랑팀' :
               me.team === 'GREEN' ? '초록팀' : '노랑팀'}
            </h3>
            
            <div className="flex justify-center gap-3">
              {players.filter(p => p.team === me.team && p.nickname !== name).map(p => (
                <div key={p.id} className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center font-bold shadow-sm" title={p.nickname}>
                  {p.nickname[0]}
                </div>
              ))}
            </div>
            {players.filter(p => p.team === me.team && p.nickname !== name).length > 0 && (
              <p className="text-xs mt-3 font-bold opacity-60 text-center">팀원들이 함께하고 있습니다.</p>
            )}
          </div>
        )}

        <div className="mt-12">
          <Button variant="ghost" onClick={() => router.push("/")} className="text-gray-400">
            <LogOut size={18} className="mr-2" /> 나가기
          </Button>
        </div>
      </main>

      {/* Real-time status bar */}
      <footer className="bg-white border-t p-4 overflow-x-auto whitespace-nowrap scrollbar-hide flex items-center justify-center gap-3">
        {players.map(p => (
          <div 
            key={p.id} 
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all",
              p.nickname === name ? "bg-indigo-100 border-indigo-300 ring-2 ring-indigo-200" : "bg-gray-50 border-gray-200 opacity-60"
            )}
          >
            <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-[10px]">
              {p.nickname[0]}
            </div>
            <span className="text-xs font-bold">{p.nickname}</span>
          </div>
        ))}
      </footer>
    </div>
  );
}

