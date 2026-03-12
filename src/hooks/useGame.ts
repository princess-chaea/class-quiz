import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface Game {
  id: string;
  code: string;
  quiz_id: string | null;
  host_id: string;
  status: 'WAITING' | 'PLAYING' | 'RESULT' | 'ENDED';
  current_q_index: number;
  current_hint_stage: number;
  options: any;
}

export interface Player {
  id: string;
  game_id: string;
  nickname: string;
  score: number;
  team: 'RED' | 'BLUE' | 'GREEN' | 'YELLOW' | null;
  buffs: string[];
  is_alive: boolean;
}

export function useGame(quizCode: string) {
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!quizCode) return;

    async function fetchInitialData() {
      try {
        setLoading(true);
        // 1. Fetch Game
        const { data: gameData, error: gameError } = await supabase
          .from('games')
          .select('*')
          .eq('code', quizCode)
          .single();

        if (gameError) throw gameError;
        setGame(gameData);

        // 2. Fetch Players
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('*')
          .eq('game_id', gameData.id);

        if (playersError) throw playersError;
        setPlayers(playersData || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchInitialData();

    // 2. Game Status Subscription
    const gameChannel = supabase
      .channel(`game:${quizCode}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games', filter: `code=eq.${quizCode}` },
        (payload) => {
          setGame(prev => {
            if (!prev) return payload.new as Game;
            // Merge carefully: if payload.new is missing fields (like options), keep them from prev
            return { ...prev, ...payload.new };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gameChannel);
    };
  }, [quizCode]);

  useEffect(() => {
    if (!game?.id) return;

    // 3. Players Subscription - with better error handling and logging
    const playersChannel = supabase
      .channel(`players_sync_${game.id}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'players', 
          filter: `game_id=eq.${game.id}` 
        },
        async (payload) => {
          // Re-fetch all players to ensure consistency
          const { data, error } = await supabase
            .from('players')
            .select('*')
            .eq('game_id', game.id)
            .order('score', { ascending: false })
            .order('created_at', { ascending: true });
          
          if (!error && data) {
            setPlayers(data);
          }
        }
      )
      .subscribe();

    // 4. Polling Fallback (Every 2 seconds)
    const pollInterval = setInterval(async () => {
      // Poll Game
      const { data: g, error: gError } = await supabase.from('games').select('*').eq('id', game.id).maybeSingle();
      if (gError || !g) {
        setGame(null);
        return;
      }
      
      setGame(prev => {
        if (!prev) return g;
        // Only update if status or q_index changed to avoid unnecessary re-renders
        if (prev.status !== g.status || prev.current_q_index !== g.current_q_index || prev.current_hint_stage !== g.current_hint_stage) {
           return { ...prev, ...g };
        }
        return prev;
      });

      // Poll Players
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', game.id)
        .order('score', { ascending: false })
        .order('created_at', { ascending: true });
      
      if (!error && data) {
        setPlayers(data);
      }
    }, 2000);

    return () => {
      supabase.removeChannel(playersChannel);
      clearInterval(pollInterval);
    };
  }, [game?.id]);

  const refreshAction = async () => {
    if (!quizCode) return;
    const { data: g } = await supabase.from('games').select('*').eq('code', quizCode).single();
    if (g) {
      setGame(g);
      const { data: p } = await supabase.from('players').select('*').eq('game_id', g.id);
      if (p) setPlayers(p);
    }
  };

  return { game, players, loading, error, refresh: refreshAction };
}
