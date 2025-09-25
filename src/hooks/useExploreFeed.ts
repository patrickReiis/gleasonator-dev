import { useNostr } from '@nostrify/react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

export function useExploreFeed() {
  const { nostr } = useNostr();

  return useInfiniteQuery({
    queryKey: ['explore-feed'],
    queryFn: async ({ pageParam, signal }) => {
      const filter: any = { 
        kinds: [1], // Only kind 1 text notes
        limit: 30 // Good batch size for discovery
      };
      if (pageParam) filter.until = pageParam;

      const events = await nostr.query([filter], {
        signal: AbortSignal.any([signal, AbortSignal.timeout(3000)])
      });

      // Sort by created_at descending and remove duplicates
      const uniqueEvents = events
        .sort((a, b) => b.created_at - a.created_at)
        .filter((event, index, arr) => 
          arr.findIndex(e => e.id === event.id) === index
        );

      console.log('Explore feed events received:', uniqueEvents.length);
      return uniqueEvents;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) return undefined;
      return lastPage[lastPage.length - 1].created_at - 1;
    },
    initialPageParam: undefined,
  });
}