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
        console.log('🔍 No user pubkey found for contacts');
        return [];
      }

      console.log('🔍 Fetching contacts for user:', user.pubkey);

      // Query for the user's contact list (kind 3 event) - get latest by sorting
      const events = await nostr.query([{
        kinds: [3],
        authors: [user.pubkey],
        limit: 10, // Get more to find the latest
      }], {
        signal: AbortSignal.any([signal, AbortSignal.timeout(5000)])
      });

      console.log('📋 Contact list events found:', events.length);

      if (events.length === 0) {
        console.log('⚠️ No contact list event found for user');
        return [];
      }

      // Sort by created_at to get the latest contact list
      const sortedEvents = events.sort((a, b) => b.created_at - a.created_at);
      const contactListEvent = sortedEvents[0];
      console.log('📝 Using latest contact list from:', new Date(contactListEvent.created_at * 1000).toISOString());
      console.log('📝 Contact list event ID:', contactListEvent.id);
      console.log('📝 Total tags in contact list:', contactListEvent.tags.length);

      // Extract pubkeys from 'p' tags
      const pTags = contactListEvent.tags.filter(tag => tag[0] === 'p');
      console.log('📝 Found', pTags.length, 'p tags');

      const followedPubkeys = pTags
        .map(tag => tag[1])
        .filter(pubkey => pubkey && pubkey.length === 64); // Ensure valid pubkey format

      console.log('✅ Valid followed pubkeys:', followedPubkeys.length);
      console.log('📝 First few followed pubkeys:', followedPubkeys.slice(0, 3));

      return followedPubkeys;
    },
    enabled: !!user?.pubkey, // Only run if user is logged in
    staleTime: 30 * 1000, // Reduced cache time to 30 seconds for faster updates
  });
}