import { useNostr } from '@nostrify/react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { deduplicateEvents, sortEventsByDate } from '@/lib/eventUtils';
import { useUserContacts } from './useUserContacts';
import { useCurrentUser } from './useCurrentUser';

export function useGlobalFeed() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { data: followedPubkeys } = useUserContacts();

  return useInfiniteQuery({
    queryKey: ['global-feed', user?.pubkey, followedPubkeys],
    queryFn: async ({ pageParam, signal }) => {
      const filter: any = { kinds: [1], limit: 20 };
      if (pageParam) filter.until = pageParam;

      // If user is logged in and has followed users, filter by those pubkeys
      if (user?.pubkey && followedPubkeys && followedPubkeys.length > 0) {
        filter.authors = [user.pubkey, ...followedPubkeys]; // Include user's own posts + followed users
      }

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
    enabled: !user || (followedPubkeys !== undefined), // Only run when we know if user has contacts or not
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