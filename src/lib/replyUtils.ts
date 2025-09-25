import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Check if an event is a reply to another event
 */
export function isReply(event: NostrEvent): boolean {
  return event.tags.some(tag => tag[0] === 'e');
}

/**
 * Get the root event ID from a reply event
 * In Nostr, the last 'e' tag is typically the root, while earlier ones are parent replies
 */
export function getRootEventId(event: NostrEvent): string | undefined {
  const eTags = event.tags.filter(tag => tag[0] === 'e');
  return eTags[eTags.length - 1]?.[1];
}

/**
 * Get the direct parent event ID from a reply event
 * This is typically the first 'e' tag or the one marked as reply
 */
export function getParentEventId(event: NostrEvent): string | undefined {
  const eTags = event.tags.filter(tag => tag[0] === 'e');
  
  // Look for an 'e' tag marked as reply (4th position)
  const replyTag = eTags.find(tag => tag[3] === 'reply');
  if (replyTag) {
    return replyTag[1];
  }
  
  // If no marked reply tag, use the first 'e' tag
  return eTags[0]?.[1];
}

/**
 * Get all referenced event IDs from a reply event
 */
export function getReferencedEventIds(event: NostrEvent): string[] {
  return event.tags
    .filter(tag => tag[0] === 'e')
    .map(tag => tag[1]);
}

/**
 * Check if an event is a reply to a specific event
 */
export function isReplyTo(event: NostrEvent, parentId: string): boolean {
  return getReferencedEventIds(event).includes(parentId);
}

/**
 * Get reply depth (how many levels deep this reply is)
 */
export function getReplyDepth(event: NostrEvent): number {
  return getReferencedEventIds(event).length;
}