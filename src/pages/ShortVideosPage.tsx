import { useState, useEffect, useCallback } from 'react';
import { useSeoMeta } from '@unhead/react';
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

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
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'Escape') {
        navigate('/');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, videos.length]);

  // Handle scroll navigation
  useEffect(() => {
    let isScrolling = false;

    const handleWheel = (e: WheelEvent) => {
      if (isScrolling) return;

      e.preventDefault();
      isScrolling = true;

      if (e.deltaY > 0) {
        goToNext();
      } else {
        goToPrevious();
      }

      setTimeout(() => {
        isScrolling = false;
      }, 500);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [currentIndex, videos.length]);

  const goToNext = useCallback(() => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [currentIndex, videos.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  // Auto-advance when new videos are loaded
  useEffect(() => {
    if (currentIndex >= videos.length - 3 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [currentIndex, videos.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handle video end
  const handleVideoEnd = useCallback(() => {
    setTimeout(goToNext, 300); // Small delay before advancing
  }, [goToNext]);

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
              <div className="space-y-6">
                {/* Video counter */}
                <div className="text-center">
                  <div className="inline-flex items-center bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                    <Play className="w-4 h-4 mr-2" />
                    Video {currentIndex + 1} of {videos.length}
                  </div>
                </div>

                {/* Current video */}
                <div className="relative">
                  <VideoPlayer
                    event={videos[currentIndex]}
                    isActive={true}
                    onVideoEnd={handleVideoEnd}
                  />
                </div>

                {/* Navigation buttons */}
                <div className="flex justify-center space-x-4">
                  <Button
                    onClick={goToPrevious}
                    disabled={currentIndex === 0}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={goToNext}
                    disabled={currentIndex >= videos.length - 1 && !hasNextPage}
                    className="gleam-button gleam-button-primary"
                  >
                    {currentIndex >= videos.length - 1 && hasNextPage ? 'Load More' : 'Next'}
                  </Button>
                </div>

                {/* Loading indicator */}
                {isFetchingNextPage && (
                  <div className="text-center">
                    <div className="inline-flex items-center text-muted-foreground text-sm">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                      Loading more videos...
                    </div>
                  </div>
                )}

                {/* Navigation hints */}
                <div className="text-center text-sm text-muted-foreground">
                  <p>Use arrow keys to navigate • ESC to go back</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}