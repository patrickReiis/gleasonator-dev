import { useNostr } from '@nostrify/react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { useCurrentUser } from './useCurrentUser';
import { useAppContext } from './useAppContext';

export function useExploreFeed(searchQuery: string = '') {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { config } = useAppContext();

  return useInfiniteQuery({
    queryKey: ['explore-feed', user?.pubkey, searchQuery, config.relayUrl],
    queryFn: async ({ pageParam, signal }) => {
      let filter: any;

      // Build search query
      let searchTerm = searchQuery;

      // If user is logged out and there's a search query, include domain:gleasonator.dev
      if (!user && searchQuery) {
        searchTerm = `domain:gleasonator.dev ${searchQuery}`;
      }

      // Create filter based on whether we have a search term
      filter = {
        kinds: [1], // Only kind 1 text notes
        ...(searchTerm && { search: searchTerm }),
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