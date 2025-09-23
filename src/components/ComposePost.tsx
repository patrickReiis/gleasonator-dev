import { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { usePostActions } from '@/hooks/usePostActions';
import { genUserName } from '@/lib/genUserName';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoginArea } from '@/components/auth/LoginArea';

export function ComposePost() {
  const [content, setContent] = useState('');
  const { user } = useCurrentUser();
  const { createPost } = usePostActions();
  const author = useAuthor(user?.pubkey || '');

  const metadata = author.data?.metadata;
  const displayName = metadata?.display_name || metadata?.name || (user ? genUserName(user.pubkey) : '');
  const profileImage = metadata?.picture;

  const handleSubmit = () => {
    if (!content.trim() || !user) return;

    createPost.mutate(content);
    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!user) {
    return (
      <Card className="gleam-card">
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              Welcome to Gleampost
            </h3>
            <p className="text-muted-foreground">
              Connect with the world on Nostr
            </p>
            <LoginArea className="max-w-60 mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gleam-card">
      <CardContent className="p-6">
        <div className="flex space-x-4">
          <Avatar className="gleam-avatar w-12 h-12">
            <AvatarImage src={profileImage} alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-4">
            <Textarea
              placeholder="What's happening?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[120px] resize-none text-base border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
            />

            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {content.length > 0 && (
                  <span className={content.length > 280 ? 'text-destructive' : ''}>
                    {content.length}/280
                  </span>
                )}
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!content.trim() || content.length > 280 || createPost.isPending}
                className="gleam-button gleam-button-primary px-6"
              >
                {createPost.isPending ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}