import { supabase } from "@/supabaseClient";
import { useAuth } from "./useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useSignOut = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) return;
      await supabase.auth.signOut();
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
};
