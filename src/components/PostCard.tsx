import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { NostrEvent } from '@nostrify/nostrify';
import { useAuthor } from '@/hooks/useAuthor';
import { usePostInteractions } from '@/hooks/useGlobalFeed';
import { usePostActions } from '@/hooks/usePostActions';
import { genUserName } from '@/lib/genUserName';
import { NoteContent } from '@/components/NoteContent';
import { ReplyIndicator } from '@/components/ReplyIndicator';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageCircle, Repeat2, Share } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  event: NostrEvent;
  showReplies?: boolean;
  clickable?: boolean;
  highlighted?: boolean;
}

export function PostCard({ event, showReplies = false, clickable = true, highlighted = false }: PostCardProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const navigate = useNavigate();

  const author = useAuthor(event.pubkey);
  const interactions = usePostInteractions(event.id);
  const { likePost, repostPost, replyToPost, isLoggedIn } = usePostActions();

  const metadata = author.data?.metadata;
  const displayName = metadata?.display_name || metadata?.name || genUserName(event.pubkey);
  const username = metadata?.name || genUserName(event.pubkey);
  const profileImage = metadata?.picture;
  const timeAgo = formatDistanceToNow(new Date(event.created_at * 1000), { addSuffix: true });

  const interactionData = interactions.data?.pages[0];
  const likes = interactionData?.likes || [];
  const reposts = interactionData?.reposts || [];
  const replies = interactionData?.replies || [];

  const handleLike = () => {
    if (!isLoggedIn) return;
    likePost.mutate(event.id);
  };

  const handleRepost = () => {
    if (!isLoggedIn) return;
    repostPost.mutate({ id: event.id, pubkey: event.pubkey });
  };

  const handleReply = () => {
    if (!replyContent.trim() || !isLoggedIn) return;

    replyToPost.mutate({
      eventId: event.id,
      authorPubkey: event.pubkey,
      content: replyContent
    });

    setReplyContent('');
    setShowReplyForm(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    if (
      e.target instanceof HTMLElement &&
      (e.target.closest('button') ||
       e.target.closest('textarea') ||
       e.target.closest('a') ||
       e.target.closest('[role="button"]'))
    ) {
      return;
    }

    if (clickable) {
      navigate(`/post/${event.id}`);
    }
  };

  return (
    <Card
      className={`gleam-card ${clickable ? 'gleam-card-clickable cursor-pointer transition-all duration-200 group relative' : ''} ${highlighted ? 'border-2 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : ''}`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${event.pubkey}`);
            }}
            className="hover:scale-105 transition-transform"
          >
            <Avatar className="gleam-avatar w-12 h-12">
              <AvatarImage src={profileImage} alt={displayName} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/profile/${event.pubkey}`);
                }}
                className="font-semibold text-foreground truncate hover:text-primary transition-colors"
              >
                {displayName}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/profile/${event.pubkey}`);
                }}
                className="text-muted-foreground text-sm hover:text-primary transition-colors"
              >
                @{username}
              </button>
              <span className="text-muted-foreground text-sm">
                ·
              </span>
              <span className="text-muted-foreground text-sm">
                {timeAgo}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Reply indicator */}
        <ReplyIndicator event={event} />

        <div className="text-foreground leading-relaxed">
          <NoteContent event={event} />
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click
              setShowReplyForm(!showReplyForm);
            }}
            className="text-muted-foreground hover:text-primary flex items-center space-x-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{replies.length}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRepost}
            disabled={!isLoggedIn}
            className="text-muted-foreground hover:text-green-600 flex items-center space-x-2"
          >
            <Repeat2 className="w-4 h-4" />
            <span>{reposts.length}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={!isLoggedIn}
            className="text-muted-foreground hover:text-red-500 flex items-center space-x-2"
          >
            <Heart className="w-4 h-4" />
            <span>{likes.length}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary"
          >
            <Share className="w-4 h-4" />
          </Button>
        </div>

        {/* Reply form */}
        {showReplyForm && (
          <div className="pt-4 border-t border-border/50 space-y-3">
            <Textarea
              placeholder="Write a reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="gleam-input min-h-[80px] resize-none"
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReplyForm(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleReply}
                disabled={!replyContent.trim() || !isLoggedIn}
                className="gleam-button gleam-button-primary"
              >
                Reply
              </Button>
            </div>
          </div>
        )}

        {/* Show replies if requested */}
        {showReplies && replies.length > 0 && (
          <div className="pt-4 border-t border-border/50 space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">
              Replies ({replies.length})
            </h4>
            {replies.slice(0, 3).map((reply) => (
              <PostCard key={reply.id} event={reply} />
            ))}
            {replies.length > 3 && (
              <Button variant="ghost" size="sm" className="text-primary">
                Show {replies.length - 3} more replies
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}