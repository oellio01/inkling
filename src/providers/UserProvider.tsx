"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import supabase from "../app/supabaseClient";
import type { User } from "@supabase/supabase-js";

interface UserContextType {
  user: User | null;
  loading: boolean;
  isFistTimeUser: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  isFistTimeUser: false,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function ensureAnonUser() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        await supabase.auth.signInAnonymously();
        setIsFirstTimeUser(true);
      } else {
        // Check if this user has played before by looking for any game results
        const { data: gameResults } = await supabase
          .from("game_results")
          .select("id")
          .eq("user_id", data.user.id)
          .limit(1);

        // If no game results exist, this is their first time
        setIsFirstTimeUser(!!gameResults && gameResults.length === 0);
      }
      const { data: userData } = await supabase.auth.getUser();
      if (mounted) {
        setUser(userData.user);
        setLoading(false);
      }
    }
    ensureAnonUser();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <UserContext.Provider
      value={{ user, loading, isFistTimeUser: isFirstTimeUser }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
