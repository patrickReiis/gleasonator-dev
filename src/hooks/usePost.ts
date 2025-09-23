import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

export function usePost(eventId: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['post', eventId],
    queryFn: async ({ signal }) => {
      const events = await nostr.query([
        { ids: [eventId] }
      ], { 
        signal: AbortSignal.any([signal, AbortSignal.timeout(3000)])
      });

      return events[0] || null;
    },
    enabled: !!eventId,
  });
}

export function usePostReplies(eventId: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['post-replies', eventId],
    queryFn: async ({ signal }) => {
      const events = await nostr.query([
        {
          kinds: [1], // Only text note replies
          '#e': [eventId],
          limit: 100,
        }
      ], { 
        signal: AbortSignal.any([signal, AbortSignal.timeout(3000)])
      });

      // Sort replies by created_at ascending (oldest first)
      return events.sort((a, b) => a.created_at - b.created_at);
    },
    enabled: !!eventId,
  });
}