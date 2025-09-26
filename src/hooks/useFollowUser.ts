import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from './useCurrentUser';
import { useNostrPublish } from './useNostrPublish';
import { useUserContacts } from './useUserContacts';

export function useFollowUser(targetPubkey: string) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutate: publishEvent } = useNostrPublish();
  const queryClient = useQueryClient();
  const { data: followedPubkeys } = useUserContacts();

  // Check if the current user is following the target user
  const { data: isFollowing, isLoading: isCheckingFollow } = useQuery({
    queryKey: ['is-following', user?.pubkey, targetPubkey, followedPubkeys],
    queryFn: async ({ signal }) => {
      if (!user?.pubkey || !followedPubkeys) {
        console.log('⚠️ Missing required data for follow check:', {
          hasUser: !!user?.pubkey,
          hasTarget: !!targetPubkey,
          hasFollowed: !!followedPubkeys
        });
        return false;
      }

      // Normalize pubkeys for comparison (ensure they're valid hex strings)
      const normalizedTarget = targetPubkey.toLowerCase().trim();
      const normalizedFollowed = followedPubkeys.map(p => p.toLowerCase().trim());

      const isFollowing = normalizedFollowed.includes(normalizedTarget);

      console.log('🔍 Checking follow status:', {
        userPubkey: user.pubkey,
        targetPubkey: normalizedTarget,
        totalFollowed: normalizedFollowed.length,
        followedSample: normalizedFollowed.slice(0, 5),
        isFollowing,
        targetInList: normalizedFollowed.includes(normalizedTarget)
      });

      return isFollowing;
    },
    enabled: !!user?.pubkey && !!targetPubkey && followedPubkeys !== undefined,
    staleTime: 2 * 1000, // Cache for 2 seconds (very fast updates)
    retry: (failureCount, error) => {
      console.log('🔄 Follow check retry:', failureCount, error);
      return failureCount < 3; // Retry up to 3 times
    },
  });

  // Follow user mutation
  const { mutate: follow, isPending: isFollowingUser } = useMutation({
    mutationFn: async () => {
      if (!user?.pubkey) {
        throw new Error('User must be logged in to follow');
      }

      console.log('👤 Following user:', targetPubkey);

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
        console.log('⚠️ Already following this user');
        return; // Already following, nothing to do
      }

      // Add new contact
      const newContacts = [...currentContacts, ['p', targetPubkey]];

      console.log('📝 Publishing new contact list with', newContacts.length, 'contacts');

      // Create and publish new contact list event
      await publishEvent({
        kind: 3,
        content: '',
        tags: newContacts,
      });

      console.log('✅ Follow action completed');

      // Invalidate relevant queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['user-contacts', user.pubkey] });
      queryClient.invalidateQueries({ queryKey: ['is-following', user.pubkey, targetPubkey] });
      queryClient.invalidateQueries({ queryKey: ['global-feed'] });
    },
  });

  // Unfollow user mutation
  const { mutate: unfollow, isPending: isUnfollowingUser } = useMutation({
    mutationFn: async () => {
      if (!user?.pubkey) {
        throw new Error('User must be logged in to unfollow');
      }

      console.log('🚫 Unfollowing user:', targetPubkey);

      // Get current contact list
      const currentEvents = await nostr.query([{
        kinds: [3],
        authors: [user.pubkey],
        limit: 1,
      }]);

      if (currentEvents.length === 0) {
        console.log('⚠️ No contact list found to update');
        return; // No contact list to update
      }

      const currentContacts = currentEvents[0].tags.filter(tag => tag[0] === 'p');
      console.log('📋 Current contacts before unfollow:', currentContacts.length);

      // Remove the target user
      const newContacts = currentContacts.filter(tag => tag[1] !== targetPubkey);
      console.log('📝 New contact list will have', newContacts.length, 'contacts');

      // Create and publish new contact list event
      await publishEvent({
        kind: 3,
        content: '',
        tags: newContacts,
      });

      console.log('✅ Unfollow action completed');

      // Invalidate relevant queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['user-contacts', user.pubkey] });
      queryClient.invalidateQueries({ queryKey: ['is-following', user.pubkey, targetPubkey] });
      queryClient.invalidateQueries({ queryKey: ['global-feed'] });
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