import { useEffect } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useInView } from 'react-intersection-observer';
import { useShortVideos } from '@/hooks/useShortVideos';
import { VideoPlayer } from '@/components/VideoPlayer';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RelaySelector } from '@/components/RelaySelector';
import { ArrowLeft, Wifi, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ShortVideosPage() {
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
  } = useShortVideos();

  const videos = data?.pages.flat() || [];

  useSeoMeta({
    title: 'Short Videos - Gleasonator',
    description: 'Discover trending short videos on Nostr',
  });

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate('/');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

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

          {/* Videos content */}
          <div className="lg:col-span-3">
            {/* Back button */}
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>

            {isLoading ? (
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <Skeleton className="w-16 h-16 mx-auto rounded-full" />
                  <div className="text-foreground">Loading videos...</div>
                </div>
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
                        {error?.message || 'Unable to load videos'}
                      </p>
                    </div>
                    <RelaySelector className="w-full max-w-sm mx-auto" />
                  </div>
                </CardContent>
              </Card>
            ) : videos.length === 0 ? (
              <Card className="gleam-card border-dashed">
                <CardContent className="py-12 px-8 text-center">
                  <div className="max-w-sm mx-auto space-y-6">
                    <Play className="w-12 h-12 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        No videos found
                      </h3>
                      <p className="text-muted-foreground mt-1">
                        Try switching to a different relay to discover videos
                      </p>
                    </div>
                    <RelaySelector className="w-full" />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {/* Video feed */}
                <div className="space-y-8">
                  {videos.map((video, index) => (
                    <div key={`${video.id}-${index}`} className="space-y-4">
                      <VideoPlayer
                        event={video}
                        isActive={true}
                        onVideoEnd={() => {}} // Remove auto-advance
                      />
                    </div>
                  ))}
                </div>

                {/* Infinite scroll trigger */}
                {hasNextPage && (
                  <div ref={ref} className="py-8">
                    {isFetchingNextPage ? (
                      <div className="text-center">
                        <div className="inline-flex items-center text-muted-foreground text-sm">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-3"></div>
                          Loading more videos...
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="text-muted-foreground text-sm">
                          Scroll down for more videos
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* No more videos message */}
                {!hasNextPage && videos.length > 0 && (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground text-sm">
                      You've reached the end! Try switching relays for more content.
                    </div>
                    <RelaySelector className="w-full max-w-sm mx-auto mt-4" />
                  </div>
                )}

                {/* Navigation hints */}
                <div className="text-center text-sm text-muted-foreground">
                  <p>ESC to go back to home</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}