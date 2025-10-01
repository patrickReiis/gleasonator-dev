import { useState } from 'react';
import { type NostrEvent } from '@nostrify/nostrify';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNostr } from '@/hooks/useNostr';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { NoteContent } from './NoteContent';
import { cn } from '@/lib/utils';

interface QuotePostProps {
  identifier: string; // NIP-19 identifier (note1, nevent1, naddr1)
  className?: string;
}

interface QuotePostAuthorProps {
  pubkey: string;
  createdAt: number;
}

/** Displays author information for quoted posts */
function QuotePostAuthor({ pubkey, createdAt }: QuotePostAuthorProps) {
  const author = useAuthor(pubkey);

  if (author.isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <Skeleton className="h-6 w-6 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-2 w-12" />
        </div>
      </div>
    );
  }

  const metadata = author.data?.metadata;
  const displayName = metadata?.name || metadata?.display_name || genUserName(pubkey);
  const npub = nip19.npubEncode(pubkey);

  return (
    <div className="flex items-center space-x-2">
      <Avatar className="h-6 w-6">
        {metadata?.picture && (
          <AvatarImage
            src={metadata.picture}
            alt={displayName}
            className="object-cover"
          />
        )}
        <AvatarFallback className="text-xs">
          {(metadata?.name || metadata?.display_name || displayName).slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {displayName}
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(createdAt * 1000).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

/** Renders a quoted/embedded Nostr post from a NIP-19 identifier */
export function QuotePost({ identifier, className }: QuotePostProps) {
  const { nostr } = useNostr();
  const [showError, setShowError] = useState(false);

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['quote-post', identifier],
    queryFn: async ({ signal }) => {
      try {
        const decoded = nip19.decode(identifier);

        let filter;
        switch (decoded.type) {
          case 'note': {
            filter = { ids: [decoded.data], limit: 1 };
            break;
          }
          case 'nevent': {
            const { id, relays, author } = decoded.data;
            filter = {
              ids: [id],
              ...(author && { authors: [author] }),
              limit: 1
            };
            break;
          }
          case 'naddr': {
            const { kind, pubkey, identifier: d } = decoded.data;
            filter = {
              kinds: [kind],
              authors: [pubkey],
              '#d': [d],
              limit: 1
            };
            break;
          }
          default:
            throw new Error('Unsupported NIP-19 identifier type');
        }

        const events = await nostr.query([filter], {
          signal: AbortSignal.any([signal, AbortSignal.timeout(3000)])
        });

        if (events.length === 0) {
          throw new Error('Event not found');
        }

        return events[0];
      } catch (err) {
        setShowError(true);
        throw err;
      }
    },
    enabled: !showError,
    retry: 1,
  });

  if (showError) {
    return (
      <Card className={cn("border-dashed border-muted-foreground/30", className)}>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Post not found</p>
            <Link
              to={`/${identifier}`}
              className="text-xs text-blue-500 hover:underline mt-1 inline-block"
            >
              View original
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={cn("border-l-4 border-l-green-500 border-muted bg-background", className)}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!event) {
    return null;
  }

  const navigate = useNavigate();

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement;
    const isInteractiveElement =
      target.closest('button') ||
      target.closest('a') ||
      target.closest('img') ||
      target.closest('video') ||
      target.closest('audio') ||
      target.closest('[role="button"]') ||
      target.closest('.dialog-content') ||
      target.closest('[data-no-navigate]');

    if (!isInteractiveElement) {
      navigate(`/${identifier}`);
    }
  };

  return (
    <Card
      className={cn("border-l-4 border-l-green-500 border-muted bg-background hover:bg-muted/50 transition-colors cursor-pointer", className)}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Author info */}
          <QuotePostAuthor pubkey={event.pubkey} createdAt={event.created_at} />

          {/* Content preview */}
          <div className="text-sm" data-no-navigate>
            <NoteContent
              event={event}
              className="text-foreground [&_a]:text-blue-500 [&_a]:hover:text-blue-600"
            />
          </div>

          {/* Interaction hint */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Click to view full post</span>
            <span>↗</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}