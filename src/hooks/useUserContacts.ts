import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { useCurrentUser } from './useCurrentUser';

export function useUserContacts() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useQuery({
    queryKey: ['user-contacts', user?.pubkey],
    queryFn: async ({ signal }) => {
      if (!user?.pubkey) {
        return [];
      }

      // Query for the user's contact list (kind 3 event)
      const events = await nostr.query([{
        kinds: [3],
        authors: [user.pubkey],
        limit: 1,
      }], {
        signal: AbortSignal.any([signal, AbortSignal.timeout(3000)])
      });

      if (events.length === 0) {
        return [];
      }

      const contactListEvent = events[0];
      
      // Extract pubkeys from 'p' tags
      const followedPubkeys = contactListEvent.tags
        .filter(tag => tag[0] === 'p')
        .map(tag => tag[1])
        .filter(pubkey => pubkey && pubkey.length === 64); // Ensure valid pubkey format

      return followedPubkeys;
    },
    enabled: !!user?.pubkey, // Only run if user is logged in
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}