import { useState, useRef } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { usePostActions } from '@/hooks/usePostActions';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useToast } from '@/hooks/useToast';
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
import { Image, X, Upload } from 'lucide-react';

interface PostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PostModal({ open, onOpenChange }: PostModalProps) {
  const [content, setContent] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useCurrentUser();
  const { createPost } = usePostActions();
  const { mutateAsync: uploadFile } = useUploadFile();
  const { toast } = useToast();
  const author = useAuthor(user?.pubkey || '');

  const metadata = author.data?.metadata;
  const displayName = metadata?.display_name || metadata?.name || (user ? genUserName(user.pubkey) : '');
  const profileImage = metadata?.picture;

  const handleSubmit = () => {
    if ((!content.trim() && uploadedImages.length === 0) || !user) return;

    // Create post content with images appended
    let postContent = content.trim();
    if (uploadedImages.length > 0) {
      if (postContent) postContent += '\n\n';
      postContent += uploadedImages.join('\n');
    }

    createPost.mutate(postContent);
    setContent('');
    setUploadedImages([]);
    onOpenChange(false);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newImages: string[] = [];

    try {
      for (let i = 0; i < Math.min(files.length, 4 - uploadedImages.length); i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          const [[_, url]] = await uploadFile(file);
          newImages.push(url);
        }
      }

      setUploadedImages(prev => [...prev, ...newImages]);

      if (newImages.length > 0) {
        toast({
          title: 'Success',
          description: `${newImages.length} image${newImages.length > 1 ? 's' : ''} uploaded successfully`,
        });
      }
    } catch (error) {
      console.error('Failed to upload images:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload images. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (indexToRemove: number) => {
    setUploadedImages(prev => prev.filter((_, index) => index !== indexToRemove));
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
      setUploadedImages([]);
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

            {/* Image upload area */}
            <div className="space-y-3">
              {/* Upload button and file input */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || uploadedImages.length >= 4}
                  className="gleam-button"
                >
                  {isUploading ? (
                    <Upload className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Image className="w-4 h-4 mr-2" />
                  )}
                  {isUploading ? 'Uploading...' : 'Add Images'}
                </Button>
                {uploadedImages.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {uploadedImages.length}/4 images
                  </span>
                )}
              </div>

              {/* Image previews */}
              {uploadedImages.length > 0 && (
                <div className={`grid gap-2 ${
                  uploadedImages.length === 1 ? 'grid-cols-1' :
                  uploadedImages.length === 2 ? 'grid-cols-2' :
                  'grid-cols-2'
                }`}>
                  {uploadedImages.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
                  disabled={(!content.trim() && uploadedImages.length === 0) || content.length > 280 || createPost.isPending || isUploading}
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