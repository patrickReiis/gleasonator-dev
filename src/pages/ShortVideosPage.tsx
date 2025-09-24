import { useState, useEffect, useCallback } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useShortVideos } from '@/hooks/useShortVideos';
import { VideoPlayer } from '@/components/VideoPlayer';
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto">
            <Skeleton className="w-full h-full rounded-full" />
          </div>
          <div className="text-white">Loading videos...</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="gleam-card border-destructive/50 max-w-md">
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
              <div className="space-y-3">
                <RelaySelector className="w-full" />
                <Button 
                  onClick={() => navigate('/')} 
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="gleam-card border-dashed max-w-md">
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
              <div className="space-y-3">
                <RelaySelector className="w-full" />
                <Button 
                  onClick={() => navigate('/')} 
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Back button */}
      <Button
        onClick={() => navigate('/')}
        variant="ghost"
        size="sm"
        className="absolute top-4 left-4 z-50 bg-black/50 text-white hover:bg-black/70"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      {/* Video counter */}
      <div className="absolute top-4 right-4 z-50 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
        {currentIndex + 1} / {videos.length}
      </div>

      {/* Video players */}
      <div className="relative w-full h-full">
        {videos.map((video, index) => (
          <div
            key={video.id}
            className={`absolute inset-0 transition-transform duration-500 ${
              index === currentIndex ? 'translate-y-0' :
              index < currentIndex ? '-translate-y-full' :
              'translate-y-full'
            }`}
          >
            <VideoPlayer
              event={video}
              isActive={index === currentIndex}
              onVideoEnd={handleVideoEnd}
            />
          </div>
        ))}
      </div>

      {/* Navigation hints */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-black/50 text-white px-4 py-2 rounded-full text-sm text-center">
          <p>Scroll or use arrow keys to navigate</p>
          <p className="text-xs opacity-75 mt-1">ESC to exit</p>
        </div>
      </div>

      {/* Loading indicator for next videos */}
      {isFetchingNextPage && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            Loading more videos...
          </div>
        </div>
      )}
    </div>
  );
}