import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Deduplicate an array of events by their ID
 */
export function deduplicateEvents(events: NostrEvent[]): NostrEvent[] {
  const seen = new Set<string>();
  return events.filter(event => {
    if (seen.has(event.id)) {
      return false;
    }
    seen.add(event.id);
    return true;
  });
}

/**
 * Sort events by created_at timestamp (newest first by default)
 */
export function sortEventsByDate(events: NostrEvent[], newestFirst = true): NostrEvent[] {
  return [...events].sort((a, b) => {
    return newestFirst ? b.created_at - a.created_at : a.created_at - b.created_at;
  });
}

/**
 * Filter out events that are replies to other events
 */
export function filterRootEvents(events: NostrEvent[]): NostrEvent[] {
  return events.filter(event => {
    return !event.tags.some(tag => tag[0] === 'e');
  });
}