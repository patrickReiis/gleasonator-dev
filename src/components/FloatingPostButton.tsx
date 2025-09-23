import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PostModal } from '@/components/PostModal';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Edit3 } from 'lucide-react';

export function FloatingPostButton() {
  const [modalOpen, setModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [justAppeared, setJustAppeared] = useState(false);

  // Show FAB when user scrolls down from the top
  useEffect(() => {
    const handleScroll = () => {
      const shouldShow = window.scrollY > 200;

      // If button is becoming visible for the first time, trigger pulse animation
      if (shouldShow && !isVisible) {
        setJustAppeared(true);
        setTimeout(() => setJustAppeared(false), 2000); // Remove pulse class after animation
      }

      setIsVisible(shouldShow);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isVisible]);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => setModalOpen(true)}
            className={`
              fixed bottom-6 right-4 sm:right-6 z-50 w-14 h-14 rounded-full
              gleam-fab text-white border-0 hover:scale-105 active:scale-95
              transition-all duration-300
              ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}
              ${justAppeared ? 'gleam-fab-appear' : ''}
            `}
            size="icon"
          >
            <Edit3 className="w-6 h-6" />
            <span className="sr-only">Create new post</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Create new post</p>
        </TooltipContent>
      </Tooltip>

      <PostModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}