import { useMemo, useState } from 'react';
import { type NostrEvent } from '@nostrify/nostrify';
import { Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface NoteContentProps {
  event: NostrEvent;
  className?: string;
}

/** Parses content of text note events so that URLs and hashtags are linkified. */
export function NoteContent({
  event,
  className,
}: NoteContentProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const closeModal = (e?: any) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedImage(null);
  };

  // Extract images and text content separately
  const { textContent, images } = useMemo(() => {
    const text = event.content;

    // Regex to match image URLs (common image formats)
    const imageRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?[^\s]*)?)/gi;

    // Extract all image URLs
    const imageMatches = Array.from(text.matchAll(imageRegex));
    const extractedImages = imageMatches.map(match => match[1]);

    // Remove image URLs from text content
    let cleanText = text;
    extractedImages.forEach(imageUrl => {
      cleanText = cleanText.replace(imageUrl, '').replace(/\n\n+/g, '\n\n').trim();
    });

    return {
      textContent: cleanText,
      images: extractedImages
    };
  }, [event.content]);

  // Process the text content to render mentions, links, etc.
  const content = useMemo(() => {
    const text = textContent;

    // Regex to find URLs, Nostr references, and hashtags
    const regex = /(https?:\/\/[^\s]+)|nostr:(npub1|note1|nprofile1|nevent1)([023456789acdefghjklmnpqrstuvwxyz]+)|(#\w+)/g;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let keyCounter = 0;

    while ((match = regex.exec(text)) !== null) {
      const [fullMatch, url, nostrPrefix, nostrData, hashtag] = match;
      const index = match.index;

      // Add text before this match
      if (index > lastIndex) {
        parts.push(text.substring(lastIndex, index));
      }

      if (url) {
        // Skip image URLs as they're handled separately
        const isImageUrl = /\.(jpg|jpeg|png|gif|webp|svg)(\?[^\s]*)?$/i.test(url);
        if (!isImageUrl) {
          // Handle non-image URLs
          parts.push(
            <a
              key={`url-${keyCounter++}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {url}
            </a>
          );
        }
      } else if (nostrPrefix && nostrData) {
        // Handle Nostr references
        try {
          const nostrId = `${nostrPrefix}${nostrData}`;
          const decoded = nip19.decode(nostrId);

          if (decoded.type === 'npub') {
            const pubkey = decoded.data;
            parts.push(
              <NostrMention key={`mention-${keyCounter++}`} pubkey={pubkey} />
            );
          } else {
            // For other types, just show as a link
            parts.push(
              <Link
                key={`nostr-${keyCounter++}`}
                to={`/${nostrId}`}
                className="text-blue-500 hover:underline"
              >
                {fullMatch}
              </Link>
            );
          }
        } catch {
          // If decoding fails, just render as text
          parts.push(fullMatch);
        }
      } else if (hashtag) {
        // Handle hashtags
        const tag = hashtag.slice(1); // Remove the #
        parts.push(
          <Link
            key={`hashtag-${keyCounter++}`}
            to={`/t/${tag}`}
            className="text-blue-500 hover:underline"
          >
            {hashtag}
          </Link>
        );
      }

      lastIndex = index + fullMatch.length;
    }

    // Add any remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    // If no special content was found, just use the plain text
    if (parts.length === 0) {
      parts.push(text);
    }

    return parts;
  }, [textContent]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Text content */}
      {textContent && (
        <div className="whitespace-pre-wrap break-words">
          {content.length > 0 ? content : textContent}
        </div>
      )}

      {/* Image gallery */}
      {images.length > 0 && (
        <div className={cn(
          "gleam-image-gallery grid gap-2",
          images.length === 1 ? "grid-cols-1 single-image" :
          images.length === 2 ? "grid-cols-2" :
          images.length === 3 ? "grid-cols-2" :
          "grid-cols-2"
        )}>
          {images.map((imageUrl, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation(); // Prevent PostCard navigation
                setSelectedImage(imageUrl);
              }}
              className={cn(
                "relative overflow-hidden rounded-lg border border-border hover:opacity-90 transition-opacity bg-muted/20",
                images.length === 3 && index === 0 ? "row-span-2" : "",
                images.length > 2 ? "min-h-[200px] max-h-[400px]" : "min-h-[150px] max-h-[300px]"
              )}
            >
              <img
                src={imageUrl}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-contain hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
              {/* Image overlay for multiple images */}
              {images.length > 4 && index === 3 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    +{images.length - 3}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Image modal */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => {
        if (!open) {
          setSelectedImage(null);
        }
      }}>
        <DialogContent
          className="max-w-5xl w-full max-h-[95vh] p-2 bg-transparent border-0"
          onPointerDownOutside={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSelectedImage(null);
          }}
          onEscapeKeyDown={() => setSelectedImage(null)}
        >
          {selectedImage && (
            <div
              className="relative bg-black/90 rounded-lg p-4"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              {/* Close button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedImage(null);
                }}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 hover:bg-white text-black rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <img
                src={selectedImage}
                alt="Full size image"
                className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
                style={{ maxWidth: '100%', maxHeight: '85vh' }}
                onClick={(e) => e.stopPropagation()}
              />

              {/* Navigation for multiple images */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 text-black px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                  {images.indexOf(selectedImage) + 1} / {images.length}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper component to display user mentions
function NostrMention({ pubkey }: { pubkey: string }) {
  const author = useAuthor(pubkey);
  const npub = nip19.npubEncode(pubkey);
  const hasRealName = !!author.data?.metadata?.name;
  const displayName = author.data?.metadata?.name ?? genUserName(pubkey);

  return (
    <Link
      to={`/${npub}`}
      className={cn(
        "font-medium hover:underline",
        hasRealName
          ? "text-blue-500"
          : "text-gray-500 hover:text-gray-700"
      )}
    >
      @{displayName}
    </Link>
  );
}