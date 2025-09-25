import { useEffect } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useInView } from 'react-intersection-observer';
import { useExploreFeed } from '@/hooks/useExploreFeed';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { PostCard } from '@/components/PostCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RelaySelector } from '@/components/RelaySelector';
import { ArrowLeft, Wifi, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ExplorePage() {
  const navigate = useNavigate();
  const { ref, inView } = useInView();
  
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    isLoading,
    isError,
    error
  } = useExploreFeed();

  const posts = data?.pages.flat() || [];

  useSeoMeta({
    title: 'Explore - Gleasonator',
    description: 'Discover posts from across the Nostr network',
  });

  // Infinite scroll trigger
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24">
              <Sidebar />
            </div>
          </aside>
          
          {/* Explore content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button 
                  onClick={() => navigate('/')} 
                  variant="ghost" 
                  size="sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                
                <div className="flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-primary" />
                  <h1 className="text-2xl font-bold text-foreground">Explore</h1>
                </div>
              </div>
            </div>

            <div className="text-muted-foreground text-sm">
              Discover posts from across the Nostr network
            </div>

            {isLoading ? (
              <div className="space-y-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i} className="gleam-card">
                    <CardContent className="p-6">
                      <div className="flex space-x-4">
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center space-x-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-4/5" />
                            <Skeleton className="h-4 w-3/5" />
                          </div>
                          <div className="flex items-center space-x-6 pt-2">
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-8 w-16" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : isError ? (
              <Card className="gleam-card border-destructive/50">
                <CardContent className="p-6 text-center">
                  <div className="space-y-4">
                    <Wifi className="w-12 h-12 text-destructive mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        Connection Error
                      </h3>
                      <p className="text-muted-foreground mt-1">
                        {error?.message || 'Unable to load posts'}
                      </p>
                    </div>
                    <RelaySelector className="w-full max-w-sm mx-auto" />
                  </div>
                </CardContent>
              </Card>
            ) : posts.length === 0 ? (
              <Card className="gleam-card border-dashed">
                <CardContent className="py-12 px-8 text-center">
                  <div className="max-w-sm mx-auto space-y-6">
                    <Globe className="w-12 h-12 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        No posts found
                      </h3>
                      <p className="text-muted-foreground mt-1">
                        Try switching to a different relay to discover content
                      </p>
                    </div>
                    <RelaySelector className="w-full" />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Posts feed */}
                <div className="space-y-6">
                  {posts.map((post, index) => (
                    <PostCard key={`${post.id}-${index}`} event={post} />
                  ))}
                </div>

                {/* Infinite scroll trigger */}
                {hasNextPage && (
                  <div ref={ref} className="py-6">
                    {isFetchingNextPage ? (
                      <Card className="gleam-card">
                        <CardContent className="p-6">
                          <div className="flex space-x-4">
                            <Skeleton className="w-12 h-12 rounded-full" />
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
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="text-center">
                        <div className="text-muted-foreground text-sm">
                          Scroll down for more posts
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* No more posts message */}
                {!hasNextPage && posts.length > 0 && (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground text-sm">
                      You've explored all available posts! Try switching relays for more content.
                    </div>
                    <RelaySelector className="w-full max-w-sm mx-auto mt-4" />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}