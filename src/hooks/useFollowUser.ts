import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from './useCurrentUser';
import { useNostrPublish } from './useNostrPublish';

export function useFollowUser(targetPubkey: string) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutate: publishEvent } = useNostrPublish();
  const queryClient = useQueryClient();

  // Check if the current user is following the target user
  const { data: isFollowing, isLoading: isCheckingFollow } = useQuery({
    queryKey: ['is-following', user?.pubkey, targetPubkey],
    queryFn: async ({ signal }) => {
      if (!user?.pubkey) return false;

      const events = await nostr.query([{
        kinds: [3],
        authors: [user.pubkey],
        limit: 1,
      }], {
        signal: AbortSignal.any([signal, AbortSignal.timeout(3000)])
      });

      if (events.length === 0) return false;

      const contactListEvent = events[0];
      const followedPubkeys = contactListEvent.tags
        .filter(tag => tag[0] === 'p')
        .map(tag => tag[1]);

      return followedPubkeys.includes(targetPubkey);
    },
    enabled: !!user?.pubkey && !!targetPubkey,
    staleTime: 30 * 1000, // Cache for 30 seconds
  });

  // Follow user mutation
  const { mutate: follow, isPending: isFollowingUser } = useMutation({
    mutationFn: async () => {
      if (!user?.pubkey) {
        throw new Error('User must be logged in to follow');
      }

      // Get current contact list
      const currentEvents = await nostr.query([{
        kinds: [3],
        authors: [user.pubkey],
        limit: 1,
      }]);

      const currentContacts = currentEvents.length > 0 
        ? currentEvents[0].tags.filter(tag => tag[0] === 'p')
        : [];

      // Check if already following
      const alreadyFollowing = currentContacts.some(tag => tag[1] === targetPubkey);
      if (alreadyFollowing) {
        return; // Already following, nothing to do
      }

      // Add new contact
      const newContacts = [...currentContacts, ['p', targetPubkey]];

      // Create and publish new contact list event
      await publishEvent({
        kind: 3,
        content: '',
        tags: newContacts,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['user-contacts', user.pubkey] });
      queryClient.invalidateQueries({ queryKey: ['is-following', user.pubkey, targetPubkey] });
    },
  });

  // Unfollow user mutation
  const { mutate: unfollow, isPending: isUnfollowingUser } = useMutation({
    mutationFn: async () => {
      if (!user?.pubkey) {
        throw new Error('User must be logged in to unfollow');
      }

      // Get current contact list
      const currentEvents = await nostr.query([{
        kinds: [3],
        authors: [user.pubkey],
        limit: 1,
      }]);

      if (currentEvents.length === 0) return; // No contact list to update

      const currentContacts = currentEvents[0].tags.filter(tag => tag[0] === 'p');

      // Remove the target user
      const newContacts = currentContacts.filter(tag => tag[1] !== targetPubkey);

      // Create and publish new contact list event
      await publishEvent({
        kind: 3,
        content: '',
        tags: newContacts,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['user-contacts', user.pubkey] });
      queryClient.invalidateQueries({ queryKey: ['is-following', user.pubkey, targetPubkey] });
    },
  });

  // Toggle follow state
  const toggleFollow = () => {
    if (isFollowing) {
      unfollow();
    } else {
      follow();
    }
  };

  return {
    isFollowing: !!isFollowing,
    isCheckingFollow,
    isFollowingUser,
    isUnfollowingUser,
    follow,
    unfollow,
    toggleFollow,
    isLoading: isCheckingFollow || isFollowingUser || isUnfollowingUser,
  };
}