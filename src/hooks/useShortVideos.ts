import { useNostr } from '@nostrify/react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

// Validator for NIP-71 video events
function validateVideoEvent(event: NostrEvent): boolean {
  // Check if it's a video event kind (21 for normal videos, 22 for short videos)
  if (![21, 22].includes(event.kind)) return false;

  // Check for required tags according to NIP-71
  const url = event.tags.find(([name]) => name === 'url')?.[1];
  const title = event.tags.find(([name]) => name === 'title')?.[1];

  // Video events require at least a URL
  if (!url) return false;

  return true;
}

export function useShortVideos() {
  const { nostr } = useNostr();

  return useInfiniteQuery({
    queryKey: ['short-videos'],
    queryFn: async ({ pageParam, signal }) => {
      const filter: any = { 
        kinds: [22], // Kind 22 for short videos according to NIP-71
        limit: 10 // Smaller batches for video content
      };
      if (pageParam) filter.until = pageParam;

      const events = await nostr.query([filter], {
        signal: AbortSignal.any([signal, AbortSignal.timeout(5000)])
      });

      // Filter events through validator and sort by created_at descending
      const validEvents = events
        .filter(validateVideoEvent)
        .sort((a, b) => b.created_at - a.created_at);

      return validEvents;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) return undefined;
      return lastPage[lastPage.length - 1].created_at - 1;
    },
    initialPageParam: undefined,
  });
}

// Helper function to extract video data from NIP-71 event
export function extractVideoData(event: NostrEvent) {
  const url = event.tags.find(([name]) => name === 'url')?.[1] || '';
  const title = event.tags.find(([name]) => name === 'title')?.[1] || '';
  const thumbnail = event.tags.find(([name]) => name === 'thumb')?.[1] || '';
  const duration = event.tags.find(([name]) => name === 'duration')?.[1] || '';
  const description = event.content || '';
  const hashtags = event.tags.filter(([name]) => name === 't').map(([, tag]) => tag);
  
  return {
    url,
    title,
    thumbnail,
    duration: duration ? parseInt(duration) : undefined,
    description,
    hashtags,
  };
}