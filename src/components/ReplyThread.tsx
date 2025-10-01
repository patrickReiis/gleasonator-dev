import { useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import type { NostrEvent } from '@nostrify/nostrify';
import { ReplyIndicator } from './ReplyIndicator';
import { PostCard } from './PostCard';
import { useReplyThread } from '@/hooks/useReplyThread';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ReplyThreadProps {
  eventId: string;
  showRoot?: boolean;
  className?: string;
}

export function ReplyThread({ eventId, showRoot = true, className }: ReplyThreadProps) {
  const {
    rootEvent,
    event,
    replies,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useReplyThread(eventId, { includeRoot: showRoot });

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Skeleton className="h-32 w-full" />
        <div className="ml-12 space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Unable to load this thread. The post may have been deleted.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Thread - Contains both root and main event in unified timeline */}
      <div className="border border-border/40 rounded-lg bg-background overflow-hidden">
        {/* Root event (if this is a reply and we want to show it) */}
        {showRoot && rootEvent && (
          <PostCard
            event={rootEvent}
            clickable={true}
            showReplies={false}
          />
        )}

        {/* Main event */}
        <div className="relative">
          {/* Reply indicator only if there's no root shown */}
          {!(showRoot && rootEvent) && (
            <div className="px-4 pt-3">
              <ReplyIndicator event={event} showRoot={false} />
            </div>
          )}

          <PostCard
            event={event}
            clickable={false}
            showReplies={false}
            highlighted={true}
          />
        </div>
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground font-medium">
            <MessageSquare className="w-4 h-4" />
            <span>Replies ({replies.length})</span>
          </div>

          <div className="border border-border/40 rounded-lg bg-background overflow-hidden">
            {replies.map((reply, index) => (
              <PostCard
                key={reply.id}
                event={reply}
                clickable={true}
                showReplies={false}
              />
            ))}

            {/* Load more indicator */}
            {hasNextPage && (
              <div ref={ref} className="px-4 py-3 border-t border-border/40">
                {isFetchingNextPage ? (
                  <div className="flex space-x-3">
                    <Skeleton className="w-12 h-12 rounded-full flex-shrink-0 self-start" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-4/5" />
                    </div>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" className="w-full">
                    Load more replies
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {replies.length === 0 && !isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No replies yet. Be the first to reply!</p>
        </div>
      )}
    </div>
  );
}