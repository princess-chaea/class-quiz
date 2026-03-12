"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Clock, Zap, Shield, Scissors, Gift, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface GameDisplayProps {
  game: any;
  player: any;
  onSubmit: (answer: string) => void;
  result: any;
}

export function GameDisplay({ game, player, onSubmit, result }: GameDisplayProps) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const currentQuestion = game.options?.questions[game.current_q_index];

  const handleSubmit = () => {
    if (!answer.trim()) return;
    setSubmitted(true);
    onSubmit(answer.trim());
  };

  useEffect(() => {
    setAnswer("");
    setSubmitted(false);
    // Sync timer with new question
    setTimeLeft(currentQuestion?.timeLimit || 20);
  }, [game.current_q_index]);

  useEffect(() => {
    if (game.status !== 'PLAYING') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [game.current_q_index, submitted, game.status]);

  useEffect(() => {
    if (result && result.is_correct) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#4f46e5", "#10b981", "#fbbf24"],
      });
    }
  }, [result]);

  if (game.status === "RESULT" && result) {
    return (
      <div className={cn(
        "p-8 rounded-3xl border-8 animate-pop shadow-2xl w-full max-w-lg text-center relative overflow-hidden",
        result.is_correct ? "bg-green-50 border-green-400" : "bg-red-50 border-red-400"
      )}>
        <div className="absolute top-0 right-0 p-4">
           {result.event === 'double' && <div className="bg-yellow-400 text-white px-3 py-1 rounded-bl-xl font-bold flex items-center gap-1 shadow-md"><Zap size={16}/> x2 배!</div>}
           {result.event === 'strike' && <div className="bg-blue-500 text-white px-3 py-1 rounded-bl-xl font-bold flex items-center gap-1 shadow-md animate-pulse"><Zap size={16}/> STRIKE!</div>}
           {result.event === 'shield' && <div className="bg-cyan-500 text-white px-3 py-1 rounded-bl-xl font-bold flex items-center gap-1 shadow-md animate-pulse"><Shield size={16}/> 방어권!</div>}
           {result.event === 'swap' && <div className="bg-indigo-500 text-white px-3 py-1 rounded-bl-xl font-bold flex items-center gap-1 shadow-md animate-pulse"><RefreshCw size={16}/> 점수 바꾸기!</div>}
        </div>

        <div className="text-9xl mb-6">{result.is_correct ? "⭕" : "❌"}</div>
        <h3 className="text-5xl font-black mb-4 text-gray-800">{result.is_correct ? "정답!" : "오답!"}</h3>
        
        <div className={cn(
          "text-4xl font-black mb-6",
          result.points_awarded > 0 ? "text-blue-600" : result.points_awarded < 0 ? "text-red-500" : "text-gray-400"
        )}>
          {result.points_awarded > 0 ? `+${result.points_awarded}점` : `${result.points_awarded}점`}
        </div>

        <p className="text-gray-500 text-xl font-bold">다음 문제를 기다려주세요</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl animate-pop">
      <div className="bg-white p-8 rounded-3xl shadow-2xl border-b-8 border-indigo-200">
        <div className="flex justify-between items-end mb-8">
          <div className="flex flex-col gap-1">
             <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Question</span>
             <span className="bg-indigo-600 text-white px-5 py-1 rounded-2xl text-2xl font-black shadow-lg shadow-indigo-100">
               #{game.current_q_index + 1}
             </span>
          </div>
          
          <div className={cn(
            "flex flex-col items-end gap-1 transition-all duration-300",
            timeLeft <= 5 ? "text-red-500 scale-110" : "text-gray-400"
          )}>
             <span className="text-xs font-black uppercase tracking-widest">Time Remaining</span>
             <div className="flex items-center gap-3 font-black text-4xl">
               <Clock size={32} className={cn(timeLeft <= 5 && "animate-pulse")} />
               <span>{timeLeft}s</span>
             </div>
          </div>
        </div>

        <h2 className="text-4xl md:text-5xl font-black text-gray-800 mb-10 break-keep leading-tight">
          {currentQuestion?.q || "문제를 불러오는 중..."}
        </h2>

        {game.current_hint_stage > 0 && !submitted && timeLeft > 0 && (
          <div className="mb-10 p-6 bg-indigo-50 rounded-[2rem] border-2 border-indigo-100 flex flex-col items-center animate-in slide-in-from-top-2 duration-300 shadow-inner">
            <span className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap size={14} className="fill-indigo-400" /> Teacher's Hint
            </span>
            <div className="flex flex-wrap justify-center gap-3">
              {currentQuestion?.a.split('').map((char: string, i: number) => (
                <div 
                  key={i}
                  className={cn(
                    "w-10 h-12 md:w-12 md:h-14 rounded-2xl flex items-center justify-center text-2xl font-black transition-all shadow-sm",
                    game.current_hint_stage === 2 && i === 0
                      ? "bg-indigo-600 text-white shadow-indigo-200 scale-110" 
                      : char === ' ' ? "bg-transparent border-none" : "bg-white text-indigo-200 border-2 border-indigo-100"
                  )}
                >
                  {game.current_hint_stage === 2 && i === 0 ? char : (char === ' ' ? ' ' : '')}
                </div>
              ))}
            </div>
          </div>
        )}

        {(!submitted && timeLeft > 0) ? (
          <div className="space-y-6">
            {currentQuestion?.type === "MULTIPLE_CHOICE" && currentQuestion.options ? (
               <div className="grid grid-cols-2 gap-4">
                 {currentQuestion.options.map((opt: string, idx: number) => (
                   <Button
                     key={idx}
                     size="xl"
                     variant="ghost"
                     className="py-12 whitespace-normal break-keep text-2xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-all font-black text-slate-700 border-2"
                     onClick={() => {
                        setAnswer(opt);
                        setSubmitted(true);
                        onSubmit(opt);
                     }}
                   >
                     {idx + 1}. {opt}
                   </Button>
                 ))}
               </div>
            ) : (
               <>
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    className="w-full p-6 text-center text-3xl border-4 border-gray-100 rounded-2xl focus:border-indigo-400 outline-none font-bold"
                    placeholder="정답을 입력하세요"
                    autoFocus
                  />
                  <Button 
                    size="xl" 
                    className="w-full py-8 text-3xl shadow-indigo-200 shadow-lg"
                    onClick={handleSubmit}
                  >
                    제출하기!
                  </Button>
               </>
            )}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center gap-4 text-indigo-400 animate-pulse">
            <div className="text-8xl">
              {timeLeft === 0 && !submitted ? "⏰" : 
               timeLeft === 0 && submitted ? "⌛" : "🤔"}
            </div>
            <p className="text-2xl font-black">
              {timeLeft === 0 && !submitted ? "시간이 종료되었습니다!" : 
               timeLeft === 0 && submitted ? "시간 종료! 결과를 기다려주세요..." : "선생님이 정답을 확인 중입니다..."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
