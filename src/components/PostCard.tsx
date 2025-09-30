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
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
  const [selectedProfileImage, setSelectedProfileImage] = useState<string | null>(null);
  const navigate = useNavigate();

  // Handle reposts (kind 6)
  const isRepost = event.kind === 6;
  let originalEvent: NostrEvent | null = null;

  if (isRepost && event.content && event.content.trim() !== '') {
    try {
      originalEvent = JSON.parse(event.content);
    } catch (e) {
      console.error('Failed to parse repost content:', e);
    }
  }

  // For reposts, use the original event for content and author
  const displayEvent = isRepost && originalEvent ? originalEvent : event;
  const displayAuthorPubkey = displayEvent.pubkey;

  const author = useAuthor(displayAuthorPubkey);
  const interactions = usePostInteractions(event.id); // Use repost event ID for interactions
  const { likePost, repostPost, replyToPost, isLoggedIn } = usePostActions();

  const metadata = author.data?.metadata;
  const displayName = metadata?.display_name || metadata?.name || genUserName(displayAuthorPubkey);
  const username = metadata?.name || genUserName(displayAuthorPubkey);
  const profileImage = metadata?.picture;
  const timeAgo = formatDistanceToNow(new Date(event.created_at * 1000), { addSuffix: true });

  // Get the reposter's info for reposts
  const reposter = useAuthor(isRepost ? event.pubkey : '');
  const reposterMetadata = reposter.data?.metadata;
  const reposterDisplayName = reposterMetadata?.display_name || reposterMetadata?.name || (isRepost ? genUserName(event.pubkey) : '');

  const interactionData = interactions.data?.pages[0];
  const likes = interactionData?.likes || [];
  const reposts = interactionData?.reposts || [];
  const replies = interactionData?.replies || [];

  const handleLike = () => {
    if (!isLoggedIn) return;
    // For reposts, we want to like the original event, not the repost itself
    const targetEventId = isRepost && originalEvent ? originalEvent.id : event.id;
    likePost.mutate(targetEventId);
  };

  const handleRepost = () => {
    if (!isLoggedIn) return;
    // For reposts, we want to repost the original event, not the repost itself
    const targetEventId = isRepost && originalEvent ? originalEvent.id : event.id;
    const targetEventPubkey = isRepost && originalEvent ? originalEvent.pubkey : event.pubkey;
    repostPost.mutate({ id: targetEventId, pubkey: targetEventPubkey });
  };

  const handleReply = () => {
    if (!replyContent.trim() || !isLoggedIn) return;

    // For reposts, we want to reply to the original event, not the repost itself
    const targetEventId = isRepost && originalEvent ? originalEvent.id : event.id;
    const targetEventPubkey = isRepost && originalEvent ? originalEvent.pubkey : event.pubkey;

    replyToPost.mutate({
      eventId: targetEventId,
      authorPubkey: targetEventPubkey,
      content: replyContent
    });

    setReplyContent('');
    setShowReplyForm(false);
  };

  // Close profile image modal
  const closeProfileImageModal = (e?: any) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedProfileImage(null);
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

    // Don't navigate if there's an image modal open
    // Check if we clicked on an image or if there's a modal open
    const clickedImage = e.target instanceof HTMLElement && e.target.closest('.gleam-image-gallery button');
    const modalIsOpen = !!document.querySelector('[role="dialog"]:not([hidden])');

    if (clickedImage || modalIsOpen) {
      return;
    }

    if (clickable) {
      // For reposts, navigate to the original event
      const targetEventId = isRepost && originalEvent ? originalEvent.id : event.id;
      navigate(`/post/${targetEventId}`);
    }
  };

  return (
    <>
      <Card
        className={`gleam-card ${clickable ? 'gleam-card-clickable cursor-pointer transition-all duration-200 group relative' : ''} ${highlighted ? 'border-2 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : ''}`}
        onClick={handleCardClick}
      >
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (profileImage) {
                setSelectedProfileImage(profileImage);
              } else {
                navigate(`/profile/${displayAuthorPubkey}`);
              }
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
                  navigate(`/profile/${displayAuthorPubkey}`);
                }}
                className="font-semibold text-foreground truncate hover:text-primary transition-colors"
              >
                {displayName}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/profile/${displayAuthorPubkey}`);
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

            {/* Repost indicator */}
            {isRepost && (
              <div className="flex items-center space-x-1 mt-1">
                <Repeat2 className="w-3 h-3 text-green-600" />
                <span className="text-xs text-muted-foreground">
                  Reposted by{' '}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile/${event.pubkey}`);
                    }}
                    className="hover:text-primary transition-colors font-medium"
                  >
                    {reposterDisplayName}
                  </button>
                </span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Reply indicator */}
        <ReplyIndicator event={displayEvent} />

        <div className="text-foreground leading-relaxed">
          <NoteContent event={displayEvent} />
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

    {/* Profile image modal */}
    <Dialog open={!!selectedProfileImage} onOpenChange={(open) => {
      if (!open) {
        setSelectedProfileImage(null);
      }
    }}>
      <DialogContent
        className="max-w-5xl w-full max-h-[95vh] p-2 bg-transparent border-0"
        onPointerDownOutside={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setSelectedProfileImage(null);
        }}
        onEscapeKeyDown={() => setSelectedProfileImage(null)}
      >
        {selectedProfileImage && (
          <div
            className="relative bg-black/90 rounded-lg p-4"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {/* Close button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedProfileImage(null);
              }}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 hover:bg-white text-black rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <img
              src={selectedProfileImage}
              alt="Full size profile picture"
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
              style={{ maxWidth: '100%', maxHeight: '85vh' }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}