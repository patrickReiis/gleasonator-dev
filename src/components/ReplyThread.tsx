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
      {/* Root event (if this is a reply and we want to show it) */}
      {showRoot && rootEvent && (
        <div>
          <PostCard
            event={rootEvent}
            clickable={true}
            showReplies={false}
          />
        </div>
      )}

      {/* Thread connector line */}
      {showRoot && rootEvent && (
        <div className="flex justify-center">
          <div className="w-0.5 h-8 bg-border/50" />
        </div>
      )}

      {/* Main event */}
      <div className="relative">
        {/* Reply indicator */}
        <ReplyIndicator event={event} showRoot={false} className="mb-3" />

        <PostCard
          event={event}
          clickable={false}
          showReplies={false}
          highlighted={true}
        />
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground font-medium">
            <MessageSquare className="w-4 h-4" />
            <span>Replies ({replies.length})</span>
          </div>

          <div className="ml-12 space-y-4 border-l-2 border-border/30 pl-4">
            {replies.map((reply, index) => (
              <div key={reply.id} className="relative">
                {/* Thread connector for all but last reply */}
                {index < replies.length - 1 && (
                  <div className="absolute left-[-19px] top-8 w-0.5 h-full bg-border/30" />
                )}

                <PostCard
                  event={reply}
                  clickable={true}
                  showReplies={false}
                />
              </div>
            ))}

            {/* Load more indicator */}
            {hasNextPage && (
              <div ref={ref} className="py-4">
                {isFetchingNextPage ? (
                  <div className="space-y-2">
                    {[1, 2].map(i => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
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