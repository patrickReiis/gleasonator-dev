import { useRef, useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import type { NostrEvent } from '@nostrify/nostrify';
import { extractVideoData } from '@/hooks/useShortVideos';
import { useAuthor } from '@/hooks/useAuthor';
import { usePostInteractions } from '@/hooks/useGlobalFeed';
import { usePostActions } from '@/hooks/usePostActions';
import { genUserName } from '@/lib/genUserName';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Repeat2, Share, Play, Pause, VolumeX, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface VideoPlayerProps {
  event: NostrEvent;
  isActive: boolean;
  onVideoEnd?: () => void;
}

export function VideoPlayer({ event, isActive, onVideoEnd }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const { ref, inView } = useInView({
    threshold: 0.6, // Video needs to be 60% visible to auto-play
    triggerOnce: false
  });
  const navigate = useNavigate();

  const videoData = extractVideoData(event);
  const author = useAuthor(event.pubkey);
  const interactions = usePostInteractions(event.id);
  const { likePost, repostPost, isLoggedIn } = usePostActions();

  const metadata = author.data?.metadata;
  const displayName = metadata?.display_name || metadata?.name || genUserName(event.pubkey);
  const profileImage = metadata?.picture;

  const interactionData = interactions.data?.pages[0];
  const likes = interactionData?.likes || [];
  const reposts = interactionData?.reposts || [];
  const replies = interactionData?.replies || [];

  // Auto-play when video becomes in view (50% threshold)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (inView) {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(console.error);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [inView]);

  // Handle video end
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVideoEnd = () => {
      setIsPlaying(false);
      onVideoEnd?.();
    };

    video.addEventListener('ended', handleVideoEnd);
    return () => video.removeEventListener('ended', handleVideoEnd);
  }, [onVideoEnd]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(console.error);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) return;
    likePost.mutate(event.id);
  };

  const handleRepost = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) return;
    repostPost.mutate({ id: event.id, pubkey: event.pubkey });
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profile/${event.pubkey}`);
  };

  // Determine if this is a vertical video for different aspect ratio
  const isVertical = videoData.videoVariants?.some(variant => {
    if (variant.dimension) {
      const [width, height] = variant.dimension.split('x').map(Number);
      return height > width;
    }
    return false;
  });

  return (
    <div
      ref={ref}
      className={`relative w-full bg-black rounded-lg overflow-hidden gleam-card ${
        isVertical ? 'aspect-[9/16] mx-auto' : 'aspect-video'
      }`}
      style={isVertical ? { maxWidth: '360px' } : {}}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onClick={togglePlay}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={videoData.url}
        poster={videoData.thumbnail}
        className="w-full h-full object-cover"
        loop
        muted={isMuted}
        playsInline
        preload="metadata"
      />

      {/* Video overlay controls */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* Play/Pause button */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              size="icon"
              className="w-16 h-16 rounded-full bg-black/50 text-white hover:bg-black/70"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
            >
              <Play className="w-8 h-8 ml-1" />
            </Button>
          </div>
        )}

        {/* Top controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="w-10 h-10 rounded-full bg-black/50 text-white hover:bg-black/70"
            onClick={(e) => {
              e.stopPropagation();
              toggleMute();
            }}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Video info overlay - bottom */}
      <div className="absolute bottom-4 left-4 right-4 text-white">
        <div className="flex items-end justify-between">
          {/* Video info */}
          <div className="flex-1 mr-4">
            {/* Author profile */}
            <button
              onClick={handleProfileClick}
              className="flex items-center space-x-2 mb-2 hover:opacity-80 transition-opacity"
            >
              <Avatar className="w-8 h-8 border-2 border-white">
                <AvatarImage src={profileImage} alt={displayName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{displayName}</span>
            </button>

            {videoData.title && (
              <h3 className="font-bold text-base mb-1 line-clamp-2">
                {videoData.title}
              </h3>
            )}
            {videoData.description && (
              <p className="text-sm opacity-90 mb-2 line-clamp-2">
                {videoData.description}
              </p>
            )}
            {videoData.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {videoData.hashtags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="text-sm text-blue-300">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleLike}
              disabled={!isLoggedIn}
              className="w-10 h-10 rounded-full bg-black/50 text-white hover:bg-red-500/70 transition-colors"
            >
              <Heart className="w-5 h-5" />
              <span className="sr-only">Like</span>
            </Button>
            <span className="text-xs">{likes.length}</span>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => navigate(`/post/${event.id}`)}
              className="w-10 h-10 rounded-full bg-black/50 text-white hover:bg-blue-500/70 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="sr-only">Comment</span>
            </Button>
            <span className="text-xs">{replies.length}</span>

            <Button
              size="icon"
              variant="ghost"
              onClick={handleRepost}
              disabled={!isLoggedIn}
              className="w-10 h-10 rounded-full bg-black/50 text-white hover:bg-green-500/70 transition-colors"
            >
              <Repeat2 className="w-5 h-5" />
              <span className="sr-only">Repost</span>
            </Button>
            <span className="text-xs">{reposts.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}