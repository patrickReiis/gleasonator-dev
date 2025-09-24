import { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from '@/components/Sidebar';
import { RelaySelector } from '@/components/RelaySelector';
import { Menu } from 'lucide-react';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { user } = useCurrentUser();

  return (
    <div className="lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <div className="p-6 space-y-6">
            {/* Mobile relay selector */}
            <div>
              <h3 className="text-sm font-medium mb-3">Relay</h3>
              <RelaySelector className="w-full" />
            </div>

            {/* Sidebar content */}
            <Sidebar />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}