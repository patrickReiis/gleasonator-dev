import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { NostrEvent } from '@nostrify/nostrify';
import { useAuthor } from '@/hooks/useAuthor';
import { usePostInteractions } from '@/hooks/useGlobalFeed';
import { usePostActions } from '@/hooks/usePostActions';
import { usePost } from '@/hooks/usePost';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { genUserName } from '@/lib/genUserName';
import { NoteContent } from '@/components/NoteContent';
import { ReplyIndicator } from '@/components/ReplyIndicator';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
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

  // For reposts, fetch the original event using the e tag
  const originalEventId = isRepost ? event.tags.find(([name]) => name === 'e')?.[1] : '';
  const originalEventQuery = usePost(originalEventId);

  const originalEvent = isRepost && originalEventId ? originalEventQuery.data : null;

  // Only show repost if we can find the original event
  const shouldShowRepost = !isRepost || (isRepost && originalEvent !== null);

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

  // Check if current user has liked this post
  const { user } = useCurrentUser();
  const hasUserLiked = user ? likes.some(like => like.pubkey === user.pubkey) : false;

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

    // Check if we're clicking on an image in the image gallery
    const isImageGalleryClick = e.target instanceof HTMLElement && e.target.closest('.gleam-image-gallery');

    // Check if there's currently a modal open (image or video modal)
    const hasOpenModal = !!document.querySelector('[role="dialog"]:not([hidden])');

    // Don't navigate if:
    // 1. Clicking on images in the gallery (they should open the modal)
    // 2. There's already a modal open
    if (isImageGalleryClick || hasOpenModal) {
      return;
    }

    if (clickable) {
      // For reposts, navigate to the original event
      const targetEventId = isRepost && originalEvent ? originalEvent.id : event.id;
      navigate(`/post/${targetEventId}`);
    }
  };

  // Don't render anything if this is a repost and we can't find the original event
  if (!shouldShowRepost) {
    return null;
  }

  return (
    <>
      <article
        className={`
          px-4 py-3 transition-all duration-200 border-b border-border/40 last:border-b-0
          ${clickable ? 'hover:bg-muted/20 cursor-pointer' : ''}
          ${highlighted ? 'bg-blue-50/30 dark:bg-blue-950/20 border-l-4 border-l-blue-500 pl-3' : ''}
        `}
        onClick={handleCardClick}
      >
        {/* Repost indicator */}
        {isRepost && (
          <div className="flex items-center space-x-2 mb-2 text-muted-foreground">
            <div className="ml-8">
              <div className="flex items-center space-x-1">
                <Repeat2 className="w-3 h-3 text-green-600" />
                <span className="text-xs">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile/${event.pubkey}`);
                    }}
                    className="hover:text-primary transition-colors font-medium"
                  >
                    {reposterDisplayName}
                  </button>
                  {' '}reposted
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          {/* Avatar */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (profileImage) {
                setSelectedProfileImage(profileImage);
              } else {
                navigate(`/profile/${displayAuthorPubkey}`);
              }
            }}
            className="hover:scale-105 transition-transform flex-shrink-0 self-start"
          >
            <Avatar className="gleam-avatar w-12 h-12">
              <AvatarImage src={profileImage} alt={displayName} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Header */}
            <div className="flex items-center space-x-2 text-sm">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/profile/${displayAuthorPubkey}`);
                }}
                className="font-bold text-foreground hover:underline truncate"
              >
                {displayName}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/profile/${displayAuthorPubkey}`);
                }}
                className="text-muted-foreground hover:underline truncate"
              >
                @{username}
              </button>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground flex-shrink-0">
                {timeAgo}
              </span>
            </div>

            {/* Reply indicator */}
            <ReplyIndicator event={displayEvent} />

            {/* Post content */}
            <div className="text-foreground leading-relaxed">
              <NoteContent event={displayEvent} />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between max-w-md pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReplyForm(!showReplyForm);
                }}
                className="text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 flex items-center space-x-1 px-3 py-1.5 rounded-full transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                {replies.length > 0 && <span className="text-xs">{replies.length}</span>}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleRepost}
                disabled={!isLoggedIn}
                className="text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 flex items-center space-x-1 px-3 py-1.5 rounded-full transition-colors"
              >
                <Repeat2 className="w-4 h-4" />
                {reposts.length > 0 && <span className="text-xs">{reposts.length}</span>}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={!isLoggedIn}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-full transition-colors ${
                  hasUserLiked
                    ? 'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20'
                    : 'text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20'
                }`}
              >
                <Heart
                  className="w-4 h-4"
                  fill={hasUserLiked ? "currentColor" : "none"}
                />
                {likes.length > 0 && <span className="text-xs">{likes.length}</span>}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 px-3 py-1.5 rounded-full transition-colors"
              >
                <Share className="w-4 h-4" />
              </Button>
            </div>

            {/* Reply form */}
            {showReplyForm && (
              <div className="pt-3 space-y-3">
                <Textarea
                  placeholder="Post your reply"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[80px] resize-none border-border/50"
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
                  >
                    Reply
                  </Button>
                </div>
              </div>
            )}

            {/* Show replies if requested */}
            {showReplies && replies.length > 0 && (
              <div className="pt-3 space-y-3 border-t border-border/40">
                <h4 className="font-medium text-sm text-muted-foreground">
                  Replies ({replies.length})
                </h4>
                {replies.slice(0, 3).map((reply) => (
                  <PostCard key={reply.id} event={reply} showSeparator={false} />
                ))}
                {replies.length > 3 && (
                  <Button variant="ghost" size="sm" className="text-primary">
                    Show {replies.length - 3} more replies
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </article>

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