"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { 
  Search, 
  Library, 
  Copy, 
  ChevronLeft,
  GraduationCap,
  BookOpen,
  Filter
} from "lucide-react";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { useDialog } from "@/components/ui/DialogProvider";
import { Spinner } from "@/components/ui/Spinner";
import { Footer } from "@/components/layout/Footer";

export default function LibraryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const { showAlert } = useDialog();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*, profiles(school_name, name, avatar_url)")
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuizzes(data || []);
    } catch (err) {
      console.error("퀴즈를 불러오는 데 실패했습니다", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyQuiz = async (quiz: any) => {
    if (!user) {
      await showAlert("로그인이 필요합니다.");
      router.push("/");
      return;
    }

    setCopyingId(quiz.id);
    try {
      const { data, error } = await supabase
        .from("quizzes")
        .insert([{
          user_id: user.id,
          title: `${quiz.title} (복사본)`,
          questions: quiz.questions,
          is_public: false, // Default copied quizzes to private
          school_level: quiz.school_level,
          subjects: quiz.subjects
        }])
        .select()
        .single();

      if (error) throw error;
      
      await showAlert("내 퀴즈로 복사되었습니다! 대시보드로 이동합니다.");
      router.push("/dashboard");
    } catch (err) {
      await showAlert("복사 실패: " + (err as Error).message);
    } finally {
      setCopyingId(null);
    }
  };

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchLevel = filterLevel === "all" || quiz.school_level === filterLevel;
    const matchSubject = filterSubject === "all" || (quiz.subjects && quiz.subjects.includes(filterSubject));
    return matchSearch && matchLevel && matchSubject;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navbar */}
      <TopNavbar />

      <main className="flex-1 max-w-6xl w-full mx-auto p-8 flex flex-col gap-8">
        
        {/* Filters */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-400 focus:bg-white outline-none transition-all font-bold placeholder:font-medium"
              placeholder="퀴즈 검색..."
            />
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-2">
              <GraduationCap className="text-gray-400" size={18} />
              <select 
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="bg-transparent font-bold outline-none text-gray-700 cursor-pointer"
              >
                <option value="all">모든 학교</option>
                <option value="초">초등학교</option>
                <option value="중">중학교</option>
                <option value="고">고등학교</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2 bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-2">
              <BookOpen className="text-gray-400" size={18} />
              <select 
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="bg-transparent font-bold outline-none text-gray-700 cursor-pointer"
              >
                <option value="all">모든 과목</option>
                <option value="국어">국어</option>
                <option value="수학">수학</option>
                <option value="사회">사회</option>
                <option value="과학">과학</option>
                <option value="영어">영어</option>
                <option value="정보">정보</option>
                <option value="기타">기타</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quiz Grid */}
        {loading ? (
          <Spinner label="라이브러리 불러오는 중..." />
        ) : filteredQuizzes.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <Filter size={48} className="text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-700 mb-2">검색 결과가 없습니다</h2>
            <p className="text-gray-400">다른 조건으로 검색해보세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map(quiz => (
              <div key={quiz.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 hover:shadow-xl hover:shadow-indigo-50 hover:-translate-y-1 transition-all flex flex-col group">
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {quiz.school_level && (
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-black">
                        {quiz.school_level}학교
                      </span>
                    )}
                    {quiz.subjects && quiz.subjects.map((subj: string) => (
                      <span key={subj} className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black">
                        {subj}
                      </span>
                    ))}
                    {!quiz.school_level && (!quiz.subjects || quiz.subjects.length === 0) && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-black">
                        분류 없음
                      </span>
                    )}
                  </div>
                  <h3 className="font-jua text-2xl mb-2 text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {quiz.title}
                  </h3>
                  
                  <div className="flex justify-between items-center mb-6">
                    <p className="text-sm font-bold text-gray-400">
                      {quiz.questions?.length || 0}문제
                    </p>
                    
                    {quiz.profiles && (
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 pr-3 pl-1 py-1 rounded-full border border-gray-100">
                        {quiz.profiles.avatar_url ? (
                          <img src={quiz.profiles.avatar_url} alt="avatar" className="w-5 h-5 rounded-full object-cover" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            {quiz.profiles.name.charAt(0)}
                          </div>
                        )}
                        <span>{quiz.profiles.school_name} {quiz.profiles.name}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100 mt-auto">
                  <Button 
                    variant="ghost" 
                    className="w-full rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 group/btn"
                    onClick={() => handleCopyQuiz(quiz)}
                    disabled={copyingId === quiz.id}
                  >
                    {copyingId === quiz.id ? '복사 중...' : (
                      <>
                        <Copy size={16} className="mr-2 text-gray-400 group-hover/btn:text-indigo-500" /> 내 퀴즈로 가져오기
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
