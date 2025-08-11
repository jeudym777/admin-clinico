import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";

export function useSessionUser() {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);
  return userId;
}