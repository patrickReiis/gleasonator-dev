import { useEffect, useState, useCallback } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useInView } from 'react-intersection-observer';
import { useExploreFeed } from '@/hooks/useExploreFeed';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { PostCard } from '@/components/PostCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { RelaySelector } from '@/components/RelaySelector';
import { ArrowLeft, Wifi, Globe, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ExplorePage() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { ref, inView } = useInView();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timeout | null>(null);

  // Handle search input changes with debouncing
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);

    // Clear existing timeout and countdown
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    if (countdownInterval) {
      clearInterval(countdownInterval);
      setCountdownInterval(null);
    }

    if (value.trim()) {
      // Start countdown from 2
      setCountdownSeconds(2);

      // Set up countdown interval
      const interval = setInterval(() => {
        setCountdownSeconds(prev => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(interval);
            setCountdownInterval(null);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      setCountdownInterval(interval);

      // Set new timeout for 2 seconds
      const timeout = setTimeout(() => {
        setDebouncedSearchQuery(value);
        setCountdownSeconds(null);
        if (countdownInterval) {
          clearInterval(countdownInterval);
          setCountdownInterval(null);
        }
      }, 2000);

      setDebounceTimeout(timeout);
    } else {
      // Clear countdown if input is empty
      setCountdownSeconds(null);
    }
  }, [debounceTimeout, countdownInterval]);

  // Handle immediate search (when user clicks search button)
  const handleImmediateSearch = useCallback(() => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
      setDebounceTimeout(null);
    }
    if (countdownInterval) {
      clearInterval(countdownInterval);
      setCountdownInterval(null);
    }
    setCountdownSeconds(null);
    setDebouncedSearchQuery(searchQuery);
  }, [searchQuery, debounceTimeout, countdownInterval]);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setCountdownSeconds(null);
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
      setDebounceTimeout(null);
    }
    if (countdownInterval) {
      clearInterval(countdownInterval);
      setCountdownInterval(null);
    }
  }, [debounceTimeout, countdownInterval]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
  } = useExploreFeed(debouncedSearchQuery);

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

  // Cleanup timeout and interval on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [debounceTimeout, countdownInterval]);

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

            <div className="text-muted-foreground text-sm mb-6">
              {user
                ? "Discover posts from across the Nostr network"
                : "Discover posts from gleasonator.dev"
              }
            </div>

            {/* Beautiful Search Bar */}
            <Card className="gleam-card mb-6">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Search Input with Actions */}
                  <div className="relative flex items-center space-x-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search posts, topics, or hashtags..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-10 pr-20 h-12 text-base"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleImmediateSearch();
                          }
                        }}
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                        {searchQuery && (
                          <Button
                            onClick={handleClearSearch}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-destructive/10"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          onClick={handleImmediateSearch}
                          disabled={isLoading}
                          size="sm"
                          className="h-8 px-3"
                        >
                          Search
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Search Status and Info */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      {debouncedSearchQuery ? (
                        <>
                          <Search className="w-4 h-4" />
                          <span>
                            Searching for: <span className="font-medium text-foreground">"{debouncedSearchQuery}"</span>
                          </span>
                        </>
                      ) : (
                        <>
                          <Globe className="w-4 h-4" />
                          <span>
                            {user ? "Showing all posts" : "Showing posts from gleasonator.dev"}
                          </span>
                        </>
                      )}
                    </div>

                    {searchQuery && searchQuery !== debouncedSearchQuery && countdownSeconds !== null && (
                      <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        Auto-search in {countdownSeconds}s...
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

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
                    {debouncedSearchQuery ? (
                      <Search className="w-12 h-12 text-muted-foreground mx-auto" />
                    ) : (
                      <Globe className="w-12 h-12 text-muted-foreground mx-auto" />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {debouncedSearchQuery ? "No results found" : "No posts found"}
                      </h3>
                      <p className="text-muted-foreground mt-1">
                        {debouncedSearchQuery
                          ? `No posts found matching "${debouncedSearchQuery}". Try different keywords or clear the search.`
                          : user
                            ? "Try switching to a different relay to discover content"
                            : "No posts from gleasonator.dev found. Try switching to a different relay."
                        }
                      </p>
                    </div>
                    {debouncedSearchQuery ? (
                      <Button
                        onClick={handleClearSearch}
                        variant="outline"
                        className="w-full"
                      >
                        Clear Search
                      </Button>
                    ) : (
                      <RelaySelector className="w-full" />
                    )}
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
                      {debouncedSearchQuery
                        ? `You've seen all results for "${debouncedSearchQuery}". Try a different search term or clear the search.`
                        : user
                          ? "You've explored all available posts! Try switching relays for more content."
                          : "You've seen all available posts from gleasonator.dev! Try switching relays for more content."
                      }
                    </div>
                    {debouncedSearchQuery ? (
                      <Button
                        onClick={handleClearSearch}
                        variant="outline"
                        className="w-full max-w-sm mx-auto mt-4"
                      >
                        Clear Search
                      </Button>
                    ) : (
                      <RelaySelector className="w-full max-w-sm mx-auto mt-4" />
                    )}
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