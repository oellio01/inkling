import { useState, useEffect, useCallback } from "react";
import { useUser } from "../providers/UserProvider";
import supabase from "../app/supabaseClient";

export function useCompletedGames() {
  const { user } = useUser();
  const [completedGames, setCompletedGames] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchCompletedGames = useCallback(async () => {
    if (!user) {
      setCompletedGames(new Set());
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("game_results")
        .select("game_id")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching completed games:", error);
        setCompletedGames(new Set());
      } else {
        const completedIds = new Set(data?.map(result => result.game_id) || []);
        setCompletedGames(completedIds);
      }
    } catch (error) {
      console.error("Error fetching completed games:", error);
      setCompletedGames(new Set());
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCompletedGames();
  }, [fetchCompletedGames]);

  return {
    completedGames,
    loading,
    refreshArchive: fetchCompletedGames,
    isCompleted: (gameId: number) => completedGames.has(gameId),
  };
} 