import { useNostr } from '@nostrify/react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { isReply, getRootEventId, getParentEventId } from '@/lib/replyUtils';

interface ReplyThreadOptions {
  limit?: number;
  includeRoot?: boolean;
}

/**
 * Fetch a complete reply thread for a given event
 */
export function useReplyThread(eventId: string, options: ReplyThreadOptions = {}) {
  const { nostr } = useNostr();
  const { limit = 50, includeRoot = true } = options;

  // First, get the root event if this is a reply
  const rootQuery = useQuery({
    queryKey: ['reply-thread-root', eventId],
    queryFn: async ({ signal }) => {
      try {
        // Get the event to check if it's a reply
        const [event] = await nostr.query([{ ids: [eventId], limit: 1 }], {
          signal: AbortSignal.any([signal, AbortSignal.timeout(2000)])
        });

        if (!event || !isReply(event)) {
          return null;
        }

        const rootId = getRootEventId(event);
        if (!rootId) {
          return null;
        }

        // Fetch the root event
        const [rootEvent] = await nostr.query([{ ids: [rootId], limit: 1 }], {
          signal: AbortSignal.any([signal, AbortSignal.timeout(2000)])
        });

        return rootEvent || null;
      } catch {
        return null;
      }
    },
    enabled: includeRoot,
  });

  // Get all replies in the thread
  const repliesQuery = useInfiniteQuery({
    queryKey: ['reply-thread-replies', eventId, limit],
    queryFn: async ({ pageParam, signal }) => {
      const filter: any = {
        kinds: [1],
        '#e': [eventId],
        limit: limit,
      };

      if (pageParam) {
        filter.until = pageParam;
      }

      const events = await nostr.query([filter], {
        signal: AbortSignal.any([signal, AbortSignal.timeout(3000)])
      });

      // Sort by created_at ascending for thread display
      return events.sort((a, b) => a.created_at - b.created_at);
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) return undefined;
      return lastPage[lastPage.length - 1].created_at + 1; // Get older posts
    },
    initialPageParam: undefined,
    enabled: !!eventId,
  });

  // Get the event itself
  const eventQuery = useQuery({
    queryKey: ['reply-thread-event', eventId],
    queryFn: async ({ signal }) => {
      const [event] = await nostr.query([{ ids: [eventId], limit: 1 }], {
        signal: AbortSignal.any([signal, AbortSignal.timeout(2000)])
      });
      return event;
    },
    enabled: !!eventId,
  });

  return {
    rootEvent: rootQuery.data,
    event: eventQuery.data,
    replies: repliesQuery.data?.pages.flat() || [],
    isLoading: rootQuery.isLoading || eventQuery.isLoading || repliesQuery.isLoading,
    isError: rootQuery.isError || eventQuery.isError || repliesQuery.isError,
    fetchNextPage: repliesQuery.fetchNextPage,
    hasNextPage: repliesQuery.hasNextPage,
    isFetchingNextPage: repliesQuery.isFetchingNextPage,
  };
}

/**
 * Fetch direct replies to a specific event
 */
export function useDirectReplies(eventId: string, limit = 20) {
  const { nostr } = useNostr();

  return useInfiniteQuery({
    queryKey: ['direct-replies', eventId, limit],
    queryFn: async ({ pageParam, signal }) => {
      const filter: any = {
        kinds: [1],
        '#e': [eventId],
        limit: limit,
      };

      if (pageParam) {
        filter.until = pageParam;
      }

      const events = await nostr.query([filter], {
        signal: AbortSignal.any([signal, AbortSignal.timeout(2000)])
      });

      // Sort by created_at ascending (oldest first)
      return events.sort((a, b) => a.created_at - b.created_at);
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) return undefined;
      return lastPage[lastPage.length - 1].created_at + 1;
    },
    initialPageParam: undefined,
  });
}