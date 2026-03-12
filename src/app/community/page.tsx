"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { 
  Users, 
  ChevronLeft, 
  MessageSquare, 
  Trash2, 
  Edit3, 
  X, 
  Send,
  MoreVertical
} from "lucide-react";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { useDialog } from "@/components/ui/DialogProvider";
import { Spinner } from "@/components/ui/Spinner";
import { Footer } from "@/components/layout/Footer";

export default function CommunityPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  const [activePost, setActivePost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const { showAlert, showConfirm } = useDialog();

  const isAdmin = user?.email === "dltjdrms320@gmail.com";

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const { data } = await supabase.from("posts").select("*, profiles(school_name, name, avatar_url)").order("created_at", { ascending: false });
    setPosts(data || []);
    setLoading(false);
  };

  const handleCreatePost = async () => {
    if (!user) {
      await showAlert("로그인이 필요합니다.");
      return;
    }
    if (!newTitle.trim() || !newContent.trim()) {
      await showAlert("제목과 내용을 모두 입력해주세요.");
      return;
    }
    
    const { error } = await supabase.from("posts").insert([{
      user_id: user.id,
      author_email: user.email,
      title: newTitle,
      content: newContent
    }]);
    
    if (error) {
      await showAlert("등록 실패: " + error.message);
    } else {
      setIsWriteModalOpen(false);
      setNewTitle("");
      setNewContent("");
      fetchPosts();
    }
  };

  const handleDeletePost = async (postId: string) => {
    const confirmed = await showConfirm("정말로 삭제하시겠습니까?");
    if (!confirmed) return;
    
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) {
      await showAlert("삭제 실패: " + error.message);
    } else {
      if (activePost?.id === postId) setActivePost(null);
      fetchPosts();
    }
  };

  const openPost = async (post: any) => {
    setActivePost(post);
    fetchComments(post.id);
  };

  const fetchComments = async (postId: string) => {
    const { data } = await supabase.from("comments").select("*, profiles(school_name, name, avatar_url)").eq("post_id", postId).order("created_at", { ascending: true });
    setComments(data || []);
  };

  const handleAddComment = async () => {
    if (!user) {
      await showAlert("로그인이 필요합니다.");
      return;
    }
    if (!newComment.trim()) return;
    
    const { error } = await supabase.from("comments").insert([{
      post_id: activePost.id,
      user_id: user.id,
      author_email: user.email,
      content: newComment
    }]);
    
    if (error) {
      await showAlert("댓글 작성 실패: " + error.message);
    } else {
      setNewComment("");
      fetchComments(activePost.id);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const confirmed = await showConfirm("댓글을 삭제하시겠습니까?");
    if (!confirmed) return;
    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    if (!error) fetchComments(activePost.id);
  };

  const canModify = (authorId: string) => {
    if (!user) return false;
    return user.id === authorId || isAdmin;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navbar */}
      <TopNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex gap-8 relative items-start">
        
        {/* Post List */}
        <div className={`flex flex-col gap-4 transition-all ${activePost ? 'w-full md:w-1/3 opacity-30 md:opacity-100 pointer-events-none md:pointer-events-auto' : 'w-full'}`}>
          <div className="flex justify-between items-center mb-2 px-2">
            <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
              <Users className="text-indigo-500" /> 커뮤니티 게시판
            </h2>
            {user && (
              <Button 
                variant="primary" 
                className="rounded-xl px-4 py-2 shadow-sm"
                onClick={() => setIsWriteModalOpen(true)}
              >
                <Edit3 size={16} className="mr-2" /> 새 글 쓰기
              </Button>
            )}
          </div>
          {loading ? (
            <Spinner label="글 목록 불러오는 중..." />
          ) : posts.length === 0 ? (
            <div className="text-center py-20 bg-white border border-gray-100 rounded-3xl shadow-sm">
              <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">아직 등록된 글이 없습니다</h3>
              <p className="text-gray-400 text-sm">첫 번째 글을 작성해보세요!</p>
            </div>
          ) : (
            posts.map(post => (
              <div 
                key={post.id} 
                className={`bg-white rounded-3xl p-6 shadow-sm border cursor-pointer hover:shadow-md transition-all ${activePost?.id === post.id ? 'border-indigo-400 ring-4 ring-indigo-50' : 'border-gray-200 hover:border-indigo-200'}`}
                onClick={() => openPost(post)}
              >
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{post.title}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{post.content}</p>
                
                <div className="flex justify-between items-center text-xs font-bold text-gray-400">
                  <div className="flex items-center gap-2">
                    {post.profiles?.avatar_url ? (
                      <img src={post.profiles.avatar_url} alt="avatar" className="w-6 h-6 rounded-full object-cover shadow-sm" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-200 to-purple-200 flex items-center justify-center text-indigo-700 text-xs shadow-sm">
                        {post.profiles?.name ? post.profiles.name.charAt(0) : post.author_email.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {post.profiles?.school_name && post.profiles?.name 
                      ? `${post.profiles.school_name} ${post.profiles.name} 선생님` 
                      : post.author_email.split('@')[0]}
                  </div>
                  <div>
                    {new Date(post.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Post Detail View (Desktop Overlay / Mobile Modal) */}
        {activePost && (
          <div className="absolute inset-0 md:inset-auto md:relative flex-1 bg-white md:rounded-3xl shadow-2xl md:shadow-sm border-0 md:border border-gray-200 z-10 flex flex-col h-full md:h-auto md:min-h-[600px] animate-fade-in overflow-hidden">
            {/* Detail Header */}
            <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-gray-50/50">
              <div className="flex-1 mr-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 break-words">{activePost.title}</h2>
                <div className="flex items-center gap-3 text-sm font-bold text-gray-500">
                  {activePost.profiles?.avatar_url ? (
                    <img src={activePost.profiles.avatar_url} alt="avatar" className="w-8 h-8 rounded-full object-cover shadow-sm" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-200 to-purple-200 flex items-center justify-center text-indigo-700 text-lg shadow-sm">
                      {activePost.profiles?.name ? activePost.profiles.name.charAt(0) : activePost.author_email.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-gray-900">
                      {activePost.profiles?.school_name && activePost.profiles?.name 
                        ? `${activePost.profiles.school_name} ${activePost.profiles.name} 선생님` 
                        : activePost.author_email}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">{new Date(activePost.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canModify(activePost.user_id) && (
                  <button onClick={() => handleDeletePost(activePost.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                    <Trash2 size={20} />
                  </button>
                )}
                <button onClick={() => setActivePost(null)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Detail Content */}
            <div className="p-8 border-b border-gray-100 min-h-[150px] whitespace-pre-wrap text-gray-700 leading-relaxed text-lg">
              {activePost.content}
            </div>

            {/* Comments Section */}
            <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden">
              <div className="p-6 font-bold text-gray-600 border-b border-gray-200 flex justify-between items-center bg-white">
                <span>댓글 {comments.length}개</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                {comments.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 font-medium">첫 번째 댓글을 남겨보세요.</div>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 group">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          {comment.profiles?.avatar_url ? (
                            <img src={comment.profiles.avatar_url} alt="avatar" className="w-6 h-6 rounded-full object-cover shadow-sm" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-200 to-purple-200 flex items-center justify-center text-indigo-700 text-xs shadow-sm">
                              {comment.profiles?.name ? comment.profiles.name.charAt(0) : comment.author_email.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="font-bold text-sm text-gray-900">
                            {comment.profiles?.school_name && comment.profiles?.name
                              ? `${comment.profiles.school_name} ${comment.profiles.name} 선생님`
                              : comment.author_email.split('@')[0]}
                          </span>
                          <span className="text-xs text-gray-400 font-medium">{new Date(comment.created_at).toLocaleString()}</span>
                        </div>
                        {canModify(comment.user_id) && (
                          <button 
                            onClick={() => handleDeleteComment(comment.id)} 
                            className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Comment Input */}
              {user ? (
                <div className="p-4 bg-white border-t border-gray-200">
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      className="flex-1 bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2 focus:bg-white focus:border-indigo-400 outline-none transition-colors"
                      placeholder="댓글을 입력하세요..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <Button variant="primary" className="rounded-xl px-4" onClick={handleAddComment}>
                      <Send size={18} />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-white border-t border-gray-200 text-center">
                  <p className="text-gray-400 font-bold mb-2">로그인 후 댓글을 작성할 수 있습니다.</p>
                  <Button variant="ghost" onClick={() => router.push("/")}>로그인 페이지로 이동</Button>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Write Modal */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-pop">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-2xl font-bold flex items-center gap-2 relative z-10 text-gray-800">
                <Edit3 className="text-indigo-500" /> 커뮤니티 글쓰기
              </h2>
              <button 
                onClick={() => setIsWriteModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 flex flex-col gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-2">제목</label>
                <input 
                  type="text" 
                  className="w-full text-xl font-bold px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-400 outline-none transition-colors"
                  placeholder="제목을 입력하세요"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-2 flex-1">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-2">내용</label>
                <textarea 
                  className="w-full h-64 text-base font-medium px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-400 outline-none transition-colors resize-none leading-relaxed"
                  placeholder="선생님들과 나누고 싶은 이야기를 자유롭게 작성해주세요. (질문, 팁 공유, 피드백 등)"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                />
              </div>
            </div>
            
            <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-3">
              <Button variant="ghost" className="rounded-xl px-6" onClick={() => setIsWriteModalOpen(false)}>
                취소
              </Button>
              <Button variant="primary" className="rounded-xl px-8 shadow-lg shadow-indigo-100" onClick={handleCreatePost}>
                등록하기
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
