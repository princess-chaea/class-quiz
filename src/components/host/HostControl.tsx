"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { 
  Users, 
  Play, 
  ChevronRight, 
  Award, 
  HelpCircle, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Layers
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { useDialog } from "@/components/ui/DialogProvider";
import { PlayerBar } from "@/components/game/PlayerBar";

interface HostControlProps {
  game: any;
  players: any[];
}

export function HostControl({ game, players }: HostControlProps) {
  const [answers, setAnswers] = useState<any[]>([]);
  const [calculating, setCalculating] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(30); // Default
  const { showConfirm, showAlert } = useDialog();
  const currentQuestion = game.options?.questions[game.current_q_index];

  if (game.status === 'ENDED') return null;

  // Refs for stale closure protection
  const playersRef = useRef(players);
  const answersRef = useRef(answers);
  const gameRef = useRef(game);

  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { gameRef.current = game; }, [game]);

  const handleFinishRound = async () => {
    if (calculating) return;
    
    // If prematurely ending, ask for confirmation
    if (timeLeft > 0 && answers.length < players.length) {
      const confirmed = await showConfirm(`아직 제출하지 않은 학생이 ${players.length - answers.length}명 있습니다.\n정말로 마감하시겠습니까?`);
      if (!confirmed) return;
    }

    setCalculating(true);
    
    const currentPlayers = playersRef.current;
    const currentAnswers = answersRef.current;
    const currentGame = gameRef.current;
    const qIndex = currentGame.current_q_index;
    const question = currentGame.options?.questions[qIndex];

    try {
      // 1. Calculate base results
      const baseResults = currentPlayers.map(player => {
        const answer = currentAnswers.find(a => a.player_id === player.id);
        const isCorrect = answer?.is_correct || false;
        let points = 0;
        let event = 'none';

        if (isCorrect) {
          points = currentQuestion.points || 10;
          if (player.buffs?.includes('STRIKE')) points *= 2;
          
          const rand = Math.random();
          if (game.options?.double && rand < 0.05) { points *= 2; event = 'double'; }
          else if (game.options?.swap && rand < 0.10) { event = 'swap'; }
          else if (game.options?.strike && rand < 0.15) { event = 'strike'; }
          else if (game.options?.shield && rand < 0.20) { event = 'shield'; }
        } else {
          const rand = Math.random();
          if (game.options?.cut && rand < 0.20) event = 'cut';
          else if (game.options?.donate && rand < 0.40) event = 'donate';

          if ((event === 'cut' || event === 'donate') && player.buffs?.includes('SHIELD')) {
            event += '_blocked';
          } else {
            if (event === 'cut') points = -(currentQuestion.points || 10);
            else if (event === 'donate') points = -20;
          }
        }

        let newBuffs = [...(player.buffs || [])];
        if (isCorrect && newBuffs.includes('STRIKE')) newBuffs = newBuffs.filter(b => b !== 'STRIKE');
        if (event.endsWith('_blocked') && newBuffs.includes('SHIELD')) newBuffs = newBuffs.filter(b => b !== 'SHIELD');
        if (event === 'strike') newBuffs.push('STRIKE');
        if (event === 'shield') newBuffs.push('SHIELD');

        return { 
          player, 
          points, 
          event, 
          newBuffs: Array.from(new Set(newBuffs)),
          isCorrect,
          answerId: answer?.id
        };
      });

      // 2. Donation Bonus
      const finalResults = [...baseResults];
      baseResults.forEach(res => {
        if (res.event === 'donate') {
          const others = finalResults.filter(r => r.player.id !== res.player.id);
          const targets = others.sort(() => 0.5 - Math.random()).slice(0, 5);
          targets.forEach(t => {
            t.points += 10;
            if (t.event === 'none') t.event = 'gift';
          });
        }
      });

      // 3. Execute Updates
      for (const res of finalResults) {
        // Update Player Score and Buffs
        const { error: pError } = await supabase.from('players')
          .update({
            score: Math.max(0, res.player.score + res.points),
            buffs: res.newBuffs
          })
          .eq('id', res.player.id);
        
        if (pError) console.error(`Player ${res.player.id} update failed:`, pError);

        // Handle Answer Record (Upsert if exists, Insert if not)
        const answerData: any = {
          game_id: game.id,
          player_id: res.player.id,
          q_index: game.current_q_index,
          is_correct: res.isCorrect,
          points_awarded: res.points,
          event: res.event,
          answer: answers.find(a => a.player_id === res.player.id)?.answer || '(시간초과)'
        };

        if (res.answerId) {
          await supabase.from('answers').update(answerData).eq('id', res.answerId);
        } else {
          await supabase.from('answers').insert(answerData);
        }
      }

      await supabase.from("games").update({ status: "RESULT" }).eq("id", game.id);

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });

    } catch (err) {
      console.error("정산 실패:", err);
    } finally {
      setCalculating(false);
    }
  };

  // Timer logic
  const finishRoundRef = useRef(handleFinishRound);
  useEffect(() => { finishRoundRef.current = handleFinishRound; });

  useEffect(() => {
    if (game.status !== 'PLAYING') return;
    
    const limit = currentQuestion?.timeLimit || 20;
    setTimeLeft(limit);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Wait 2 seconds before finishing so students can see "Time's Up"
          setTimeout(() => {
            finishRoundRef.current();
          }, 2000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [game.id, game.current_q_index, game.status]);

  useEffect(() => {
    // Subscribe to answers for this round
    const channel = supabase
      .channel(`answers:${game.id}`)
      .on(
        'postgres_changes',
        { 
          event: '*', // Listen to all events (INSERT, UPDATE)
          schema: 'public', 
          table: 'answers', 
          filter: `game_id=eq.${game.id}` 
        },
        async (payload) => {
          // Instead of pushing to array, re-fetch for accuracy or update specific item
          const { data } = await supabase
            .from("answers")
            .select("*")
            .eq("game_id", game.id)
            .eq("q_index", gameRef.current.current_q_index);
          
          if (data) setAnswers(data);
        }
      )
      .subscribe();

    const fetchAnswers = async () => {
      const { data } = await supabase
        .from("answers")
        .select("*")
        .eq("game_id", game.id)
        .eq("q_index", game.current_q_index);
      if (data) setAnswers(data);
    };
    fetchAnswers();

    // Polling fallback
    const interval = setInterval(fetchAnswers, 2000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [game.id, game.current_q_index]);

  const handleHintStage = async (stage: number) => {
    if (game.current_hint_stage >= stage) return;
    
    const descriptions = [
      "",
      "1단계 힌트: 정답의 '글자 수'를 보여줍니다.",
      "2단계 힌트: 정답의 '초성(ㄱㄴㄷ...)'을 보여줍니다."
    ];

    const confirmed = await showConfirm(`${descriptions[stage]}\n힌트를 공개하시겠습니까?`);
    if (!confirmed) return;

    try {
      await supabase
        .from("games")
        .update({ current_hint_stage: stage })
        .eq("id", game.id);
    } catch (err) {
      console.error("Hint update failed:", err);
    }
  };

  const handleNextQuestion = async () => {
    const isLast = game.current_q_index >= (game.options?.questions?.length || 1) - 1;
    
    try {
      const { error } = await supabase
        .from("games")
        .update({ 
          status: isLast ? "ENDED" : "PLAYING",
          current_q_index: isLast ? game.current_q_index : game.current_q_index + 1,
          current_hint_stage: 0 // Reset hint stage for next question
        })
        .eq("id", game.id);
      
      if (error) throw error;
      
      setAnswers([]);
      // Force local update if realtime is slow
      if (gameRef.current) {
        gameRef.current.current_q_index = isLast ? game.current_q_index : game.current_q_index + 1;
        gameRef.current.current_hint_stage = 0;
        gameRef.current.status = isLast ? "ENDED" : "PLAYING";
      }
    } catch (err) {
      alert("이동 실패: " + (err as Error).message);
    }
  };


  if (game.status === 'RESULT') {
    return (
      <div className="flex-1 flex flex-col items-center p-8 bg-indigo-900 text-white overflow-y-auto">
        <Award size={80} className="mb-4 text-yellow-400 animate-bounce" />
        <h2 className="text-4xl font-jua mb-2">라운드 결과</h2>
        
        <div className="bg-white/10 p-6 rounded-[2rem] border-2 border-white/10 mb-8 mt-2 animate-pop text-center">
           <p className="text-indigo-200 font-bold mb-1 uppercase tracking-widest text-xs">정답은</p>
           <h3 className="text-5xl font-black text-yellow-300 underline underline-offset-4 decoration-white/20">
             {currentQuestion?.a}
           </h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4 w-full max-w-lg mb-12">
           <div className="bg-white/10 p-4 rounded-3xl border border-white/10 text-center">
              <div className="text-xs font-bold opacity-50 uppercase mb-1">정답자</div>
              <div className="text-3xl font-black text-green-400">{answers.filter(a => a.is_correct).length}명</div>
           </div>
           <div className="bg-white/10 p-4 rounded-3xl border border-white/10 text-center">
              <div className="text-xs font-bold opacity-50 uppercase mb-1">참여도</div>
              <div className="text-3xl font-black text-blue-300">{Math.round((answers.length / players.length) * 100)}%</div>
           </div>
        </div>

        {/* Mini Leaderboard */}
        <div className="w-full max-w-4xl bg-white/5 rounded-[3rem] p-8 border border-white/10">
          <h3 className="text-2xl font-jua mb-6 text-center text-indigo-200">🏆 실시간 랭킹</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {players.slice(0, 10).map((player, idx) => (
              <div 
                key={player.id} 
                className="flex items-center justify-between bg-white/10 p-4 rounded-2xl border border-white/5 hover:bg-white/20 transition-all font-bold"
              >
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs",
                    idx === 0 ? "bg-yellow-400 text-indigo-900" : 
                    idx === 1 ? "bg-slate-300 text-slate-700" :
                    idx === 2 ? "bg-orange-400 text-white" : "bg-white/20 text-white"
                  )}>
                    {idx + 1}
                  </span>
                  <span className="text-lg">{player.nickname}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xl font-black text-yellow-400">{player.score}점</span>
                  {player.buffs?.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {player.buffs.map((b: string) => (
                        <span key={b} className="text-[10px] bg-indigo-500 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">
                          {b}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {players.length > 10 && (
            <p className="text-center mt-6 text-indigo-300 text-sm font-bold italic">and {players.length - 10} more players...</p>
          )}
        </div>

        <Button 
          size="xl" 
          className="mt-12 px-20 py-8 bg-yellow-400 text-indigo-900 hover:bg-yellow-300 font-black shadow-2xl rounded-[2rem] text-2xl group transition-all hover:scale-105"
          onClick={handleNextQuestion}
        >
          {game.current_q_index >= (game.options?.questions?.length || 1) - 1 ? "최종 결과 보기" : "다음 문제로"} 
          <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Current Question Display */}
      <div className="bg-white p-12 shadow-xl relative z-10 border-b-8 border-indigo-200">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-6 py-2 rounded-full font-black text-xl mb-6">
            <HelpCircle size={24} /> Question #{game.current_q_index + 1}
          </div>
          <div className="flex flex-col items-center gap-1 mb-8">
             <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">Points</span>
             <span className="bg-emerald-500 text-white px-6 py-1 rounded-2xl text-2xl font-black shadow-lg shadow-emerald-100 italic">
               {currentQuestion?.points || 10}점
             </span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-gray-800 break-keep leading-tight mb-8">
            {currentQuestion?.q}
          </h1>
          <div className="flex flex-wrap justify-center gap-6 mt-12 items-center">
            {currentQuestion?.type !== "MULTIPLE_CHOICE" && (
              <div className="flex bg-slate-100 p-2 rounded-2xl gap-2">
                {[1, 2].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleHintStage(s)}
                    className={cn(
                      "px-6 py-3 rounded-xl font-bold transition-all",
                      game.current_hint_stage >= s 
                        ? "bg-indigo-600 text-white shadow-lg" 
                        : "text-slate-500 hover:bg-slate-200"
                    )}
                  >
                    {`${s}단계 힌트`}
                  </button>
                ))}
              </div>
            )}

            <div className="h-10 w-px bg-slate-200" />

            <div className="flex items-center gap-6 bg-slate-50 px-8 py-4 rounded-3xl border-2 border-slate-100 shadow-sm font-black text-indigo-600 text-2xl">
               <div className={cn(
                 "flex items-center gap-3 transition-all duration-300",
                 timeLeft <= 5 && "text-red-500 animate-pulse scale-110"
               )}>
                 <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-colors bg-indigo-100">
                   <Clock size={28} />
                 </div>
                 {timeLeft}s
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-4 bg-gray-200 w-full overflow-hidden">
        <div 
          className="h-full bg-indigo-500 transition-all duration-1000" 
          style={{ width: `${(answers.length / players.length) * 100}%` }}
        ></div>
      </div>

      {/* Student Status Grid */}
      <div className="flex-1 p-8 overflow-y-auto bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-jua text-gray-700">제출 현황 ({answers.length}/{players.length})</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5 text-sm font-black text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                <CheckCircle2 size={16} /> 제출 완료
              </div>
              <div className="flex items-center gap-1.5 text-sm font-black text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                <AlertCircle size={16} /> 대기 중
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 pb-40">
            {players.map(player => {
              const hasSubmitted = answers.some(a => a.player_id === player.id);
              return (
                <div 
                  key={player.id}
                  className={cn(
                    "p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2",
                    hasSubmitted ? 'bg-green-50 border-green-200 text-green-700 shadow-md scale-105' : 'bg-white border-gray-100 text-gray-300'
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-black",
                    hasSubmitted ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-300'
                  )}>
                    {player.nickname[0]}
                  </div>
                  <span className="text-xs font-bold truncate w-full text-center">{player.nickname}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Fixed Footer Container */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] flex flex-col pointer-events-none">
        {/* Main Footer Controls */}
        <div className="bg-white/95 backdrop-blur-md border-t-2 border-indigo-100 p-4 md:p-6 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] flex justify-between items-center pointer-events-auto">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 text-indigo-700 p-3 md:p-4 rounded-2xl">
              <Users size={32} />
            </div>
            <div className="hidden sm:block">
              <div className="text-2xl font-black">{answers.length}명 제출</div>
              <div className="text-sm font-bold text-gray-400">남은 학생: {players.length - answers.length}명</div>
            </div>
          </div>
          
          <Button 
            size="xl" 
            disabled={calculating}
            className="px-8 md:px-16 py-6 md:py-8 bg-indigo-600 hover:bg-indigo-700 font-black shadow-xl rounded-2xl text-xl md:text-2xl transition-transform active:scale-95"
            onClick={handleFinishRound}
          >
            {calculating ? "채점 중..." : "문제 마감하기"}
          </Button>

          <div className="w-[100px] hidden md:block"></div> {/* Balanced spacing */}
        </div>

        {/* Player Status Bar */}
        <PlayerBar 
          players={players} 
          submissions={answers.map(a => a.player_id)}
          className="bg-indigo-50/90 border-t border-indigo-200 pointer-events-auto"
        />
      </div>
    </div>
  );
}
