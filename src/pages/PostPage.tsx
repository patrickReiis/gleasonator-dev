import { useParams, useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { nip19 } from 'nostr-tools';
import { usePost } from '@/hooks/usePost';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { Header } from '@/components/Header';
import { ReplyThread } from '@/components/ReplyThread';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FloatingPostButton } from '@/components/FloatingPostButton';
import { ArrowLeft } from 'lucide-react';

export function PostPage() {
  const { eventId: rawEventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  // Convert bech32 note1 to hex if needed
  let eventId = rawEventId || '';
  try {
    if (rawEventId?.startsWith('note1')) {
      const decoded = nip19.decode(rawEventId);
      if (decoded.type === 'note') {
        eventId = decoded.data;
      }
    }
  } catch (error) {
    // Invalid bech32, use as-is (might be hex)
  }

  const { data: post, isLoading: postLoading, isError: postError } = usePost(eventId);
  const author = useAuthor(post?.pubkey || '');

  const metadata = author.data?.metadata;
  const displayName = metadata?.display_name || metadata?.name || (post ? genUserName(post.pubkey) : '');

  useSeoMeta({
    title: post ? `${displayName} on Gleasonator` : 'Post - Gleasonator',
    description: post ?
      `${post.content.slice(0, 160)}${post.content.length > 160 ? '...' : ''}` :
      'View this post on Gleasonator',
  });

  if (!eventId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6 max-w-2xl">
          <Card className="gleam-card border-destructive/50">
            <CardContent className="p-6 text-center">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Invalid Post
              </h2>
              <p className="text-muted-foreground">
                No post ID provided.
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

  if (postLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6 max-w-2xl">
          <div className="space-y-6">
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {/* Loading skeleton for main post */}
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
                      <Skeleton className="h-4 w-3/5" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (postError || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6 max-w-2xl">
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Card className="gleam-card border-destructive/50">
            <CardContent className="p-6 text-center">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Post Not Found
              </h2>
              <p className="text-muted-foreground">
                This post could not be found or may have been deleted.
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

      <main className="container mx-auto px-4 py-6 max-w-2xl">
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

          {/* Reply thread */}
          <ReplyThread eventId={eventId} showRoot={true} />
        </div>
      </main>

      <FloatingPostButton />
    </div>
  );
}