import { Link } from 'react-router-dom';
import type { NostrEvent } from '@nostrify/nostrify';
import { isReply, getParentEventId, getRootEventId } from '@/lib/replyUtils';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthor } from '@/hooks/useAuthor';
import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';

interface ReplyIndicatorProps {
  event: NostrEvent;
  showRoot?: boolean;
  className?: string;
}

export function ReplyIndicator({ event, showRoot = false, className }: ReplyIndicatorProps) {
  const { nostr } = useNostr();
  
  if (!isReply(event)) {
    return null;
  }

  const parentId = showRoot ? getRootEventId(event) : getParentEventId(event);
  if (!parentId) {
    return null;
  }

  // Fetch the parent event to show its author
  const { data: parentEvent, isLoading } = useQuery({
    queryKey: ['reply-parent', parentId],
    queryFn: async ({ signal }) => {
      const [event] = await nostr.query([{ ids: [parentId], limit: 1 }], {
        signal: AbortSignal.any([signal, AbortSignal.timeout(2000)])
      });
      return event;
    },
    enabled: !!parentId,
  });

  const parentAuthor = useAuthor(parentEvent?.pubkey || '');
  const parentMetadata = parentAuthor.data?.metadata;
  const parentDisplayName = parentMetadata?.display_name || parentMetadata?.name || 'Unknown';

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 text-muted-foreground text-sm ${className}`}>
        <MessageSquare className="w-4 h-4" />
        <span>Loading reply info...</span>
      </div>
    );
  }

  if (!parentEvent) {
    return (
      <div className={`flex items-center space-x-2 text-muted-foreground text-sm ${className}`}>
        <MessageSquare className="w-4 h-4" />
        <span>Reply to deleted post</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 text-muted-foreground text-sm ${className}`}>
      <MessageSquare className="w-4 h-4" />
      <span>Replying to </span>
      <Button
        variant="link"
        asChild
        className="p-0 h-auto text-muted-foreground hover:text-primary font-normal"
      >
        <Link to={`/post/${parentId}`}>
          @{parentDisplayName}
        </Link>
      </Button>
    </div>
  );
}