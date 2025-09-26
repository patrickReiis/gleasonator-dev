import { useSeoMeta } from '@unhead/react';
import { Header } from '@/components/Header';
import { ComposePost } from '@/components/ComposePost';
import { Feed } from '@/components/Feed';
import { Sidebar } from '@/components/Sidebar';
import { FloatingPostButton } from '@/components/FloatingPostButton';

const Index = () => {
  useSeoMeta({
    title: 'Gleasonator - Connect on Nostr',
    description: 'Don\'t let your memes be dreams. Let\'s work together to create the future that we believe in.',
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-4 gap-6">
          {/* Sidebar - Hidden on mobile, visible on desktop */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24">
              <Sidebar />
            </div>
          </aside>

          {/* Main content */}
          <div className="lg:col-span-3 xl:col-span-2 space-y-6">
            <ComposePost />
            <Feed />
          </div>

          {/* Right sidebar - Could be used for trending, suggestions, etc. */}
          <aside className="hidden xl:block xl:col-span-1">
            <div className="sticky top-24">
              {/* Placeholder for future features */}
              <div className="text-center text-muted-foreground text-sm p-4">
                More features coming soon...
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Floating action button for quick posting */}
      <FloatingPostButton />
    </div>
  );
};

export default Index;
