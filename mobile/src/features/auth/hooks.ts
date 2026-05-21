import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';

// Query keys — centralise them so invalidation is never a guessing game.
export const authKeys = {
  profile: (userId: string) => ['profile', userId] as const,
};

// Fetch the current user's profile row from Supabase.
// TODO: Replace 'profiles' with your actual table name and adjust selected columns.
export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: authKeys.profile(user?.id ?? ''),
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // consider fresh for 5 minutes
  });
}

// Update the current user's profile.
// TODO: Adjust the payload shape to match your profiles table columns.
export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: authKeys.profile(user.id) });
      }
    },
  });
}
