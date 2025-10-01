import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { useGlobalFeed } from '@/hooks/useGlobalFeed';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { PostCard } from '@/components/PostCard';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RelaySelector } from '@/components/RelaySelector';
import { AlertCircle, Wifi } from 'lucide-react';

export function Feed() {
  const { user } = useCurrentUser();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
  } = useGlobalFeed();

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  const posts = data?.pages.flat() || [];

  if (isLoading) {
    return (
      <div className="border border-border/40 rounded-lg bg-background overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-4 py-3 border-b border-border/40 last:border-b-0">
            <div className="flex space-x-3">
              <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-3/5" />
                </div>
                <div className="flex items-center space-x-6 pt-2">
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="gleam-card border-destructive/50">
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-destructive" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Connection Error
              </h3>
              <p className="text-muted-foreground mt-1">
                {error?.message || 'Unable to connect to the relay'}
              </p>
            </div>
            <RelaySelector className="w-full max-w-sm mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <Card className="gleam-card border-dashed">
        <CardContent className="py-12 px-8 text-center">
          <div className="max-w-sm mx-auto space-y-6">
            <div className="flex items-center justify-center">
              <Wifi className="w-12 h-12 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                No posts found
              </h3>
              <p className="text-muted-foreground mt-1">
                {!user
                  ? "No posts from gleasonator.dev found. Try switching to a different relay."
                  : "Follow more people or try switching to a different relay to see more content"
                }
              </p>
            </div>
            <RelaySelector className="w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="border border-border/40 rounded-lg bg-background overflow-hidden">
      {posts.map((post, index) => {
        // For reposts, use the original event ID in the key when available
        let key = `${post.id}-${post.created_at}`;
        if (post.kind === 6 && post.content && post.content.trim() !== '') {
          try {
            const originalEvent = JSON.parse(post.content);
            key = `${originalEvent.id}-${post.created_at}`;
          } catch (e) {
            // Fallback to using repost ID
          }
        }
        return (
          <PostCard
            key={key}
            event={post}
          />
        );
      })}

      {hasNextPage && (
        <div ref={ref}>
          {isFetchingNextPage && (
            <div className="px-4 py-3 border-t border-border/40">
              <div className="flex space-x-3">
                <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}