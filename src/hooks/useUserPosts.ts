import { useNostr } from '@nostrify/react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

export function useUserPosts(pubkey: string) {
  const { nostr } = useNostr();

  return useInfiniteQuery({
    queryKey: ['user-posts', pubkey],
    queryFn: async ({ pageParam, signal }) => {
      const filter: any = { 
        kinds: [1], 
        authors: [pubkey],
        limit: 20 
      };
      if (pageParam) filter.until = pageParam;

      const events = await nostr.query([filter], {
        signal: AbortSignal.any([signal, AbortSignal.timeout(3000)])
      });

      // Sort by created_at descending
      return events.sort((a, b) => b.created_at - a.created_at);
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) return undefined;
      return lastPage[lastPage.length - 1].created_at - 1;
    },
    initialPageParam: undefined,
    enabled: !!pubkey,
  });
}

export function useUserStats(pubkey: string) {
  const { nostr } = useNostr();

  return useInfiniteQuery({
    queryKey: ['user-stats', pubkey],
    queryFn: async ({ signal }) => {
      // Get user's posts, followers, and following
      const [posts, followers, following] = await Promise.all([
        // User's posts
        nostr.query([{ kinds: [1], authors: [pubkey], limit: 1000 }], { 
          signal: AbortSignal.any([signal, AbortSignal.timeout(2000)]) 
        }),
        // People following this user (kind 3 events that include this user's pubkey)
        nostr.query([{ kinds: [3], '#p': [pubkey], limit: 500 }], { 
          signal: AbortSignal.any([signal, AbortSignal.timeout(2000)]) 
        }),
        // Who this user follows (their contact list)
        nostr.query([{ kinds: [3], authors: [pubkey], limit: 1 }], { 
          signal: AbortSignal.any([signal, AbortSignal.timeout(2000)]) 
        })
      ]);

      const followingCount = following[0]?.tags.filter(tag => tag[0] === 'p').length || 0;

      return {
        postsCount: posts.length,
        followersCount: followers.length,
        followingCount
      };
    },
    getNextPageParam: () => undefined,
    initialPageParam: undefined,
    enabled: !!pubkey,
  });
}