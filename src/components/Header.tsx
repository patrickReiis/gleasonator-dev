import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useTheme } from '@/hooks/useTheme';
import { LoginArea } from '@/components/auth/LoginArea';
import { Button } from '@/components/ui/button';
import { RelaySelector } from '@/components/RelaySelector';
import { MobileNav } from '@/components/MobileNav';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Moon, Sun, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const { user } = useCurrentUser();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side with mobile nav and logo */}
          <div className="flex items-center space-x-3">
            <MobileNav />

            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <img
                src="/gleasonator_logo.png"
                alt="Gleasonator"
                className="w-10 h-10 rounded-xl object-contain"
              />
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-foreground">
                  Gleasonator
                </h1>
                <p className="text-xs text-muted-foreground">
                  gleasonator.dev
                </p>
              </div>
            </button>
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Relay selector - Hidden on small screens */}
            <div className="hidden md:block">
              <RelaySelector className="w-40" />
            </div>

            {/* Theme toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Login area */}
            <LoginArea className="max-w-60" />

            
          </div>
        </div>
      </div>
    </header>
  );
}