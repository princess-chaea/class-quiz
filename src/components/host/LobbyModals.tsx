"use client";

import { X, UserMinus, ShieldAlert, UserCog, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface KickConfirmModalProps {
  playerName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function KickConfirmModal({ playerName, onConfirm, onCancel }: KickConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center animate-pop">
        <div className="bg-red-100 text-red-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <UserMinus size={40} />
        </div>
        <h3 className="text-2xl font-jua text-gray-800 mb-2">{playerName} 학생을 <br/> 강퇴하시겠습니까?</h3>
        <p className="text-gray-500 font-bold mb-8">한번 퇴장한 이름으로는 <br/> 다시 입장하기 어려울 수 있습니다.</p>
        
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1 py-4" onClick={onCancel}>취소</Button>
          <Button variant="danger" className="flex-1 py-4 shadow-lg shadow-red-100" onClick={onConfirm}>강퇴하기</Button>
        </div>
      </div>
    </div>
  );
}

interface ChangeTeamModalProps {
  player: { nickname: string, id: string, team: string | null };
  teamCount: number;
  onConfirm: (team: 'RED' | 'BLUE' | 'GREEN' | 'YELLOW') => void;
  onCancel: () => void;
}

export function ChangeTeamModal({ player, teamCount, onConfirm, onCancel }: ChangeTeamModalProps) {
  const teams: ('RED' | 'BLUE' | 'GREEN' | 'YELLOW')[] = ['RED', 'BLUE', 'GREEN', 'YELLOW'];
  const activeTeams = teams.slice(0, teamCount);
  
  const teamNames = {
    RED: '빨강팀',
    BLUE: '파랑팀',
    GREEN: '초록팀',
    YELLOW: '노랑팀'
  };

  const teamColors = {
    RED: 'bg-red-500',
    BLUE: 'bg-blue-500',
    GREEN: 'bg-green-500',
    YELLOW: 'bg-yellow-400'
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-pop">
        <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <UserCog size={24} />
            <h3 className="text-xl font-jua">팀 변경: {player.nickname}</h3>
          </div>
          <button onClick={onCancel} className="hover:bg-white/20 p-1 rounded-lg">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-8">
          <p className="text-gray-500 font-bold mb-6 text-center">이동할 팀을 선택해주세요.</p>
          <div className="grid grid-cols-2 gap-4">
            {activeTeams.map(team => (
              <button
                key={team}
                onClick={() => onConfirm(team)}
                className={`p-4 rounded-2xl border-4 text-white font-black text-lg transition-transform active:scale-95 ${teamColors[team]} ${player.team === team ? 'ring-4 ring-indigo-200 border-white' : 'border-transparent opacity-80 hover:opacity-100 hover:scale-105'}`}
              >
                {teamNames[team]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
