import { useNostr } from '@nostrify/react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { useCurrentUser } from './useCurrentUser';

export function useExploreFeed() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useInfiniteQuery({
    queryKey: ['explore-feed', user?.pubkey],
    queryFn: async ({ pageParam, signal }) => {
      let filter: any;

      // If user is logged out, show posts matching domain:gleasonator.dev
      // If user is logged in, show posts from entire nostr network
      if (!user) {
        filter = {
          kinds: [1, 6], // Both text notes and reposts
          search: 'domain:gleasonator.dev',
          limit: 30
        };
      } else {
        filter = {
          kinds: [1], // Only kind 1 text notes for full network
          limit: 30 // Good batch size for discovery
        };
      }

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