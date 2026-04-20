"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import supabase from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

interface UserContextType {
  user: User | null;
  firstTimeUser: boolean;
  loading: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  firstTimeUser: true,
  loading: true,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firstTimeUser, setFirstTimeUser] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function ensureAnonUser() {
      const { data } = await supabase.auth.getUser();
      let isFirstTime = false;
      if (!data.user) {
        await supabase.auth.signInAnonymously();
        isFirstTime = true;
      }
      const { data: userData } = await supabase.auth.getUser();
      if (mounted) {
        setUser(userData.user);
        setFirstTimeUser(isFirstTime);
        setLoading(false);
      }
    }
    ensureAnonUser();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, firstTimeUser, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
