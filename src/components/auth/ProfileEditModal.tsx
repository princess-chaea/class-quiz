"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { useDialog } from "@/components/ui/DialogProvider";
import { X, Upload, User as UserIcon } from "lucide-react";
import Image from "next/image";

interface ProfileEditModalProps {
  onClose: () => void;
}

export function ProfileEditModal({ onClose }: ProfileEditModalProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [schoolName, setSchoolName] = useState(profile?.school_name || "");
  const [name, setName] = useState(profile?.name || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { showAlert } = useDialog();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleSave = async () => {
    // 실제로 바뀐 내용만 객체에 담음
    const updates: any = {
      id: user.id,
    };

    if (schoolName.trim() !== (profile?.school_name || "")) {
      updates.school_name = schoolName.trim();
    }
    if (name.trim() !== (profile?.name || "")) {
      updates.name = name.trim();
    }
    if (avatarUrl !== (profile?.avatar_url || "")) {
      updates.avatar_url = avatarUrl;
    }

    // 실제로 바뀐 내용이 없을 경우 알림
    if (Object.keys(updates).length <= 1) { // id만 있는 경우
      await showAlert("변경된 내용이 없습니다.");
      return;
    }

    setSaving(true);
    try {
      // upsert 대신 update를 사용하여 명시적으로 해당 ID의 데이터만 수정
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq('id', user.id);
        
      if (error) throw error;
      await refreshProfile();
      onClose();
    } catch (err: any) {
      await showAlert("저장 실패: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
    } catch (error: any) {
      await showAlert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative animate-pop">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
        >
          <X size={24} />
        </button>
        
        <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-2">
          <UserIcon className="text-indigo-500" /> 프로필 수정
        </h2>
        
        <div className="flex flex-col items-center mb-8">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-indigo-100 bg-gray-50 flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={40} className="text-indigo-300" />
              )}
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Upload className="text-white" size={24} />
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={uploadAvatar} 
              accept="image/*" 
              className="hidden" 
              disabled={uploading}
            />
          </div>
          {uploading && <p className="text-xs text-indigo-500 mt-2 font-bold animate-pulse">이미지 업로드 중...</p>}
          <p className="text-xs text-gray-400 mt-2 font-medium">아이콘을 눌러 프로필 사진을 변경하세요</p>
        </div>

        <div className="space-y-4 mb-8">
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-2">학교 이름</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:bg-white outline-none font-bold transition-all"
              placeholder="학교 이름을 입력하세요"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-2">선생님 성함</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:bg-white outline-none font-bold transition-all"
              placeholder="성함을 입력하세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="ghost" 
            className="flex-1 py-4 text-gray-500 font-bold"
            onClick={onClose}
          >
            취소
          </Button>
          <Button 
            variant="primary" 
            className="flex-[2] py-4 text-lg shadow-lg shadow-indigo-100"
            onClick={handleSave}
            disabled={saving || uploading}
          >
            {saving ? "저장 중..." : "저장하기"}
          </Button>
        </div>
      </div>
    </div>
  );
}
