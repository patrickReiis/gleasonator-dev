import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function usePostActions() {
  const { mutate: createEvent } = useNostrPublish();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  const likePost = useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) throw new Error('Must be logged in to like posts');
      
      createEvent({
        kind: 7,
        content: '+',
        tags: [['e', eventId]]
      });
    },
    onSuccess: () => {
      // Invalidate interaction queries to refresh like counts
      queryClient.invalidateQueries({ queryKey: ['post-interactions'] });
    }
  });

  const repostPost = useMutation({
    mutationFn: async (event: { id: string; pubkey: string }) => {
      if (!user) throw new Error('Must be logged in to repost');
      
      createEvent({
        kind: 6,
        content: '',
        tags: [
          ['e', event.id],
          ['p', event.pubkey]
        ]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-interactions'] });
      queryClient.invalidateQueries({ queryKey: ['global-feed'] });
    }
  });

  const replyToPost = useMutation({
    mutationFn: async ({ eventId, authorPubkey, content }: { 
      eventId: string; 
      authorPubkey: string; 
      content: string; 
    }) => {
      if (!user) throw new Error('Must be logged in to reply');
      
      createEvent({
        kind: 1,
        content,
        tags: [
          ['e', eventId, '', 'reply'],
          ['p', authorPubkey]
        ]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-interactions'] });
    }
  });

  const createPost = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('Must be logged in to post');
      
      createEvent({
        kind: 1,
        content
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-feed'] });
    }
  });

  return {
    likePost,
    repostPost,
    replyToPost,
    createPost,
    isLoggedIn: !!user
  };
}