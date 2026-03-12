"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Clock, Zap, Shield, Scissors, Gift, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { getChoseong } from "@/lib/utils";

interface GameDisplayProps {
  game: any;
  player: any;
  onSubmit: (answer: string) => void;
  result: any;
}

export function GameDisplay({ game, player, onSubmit, result }: GameDisplayProps) {
  const [answer, setAnswer] = useState("");
  const [blankAnswers, setBlankAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const isComposing = useRef(false);
  const currentQuestion = game.options?.questions[game.current_q_index];

  const handleSubmit = () => {
    if (!answer.trim()) return;
    setSubmitted(true);
    onSubmit(answer.trim());
  };

  useEffect(() => {
    setAnswer("");
    setBlankAnswers({});
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
           {result.event === 'gift' && <div className="bg-pink-500 text-white px-3 py-1 rounded-bl-xl font-bold flex items-center gap-1 shadow-md animate-pulse"><Gift size={16}/> 보너스 선물!</div>}
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

          <div className="flex flex-col items-center gap-1">
             <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Points</span>
             <span className="bg-emerald-500 text-white px-4 py-1 rounded-2xl text-xl font-black shadow-lg shadow-emerald-100">
               {currentQuestion?.points || 10}점
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
          {currentQuestion?.type === "BLANK" 
            ? "다음 빈칸에 들어갈 알맞은 글자를 넣으세요." 
            : (currentQuestion?.q || "문제를 불러오는 중...")}
        </h2>

        {game.current_hint_stage > 0 && !submitted && timeLeft > 0 && (
          <div className="mb-10 p-6 bg-indigo-50 rounded-[2rem] border-2 border-indigo-100 flex flex-col items-center animate-in slide-in-from-top-2 duration-300 shadow-inner">
            <span className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap size={14} className="fill-indigo-400" /> Teacher's Hint ({game.current_hint_stage === 1 ? '글자 수' : '초성'})
            </span>
            <div className="flex flex-wrap justify-center gap-3">
              {currentQuestion?.a.split('').map((char: string, i: number) => {
                const displayChar = game.current_hint_stage === 2 ? getChoseong(char) : (char === ' ' ? ' ' : '');
                return (
                  <div 
                    key={i}
                    className={cn(
                      "w-10 h-12 md:w-12 md:h-14 rounded-2xl flex items-center justify-center text-2xl font-black transition-all shadow-sm",
                      game.current_hint_stage === 2 && char !== ' '
                        ? "bg-indigo-600 text-white shadow-indigo-200 scale-110" 
                        : char === ' ' ? "bg-transparent border-none" : "bg-white text-indigo-200 border-2 border-indigo-100"
                    )}
                  >
                    {displayChar}
                  </div>
                );
              })}
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
            ) : currentQuestion?.type === "OX" ? (
               <div className="grid grid-cols-2 gap-6">
                 {["O", "X"].map(opt => (
                   <button
                     key={opt}
                     onClick={() => {
                        setAnswer(opt);
                        setSubmitted(true);
                        onSubmit(opt);
                     }}
                     className={cn(
                       "py-16 rounded-[2.5rem] border-4 font-black text-7xl transition-all shadow-xl",
                       opt === "O" ? "border-emerald-100 bg-emerald-50 text-emerald-500 hover:bg-emerald-100 hover:border-emerald-200" : "border-red-100 bg-red-50 text-red-500 hover:bg-red-100 hover:border-red-200"
                     )}
                   >
                     {opt}
                   </button>
                 ))}
               </div>
            ) : currentQuestion?.type === "BLANK" ? (
               <div className="space-y-6">
                 <div className="p-8 bg-slate-50 rounded-[2rem] border-2 border-slate-100 flex flex-wrap gap-x-2 gap-y-8 items-center justify-center min-h-[160px]">
                    {currentQuestion.q.split(/\s+/).filter(Boolean).map((word: string, wordIdx: number) => {
                      const blanks = currentQuestion.blanks || [];
                      const blankIndex = blanks.indexOf(wordIdx);
                      const isBlank = blankIndex !== -1;
                      
                      if (isBlank) {
                        return (
                          <div key={wordIdx} className="relative flex gap-1 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                            {word.split('').map((char, charIdx) => {
                              const key = `${wordIdx}-${charIdx}`;
                              return (
                                <input
                                  key={key}
                                  data-key={key}
                                  type="text"
                                  value={blankAnswers[key] || ""}
                                  className="w-10 h-12 bg-slate-50 border-2 border-indigo-200 rounded-lg text-center font-black text-indigo-600 focus:border-indigo-500 focus:bg-white outline-none transition-all text-xl"
                                  onKeyDown={(e) => {
                                    if (e.key === "Backspace" && !blankAnswers[key]) {
                                      // Find previous input
                                      const inputs = Array.from(document.querySelectorAll('input[data-key]')) as HTMLInputElement[];
                                      const currentIdx = inputs.findIndex(i => i.getAttribute('data-key') === key);
                                      if (currentIdx > 0) {
                                        inputs[currentIdx - 1].focus();
                                      }
                                    }
                                  }}
                                  onCompositionStart={() => { isComposing.current = true; }}
                                  onCompositionEnd={(e) => {
                                    isComposing.current = false;
                                    // After composition ends, we might need to trigger the move if it's a full syllable
                                    const char = (e.target as HTMLInputElement).value.slice(-1);
                                    const isSyllable = char.charCodeAt(0) >= 0xAC00 && char.charCodeAt(0) <= 0xD7A3;
                                    if (isSyllable) {
                                      setTimeout(() => {
                                        const inputs = Array.from(document.querySelectorAll('input[data-key]')) as HTMLInputElement[];
                                        const currentIdx = inputs.findIndex(i => i.getAttribute('data-key') === key);
                                        if (currentIdx < inputs.length - 1) {
                                          inputs[currentIdx + 1].focus();
                                        }
                                      }, 50);
                                    }
                                  }}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    // Handle empty
                                    if (!val) {
                                      setBlankAnswers({ ...blankAnswers, [key]: "" });
                                      return;
                                    }

                                    // Get only the last character 
                                    const char = val.slice(-1); 
                                    
                                    const newBlankAnswers = { ...blankAnswers, [key]: char };
                                    setBlankAnswers(newBlankAnswers);
                                    
                                    // Construct the full answer string
                                    const sortedBlanks = [...(currentQuestion.blanks || [])].sort((a, b) => a - b);
                                    const words = currentQuestion.q.split(/\s+/).filter(Boolean);
                                    const combined = sortedBlanks.map((wIdx: number) => {
                                      const w = words[wIdx];
                                      return w.split('').map((_: string, cIdx: number) => newBlankAnswers[`${wIdx}-${cIdx}`] || "").join('');
                                    }).join(", ");
                                    setAnswer(combined);

                                    // Smart focus: Only move if it's NOT composing and is non-Korean or auto-move is handled by onCompositionEnd
                                    if (!isComposing.current && !/^[ㄱ-ㅎㅏ-ㅣ가-힣]$/.test(char)) {
                                      setTimeout(() => {
                                        const inputs = Array.from(document.querySelectorAll('input[data-key]')) as HTMLInputElement[];
                                        const currentIdx = inputs.findIndex(i => i.getAttribute('data-key') === key);
                                        if (currentIdx < inputs.length - 1) {
                                          inputs[currentIdx + 1].focus();
                                        }
                                      }, 50);
                                    }
                                  }}
                                />
                              );
                            })}
                            {blanks.length > 1 && (
                              <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                                {blankIndex + 1}
                              </span>
                            )}
                          </div>
                        );
                      }
                      return <span key={wordIdx} className="text-2xl font-black text-slate-400 px-1">{word}</span>;
                    })}
                 </div>
                 <Button 
                    size="xl" 
                    className="w-full py-8 text-3xl shadow-indigo-200 shadow-lg"
                    onClick={handleSubmit}
                  >
                    제출하기!
                  </Button>
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
