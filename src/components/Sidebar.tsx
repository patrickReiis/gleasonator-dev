import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Home, User, Settings, Globe, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Sidebar() {
  const { user } = useCurrentUser();
  const author = useAuthor(user?.pubkey || '');
  const navigate = useNavigate();

  const metadata = author.data?.metadata;
  const displayName = metadata?.display_name || metadata?.name || (user ? genUserName(user.pubkey) : '');
  const profileImage = metadata?.picture;
  const about = metadata?.about;

  return (
    <div className="space-y-6">
      {/* User profile card */}
      {user && (
        <Card
          className="gleam-card gleam-card-clickable cursor-pointer transition-all duration-200"
          onClick={() => navigate('/profile')}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <Avatar className="gleam-avatar w-12 h-12">
                <AvatarImage src={profileImage} alt={displayName} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  {displayName}
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  @{metadata?.name || genUserName(user.pubkey)}
                </p>
              </div>
            </div>

            {about && (
              <p className="text-sm text-muted-foreground mt-3 line-clamp-3">
                {about}
              </p>
            )}
          </CardHeader>
        </Card>
      )}

      {/* Navigation */}
      <Card className="gleam-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Navigate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start"
            size="sm"
            onClick={() => navigate('/')}
          >
            <Home className="w-4 h-4 mr-3" />
            Home
          </Button>

          {user && (
            <>
              <Button
                variant="ghost"
                className="w-full justify-start"
                size="sm"
                onClick={() => navigate('/profile')}
              >
                <User className="w-4 h-4 mr-3" />
                Profile
              </Button>

              <Button variant="ghost" className="w-full justify-start" size="sm">
                <Settings className="w-4 h-4 mr-3" />
                Settings
              </Button>
            </>
          )}

          <Button variant="ghost" className="w-full justify-start" size="sm">
            <Globe className="w-4 h-4 mr-3" />
            Explore
          </Button>
        </CardContent>
      </Card>

      {/* About Gleasonator */}
      <Card className="gleam-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">About Gleasonator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            A modern Nostr client with a nostalgic 2010s aesthetic. Connect, share, and discover on the decentralized social web.
          </p>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              <Zap className="w-3 h-3 mr-1" />
              Nostr
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Decentralized
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Open Source
            </Badge>
          </div>

          <div className="pt-2 text-xs text-muted-foreground">
            <p>
              Vibed with{' '}
              <a
                href="https://soapbox.pub/mkstack"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                MKStack
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}