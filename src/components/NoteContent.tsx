import { useMemo, useState } from 'react';
import { type NostrEvent } from '@nostrify/nostrify';
import { Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AudioPlayer } from './AudioPlayer';
import { SimpleVideoPlayer } from './SimpleVideoPlayer';
import { QuotePost } from './QuotePost';

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
  const [expandedVideo, setExpandedVideo] = useState<{ url: string; title?: string } | null>(null);

  const closeModal = (e?: any) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedImage(null);
  };

  const closeVideoModal = (e?: any) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setExpandedVideo(null);
  };

  // Extract media files and text content separately
  const { textContent, images, audioFiles, videoFiles } = useMemo(() => {
    const text = event.content;

    // Regex to match different media types
    const imageRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?[^\s]*)?)/gi;
    const audioRegex = /(https?:\/\/[^\s]+\.(?:mp3|wav|ogg|m4a|flac|aac|weba)(?:\?[^\s]*)?)/gi;
    const videoRegex = /(https?:\/\/[^\s]+\.(?:mp4|webm|ogv|mov|avi|mkv|3gp)(?:\?[^\s]*)?)/gi;

    // Extract all media URLs
    const imageMatches = Array.from(text.matchAll(imageRegex));
    const audioMatches = Array.from(text.matchAll(audioRegex));
    const videoMatches = Array.from(text.matchAll(videoRegex));

    const extractedImages = imageMatches.map(match => match[1]);
    const extractedAudio = audioMatches.map(match => match[1]);
    const extractedVideos = videoMatches.map(match => match[1]);

    // Remove all media URLs from text content
    let cleanText = text;
    [...extractedImages, ...extractedAudio, ...extractedVideos].forEach(mediaUrl => {
      cleanText = cleanText.replace(mediaUrl, '').replace(/\n\n+/g, '\n\n').trim();
    });

    return {
      textContent: cleanText,
      images: extractedImages,
      audioFiles: extractedAudio,
      videoFiles: extractedVideos
    };
  }, [event.content]);

  // Process the text content to render mentions, links, etc.
  const content = useMemo(() => {
    const text = textContent;

    // Regex to find URLs, Nostr references, and hashtags
    const regex = /(https?:\/\/[^\s]+)|(?:nostr:)?(npub1|note1|nprofile1|nevent1|naddr1)([023456789acdefghjklmnpqrstuvwxyz]+)|(#\w+)/g;

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
        // Skip media URLs as they're handled separately
        const isImageUrl = /\.(jpg|jpeg|png|gif|webp|svg)(\?[^\s]*)?$/i.test(url);
        const isAudioUrl = /\.(mp3|wav|ogg|m4a|flac|aac|weba)(\?[^\s]*)?$/i.test(url);
        const isVideoUrl = /\.(mp4|webm|ogv|mov|avi|mkv|3gp)(\?[^\s]*)?$/i.test(url);

        if (!isImageUrl && !isAudioUrl && !isVideoUrl) {
          // Handle non-media URLs
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

          if (decoded.type === 'npub' || decoded.type === 'nprofile') {
            const pubkey = decoded.type === 'npub' ? decoded.data : decoded.data.pubkey;
            parts.push(
              <NostrMention key={`mention-${keyCounter++}`} pubkey={pubkey} />
            );
          } else if (decoded.type === 'note' || decoded.type === 'nevent' || decoded.type === 'naddr') {
            // Render quote posts for these identifier types
            parts.push(
              <div key={`quote-${keyCounter++}`} className="my-3">
                <QuotePost identifier={nostrId} />
              </div>
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

      {/* Audio files section */}
      {audioFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Audio Files</h4>
          <div className="grid gap-3">
            {audioFiles.map((audioUrl, index) => (
              <AudioPlayer
                key={`audio-${index}`}
                src={audioUrl}
                title={`Audio ${index + 1}`}
                className="w-full"
              />
            ))}
          </div>
        </div>
      )}

      {/* Video files section */}
      {videoFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Video Files</h4>
          <div className="grid gap-3">
            {videoFiles.map((videoUrl, index) => (
              <div key={`video-${index}`} className="relative group">
                <SimpleVideoPlayer
                  src={videoUrl}
                  title={`Video ${index + 1}`}
                  className="w-full"
                />
                {/* Expand button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedVideo({ url: videoUrl, title: `Video ${index + 1}` });
                  }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white p-2 rounded-lg hover:bg-black/70"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video modal for fullscreen viewing */}
      <Dialog open={!!expandedVideo} onOpenChange={(open) => {
        if (!open) {
          setExpandedVideo(null);
        }
      }}>
        <DialogContent
          className="max-w-6xl w-full max-h-[95vh] p-2 bg-transparent border-0"
          onPointerDownOutside={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setExpandedVideo(null);
          }}
          onEscapeKeyDown={() => setExpandedVideo(null)}
        >
          {expandedVideo && (
            <div
              className="relative bg-black rounded-lg p-4"
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
                  setExpandedVideo(null);
                }}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 hover:bg-white text-black rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <SimpleVideoPlayer
                src={expandedVideo.url}
                title={expandedVideo.title}
                className="w-full"
              />

              {/* Video counter */}
              {videoFiles.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 text-black px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                  {videoFiles.indexOf(expandedVideo.url) + 1} / {videoFiles.length}
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