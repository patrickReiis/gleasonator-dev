import { useNostr } from '@nostrify/react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

// Validator for NIP-71 video events
function validateVideoEvent(event: NostrEvent): boolean {
  // Check if it's a video event kind (21 for normal videos, 22 for short videos)
  if (![21, 22].includes(event.kind)) return false;

  // Check for required tags according to NIP-71
  const title = event.tags.find(([name]) => name === 'title')?.[1];
  const imetaTags = event.tags.filter(([name]) => name === 'imeta');

  // Video events require a title and at least one imeta tag with a video URL
  if (!title || imetaTags.length === 0) return false;

  // Check if at least one imeta tag has a video URL
  const hasVideoUrl = imetaTags.some(tag => {
    const urlEntry = tag.find(entry => entry.startsWith('url '));
    const mimeEntry = tag.find(entry => entry.startsWith('m '));

    if (!urlEntry) return false;

    // Check if it's a video MIME type
    if (mimeEntry) {
      const mimeType = mimeEntry.replace('m ', '');
      return mimeType.startsWith('video/') || mimeType === 'application/x-mpegURL';
    }

    // Fallback: check if URL looks like a video
    const url = urlEntry.replace('url ', '');
    return /\.(mp4|webm|ogg|m3u8|mov|avi)(\?[^\s]*)?$/i.test(url);
  });

  return hasVideoUrl;
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

      // Debug logging
      console.log('Raw events received:', events.length);
      console.log('Events by kind:', events.reduce((acc, e) => {
        acc[e.kind] = (acc[e.kind] || 0) + 1;
        return acc;
      }, {} as Record<number, number>));

      if (events.length > 0) {
        console.log('Sample event:', events[0]);
      }

      // Filter events through validator and sort by created_at descending
      const validEvents = events
        .filter(event => {
          const isValid = validateVideoEvent(event);
          if (!isValid && [21, 22].includes(event.kind)) {
            console.log('Invalid video event:', event);
          }
          return isValid;
        })
        .sort((a, b) => b.created_at - a.created_at);

      console.log('Valid video events:', validEvents.length);
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
  const title = event.tags.find(([name]) => name === 'title')?.[1] || '';
  const duration = event.tags.find(([name]) => name === 'duration')?.[1] || '';
  const description = event.content || '';
  const hashtags = event.tags.filter(([name]) => name === 't').map(([, tag]) => tag);
  const publishedAt = event.tags.find(([name]) => name === 'published_at')?.[1] || '';
  const alt = event.tags.find(([name]) => name === 'alt')?.[1] || '';

  // Parse imeta tags to get video URLs and thumbnails
  const imetaTags = event.tags.filter(([name]) => name === 'imeta');

  let primaryVideo = null;
  let thumbnail = '';
  const videoVariants: Array<{
    url: string;
    dimension?: string;
    mimeType?: string;
    fallbackUrls: string[];
    thumbnails: string[];
  }> = [];

  for (const imetaTag of imetaTags) {
    const urlEntry = imetaTag.find(entry => entry.startsWith('url '));
    const dimEntry = imetaTag.find(entry => entry.startsWith('dim '));
    const mimeEntry = imetaTag.find(entry => entry.startsWith('m '));
    const imageEntries = imetaTag.filter(entry => entry.startsWith('image '));
    const fallbackEntries = imetaTag.filter(entry => entry.startsWith('fallback '));

    if (!urlEntry) continue;

    const url = urlEntry.replace('url ', '');
    const dimension = dimEntry?.replace('dim ', '');
    const mimeType = mimeEntry?.replace('m ', '');
    const thumbnails = imageEntries.map(entry => entry.replace('image ', ''));
    const fallbackUrls = fallbackEntries.map(entry => entry.replace('fallback ', ''));

    // Check if this is a video entry
    const isVideo = (mimeType && (mimeType.startsWith('video/') || mimeType === 'application/x-mpegURL')) ||
                   /\.(mp4|webm|ogg|m3u8|mov|avi)(\?[^\s]*)?$/i.test(url);

    if (isVideo) {
      const variant = {
        url,
        dimension,
        mimeType,
        fallbackUrls,
        thumbnails
      };

      videoVariants.push(variant);

      // Use the first video as primary, or prefer certain formats
      if (!primaryVideo ||
          (mimeType === 'video/mp4' && primaryVideo.mimeType !== 'video/mp4')) {
        primaryVideo = variant;
      }

      // Use first available thumbnail
      if (!thumbnail && thumbnails.length > 0) {
        thumbnail = thumbnails[0];
      }
    }
  }

  return {
    url: primaryVideo?.url || '',
    title,
    thumbnail,
    duration: duration ? parseInt(duration) : undefined,
    description,
    hashtags,
    publishedAt,
    alt,
    videoVariants,
    fallbackUrls: primaryVideo?.fallbackUrls || [],
  };
}