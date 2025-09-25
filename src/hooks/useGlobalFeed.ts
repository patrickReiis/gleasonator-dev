import { useNostr } from '@nostrify/react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { deduplicateEvents, sortEventsByDate } from '@/lib/eventUtils';

export function useGlobalFeed() {
  const { nostr } = useNostr();

  return useInfiniteQuery({
    queryKey: ['global-feed'],
    queryFn: async ({ pageParam, signal }) => {
      const filter: any = { kinds: [1], limit: 20 };
      if (pageParam) filter.until = pageParam;

      const events = await nostr.query([filter], {
        signal: AbortSignal.any([signal, AbortSignal.timeout(3000)])
      });

      // Sort by created_at descending (newest first)
      return sortEventsByDate(events, true); // true = newest first
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) return undefined;
      return lastPage[lastPage.length - 1].created_at - 1;
    },
    initialPageParam: undefined,
    select: (data) => {
      // Deduplicate events when selecting data
      return {
        pages: data.pages.map(page => deduplicateEvents(page)),
        pageParams: data.pageParams,
      };
    },
  });
}

export function usePostInteractions(eventId: string) {
  const { nostr } = useNostr();

  return useInfiniteQuery({
    queryKey: ['post-interactions', eventId],
    queryFn: async ({ signal }) => {
      const events = await nostr.query([
        {
          kinds: [1, 6, 7], // replies, reposts, likes
          '#e': [eventId],
          limit: 150,
        }
      ], {
        signal: AbortSignal.any([signal, AbortSignal.timeout(2000)])
      });

      // Deduplicate events
      const uniqueEvents = deduplicateEvents(events);

      // Separate by type
      const replies = uniqueEvents.filter((e) => e.kind === 1);
      const reposts = uniqueEvents.filter((e) => e.kind === 6);
      const likes = uniqueEvents.filter((e) => e.kind === 7);

      return { replies, reposts, likes };
    },
    getNextPageParam: () => undefined, // No pagination for interactions
    initialPageParam: undefined,
  });
}