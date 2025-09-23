import { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { usePostActions } from '@/hooks/usePostActions';
import { genUserName } from '@/lib/genUserName';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoginArea } from '@/components/auth/LoginArea';

interface PostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PostModal({ open, onOpenChange }: PostModalProps) {
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
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Reset content when modal closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setContent('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create a post</DialogTitle>
        </DialogHeader>
        
        {!user ? (
          <div className="text-center py-8 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              Sign in to post
            </h3>
            <p className="text-muted-foreground">
              Connect your Nostr account to share your thoughts
            </p>
            <LoginArea className="max-w-60 mx-auto" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex space-x-3">
              <Avatar className="gleam-avatar w-10 h-10">
                <AvatarImage src={profileImage} alt={displayName} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <p className="font-medium text-sm text-foreground">
                  {displayName}
                </p>
                <p className="text-xs text-muted-foreground">
                  @{metadata?.name || genUserName(user.pubkey)}
                </p>
              </div>
            </div>
            
            <Textarea
              placeholder="What's happening?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[120px] resize-none text-base border-1 focus-visible:ring-1 focus-visible:ring-primary placeholder:text-muted-foreground/60"
              autoFocus
            />
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {content.length > 0 && (
                  <span className={content.length > 280 ? 'text-destructive' : ''}>
                    {content.length}/280
                  </span>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!content.trim() || content.length > 280 || createPost.isPending}
                  className="gleam-button gleam-button-primary"
                >
                  {createPost.isPending ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}