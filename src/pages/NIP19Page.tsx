import { nip19 } from 'nostr-tools';
import { useParams, Navigate } from 'react-router-dom';
import { usePost } from '@/hooks/usePost';
import { Header } from '@/components/Header';
import { ReplyThread } from '@/components/ReplyThread';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FloatingPostButton } from '@/components/FloatingPostButton';
import { ArrowLeft } from 'lucide-react';
import NotFound from './NotFound';

function EventView({ eventId, identifier }: { eventId: string; identifier: string }) {
  const { data: post, isLoading: postLoading, isError: postError } = usePost(eventId);

  if (postLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-4 gap-6">
            <aside className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24">
                <Sidebar />
              </div>
            </aside>

            <div className="lg:col-span-3 xl:col-span-2 space-y-6">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

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

            <aside className="hidden xl:block xl:col-span-1">
              <div className="sticky top-24">
                <div className="text-center text-muted-foreground text-sm p-4">
                  More features coming soon...
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    );
  }

  if (postError || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-4 gap-6">
            <aside className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24">
                <Sidebar />
              </div>
            </aside>

            <div className="lg:col-span-3 xl:col-span-2 space-y-6">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <Card className="gleam-card border-destructive/50">
                <CardContent className="p-6 text-center">
                  <h2 className="text-lg font-semibold text-foreground mb-2">
                    Event Not Found
                  </h2>
                  <p className="text-muted-foreground">
                    This event could not be found or may have been deleted.
                  </p>
                  <Button className="mt-4" variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                  </Button>
                </CardContent>
              </Card>
            </div>

            <aside className="hidden xl:block xl:col-span-1">
              <div className="sticky top-24">
                <div className="text-center text-muted-foreground text-sm p-4">
                  More features coming soon...
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-4 gap-6">
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24">
              <Sidebar />
            </div>
          </aside>

          <div className="lg:col-span-3 xl:col-span-2 space-y-6">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <ReplyThread eventId={eventId} showRoot={true} />
          </div>

          <aside className="hidden xl:block xl:col-span-1">
            <div className="sticky top-24">
              <div className="text-center text-muted-foreground text-sm p-4">
                More features coming soon...
              </div>
            </div>
          </aside>
        </div>
      </main>

      <FloatingPostButton />
    </div>
  );
}

export function NIP19Page() {
  const { nip19: identifier } = useParams<{ nip19: string }>();

  if (!identifier) {
    return <NotFound />;
  }

  let decoded;
  try {
    decoded = nip19.decode(identifier);
  } catch {
    return <NotFound />;
  }

  const { type } = decoded;

  switch (type) {
    case 'npub':
    case 'nprofile':
      // Redirect to profile page
      return <Navigate to={`/profile/${identifier}`} replace />;

    case 'note':
      // Redirect to post page
      return <Navigate to={`/post/${identifier}`} replace />;

    case 'nevent':
      // Extract event ID from nevent and display it
      const eventId = decoded.data.id;
      return <EventView eventId={eventId} identifier={identifier} />;

    case 'naddr':
      // For addressable events, extract the coordinates and display
      const { kind, pubkey, identifier: dTag } = decoded.data;
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6 text-center">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Addressable Event
              </h2>
              <p className="text-muted-foreground text-sm mb-4">
                Kind: {kind}<br />
                Author: {pubkey.slice(0, 8)}...{pubkey.slice(-8)}<br />
                Identifier: {dTag}
              </p>
              <p className="text-muted-foreground">
                Addressable event display coming soon...
              </p>
            </CardContent>
          </Card>
        </div>
      );

    default:
      return <NotFound />;
  }
}