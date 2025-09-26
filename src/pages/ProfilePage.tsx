import { useParams, useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { useEffect } from 'react';
import { nip19 } from 'nostr-tools';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { useUserPosts, useUserStats } from '@/hooks/useUserPosts';
import { useFollowUser } from '@/hooks/useFollowUser';
import { genUserName } from '@/lib/genUserName';
import { Header } from '@/components/Header';
import { PostCard } from '@/components/PostCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FloatingPostButton } from '@/components/FloatingPostButton';
import { EditProfileForm } from '@/components/EditProfileForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, MapPin, Link as LinkIcon, Users, MessageSquare, Heart, Edit2, UserPlus, UserMinus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useInView } from 'react-intersection-observer';

export function ProfilePage() {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const { user } = useCurrentUser();

  // Convert npub to hex if needed
  let pubkey = identifier || '';
  try {
    if (identifier?.startsWith('npub1')) {
      const decoded = nip19.decode(identifier);
      if (decoded.type === 'npub') {
        pubkey = decoded.data;
      }
    }
  } catch (error) {
    // Invalid bech32, use as-is (might be hex)
  }

  // If no identifier provided, use current user's pubkey
  if (!pubkey && user) {
    pubkey = user.pubkey;
  }

  const author = useAuthor(pubkey);
  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: postsLoading
  } = useUserPosts(pubkey);

  const { data: statsData, isLoading: statsLoading } = useUserStats(pubkey);
  const { ref, inView } = useInView();

  // Follow/unfollow functionality
  const followUser = useFollowUser(pubkey);

  // Debug logging
  console.log('👤 Profile Page Debug:', {
    pubkey,
    isOwnProfile,
    userExists: !!user,
    userPubkey: user?.pubkey,
    isFollowing: followUser.isFollowing,
    isCheckingFollow: followUser.isCheckingFollow,
    isLoading: followUser.isLoading,
  });

  const metadata = author.data?.metadata;
  const displayName = metadata?.display_name || metadata?.name || (pubkey ? genUserName(pubkey) : '');
  const username = metadata?.name || (pubkey ? genUserName(pubkey) : '');
  const bio = metadata?.about;
  const website = metadata?.website;
  const location = metadata?.nip05;
  const profileImage = metadata?.picture;
  const bannerImage = metadata?.banner;

  const posts = postsData?.pages.flat() || [];
  const stats = statsData?.pages[0];
  const isOwnProfile = user?.pubkey === pubkey;

  // Infinite scroll
  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  useSeoMeta({
    title: pubkey ? `${displayName} (@${username}) - Gleasonator` : 'Profile - Gleasonator',
    description: bio || `View ${displayName}'s profile on Gleasonator`,
  });

  if (!pubkey) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6 max-w-4xl">
          <Card className="gleam-card border-destructive/50">
            <CardContent className="p-6 text-center">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                {user ? 'Profile Not Found' : 'Sign In Required'}
              </h2>
              <p className="text-muted-foreground">
                {user ? 'Invalid profile identifier.' : 'Please sign in to view your profile.'}
              </p>
              <Button
                onClick={() => navigate('/')}
                className="mt-4"
                variant="outline"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="space-y-6">
          {/* Back button */}
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {/* Profile header */}
          <Card className="gleam-card overflow-hidden">
            {/* Banner */}
            {bannerImage && (
              <div className="h-32 sm:h-48 bg-gradient-to-r from-primary/20 to-accent/20 relative">
                <img
                  src={bannerImage}
                  alt="Profile banner"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Avatar */}
                <div className={`${bannerImage ? '-mt-16 sm:-mt-20' : ''} relative`}>
                  <Avatar className="gleam-avatar w-24 h-24 sm:w-32 sm:h-32 border-4 border-background">
                    <AvatarImage src={profileImage} alt={displayName} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
                      {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Profile info */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-foreground">
                        {author.isLoading ? (
                          <Skeleton className="h-8 w-48" />
                        ) : (
                          displayName
                        )}
                      </h1>
                      <p className="text-muted-foreground">
                        {author.isLoading ? (
                          <Skeleton className="h-4 w-32" />
                        ) : (
                          `@${username}`
                        )}
                      </p>
                      {isOwnProfile && (
                        <Badge variant="secondary" className="mt-1">
                          Your Profile
                        </Badge>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      {/* Follow/Unfollow button for other users' profiles */}
                      {!isOwnProfile && user && (
                        <div className="flex gap-2">
                          <Button
                            onClick={followUser.toggleFollow}
                            disabled={followUser.isLoading || followUser.isCheckingFollow}
                            variant={followUser.isFollowing ? "outline" : "default"}
                            size="sm"
                            className="gleam-button hover:bg-primary/10 hover:border-primary/50 transition-all duration-200"
                          >
                            {followUser.isLoading || followUser.isCheckingFollow ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                            ) : followUser.isFollowing ? (
                              <UserMinus className="w-4 h-4 mr-2" />
                            ) : (
                              <UserPlus className="w-4 h-4 mr-2" />
                            )}
                            {followUser.isLoading || followUser.isCheckingFollow
                              ? 'Loading...'
                              : followUser.isFollowing
                                ? 'Unfollow'
                                : 'Follow'
                            }
                          </Button>

                          {/* Debug refresh button - remove this later */}
                          <Button
                            onClick={() => window.location.reload()}
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            title="Debug: Refresh page"
                          >
                            🔄
                          </Button>
                        </div>
                      )}

                      {/* Edit profile button for own profile */}
                      {isOwnProfile && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gleam-button hover:bg-primary/10 hover:border-primary/50 transition-all duration-200"
                            >
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit Profile
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden gleam-card border-2">
                            <DialogHeader className="border-b border-border/50 pb-4">
                              <DialogTitle className="flex items-center gap-3 text-xl">
                                <div className="w-8 h-8 rounded-lg gleam-gradient flex items-center justify-center">
                                  <Edit2 className="w-4 h-4 text-white" />
                                </div>
                                Edit Your Profile
                              </DialogTitle>
                              <p className="text-sm text-muted-foreground mt-2">
                                Update your profile information and let others know more about you.
                              </p>
                            </DialogHeader>
                            <div className="overflow-y-auto max-h-[calc(85vh-120px)] py-4 px-1">
                              <EditProfileForm />
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>

                  {bio && (
                    <p className="text-foreground leading-relaxed">
                      {bio}
                    </p>
                  )}

                  {/* Profile metadata */}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{location}</span>
                      </div>
                    )}
                    {website && (
                      <div className="flex items-center gap-1">
                        <LinkIcon className="w-4 h-4" />
                        <a
                          href={website.startsWith('http') ? website : `https://${website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="gleam-card">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12 mx-auto" />
                  ) : (
                    stats?.postsCount || 0
                  )}
                </div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  Posts
                </div>
              </CardContent>
            </Card>

            <Card className="gleam-card">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12 mx-auto" />
                  ) : (
                    stats?.followingCount || 0
                  )}
                </div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Users className="w-4 h-4" />
                  Following
                </div>
              </CardContent>
            </Card>

            <Card className="gleam-card">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12 mx-auto" />
                  ) : (
                    stats?.followersCount || 0
                  )}
                </div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Heart className="w-4 h-4" />
                  Followers
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Posts section */}
          <Card className="gleam-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Posts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {postsLoading ? (
                <div className="space-y-4 p-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="gleam-card">
                      <CardContent className="p-6">
                        <div className="flex space-x-4">
                          <Skeleton className="w-12 h-12 rounded-full" />
                          <div className="flex-1 space-y-3">
                            <Skeleton className="h-4 w-32" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-4/5" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="p-12 text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {isOwnProfile ? "You haven't posted yet" : `${displayName} hasn't posted yet`}
                  </h3>
                  <p className="text-muted-foreground">
                    {isOwnProfile ? "Share your first thought!" : "Check back later for updates."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 p-6">
                  {posts.map((post) => (
                    <PostCard key={`${post.id}-${post.created_at}`} event={post} />
                  ))}

                  {hasNextPage && (
                    <div ref={ref} className="py-4">
                      {isFetchingNextPage && (
                        <Card className="gleam-card">
                          <CardContent className="p-6">
                            <div className="flex space-x-4">
                              <Skeleton className="w-12 h-12 rounded-full" />
                              <div className="flex-1 space-y-3">
                                <Skeleton className="h-4 w-32" />
                                <div className="space-y-2">
                                  <Skeleton className="h-4 w-full" />
                                  <Skeleton className="h-4 w-4/5" />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <FloatingPostButton />
    </div>
  );
}