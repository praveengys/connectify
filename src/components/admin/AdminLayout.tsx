
'use client';

import Link from 'next/link';
import {
  Bell,
  Home,
  Users,
  MessageSquare,
  Shield,
  LogOut,
  Settings,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { signOutUser } from '@/lib/firebase/auth';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import CommunityAssistantWidget from '../dashboard/CommunityAssistantWidget';

const NavLink = ({ href, children, exact = false }: { href: string; children: React.ReactNode, exact?: boolean }) => {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
        isActive && 'bg-muted text-primary'
      )}
    >
      {children}
    </Link>
  );
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  
  const handleSignOut = async () => {
    await signOutUser();
    router.push('/');
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Shield className="h-6 w-6 text-primary" />
              <span className="">Admin Console</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <NavLink href="/admin" exact>
                <Home className="h-4 w-4" />
                Dashboard
              </NavLink>
              <NavLink href="/admin/users">
                <Users className="h-4 w-4" />
                Users
              </NavLink>
              <NavLink href="/admin/groups">
                <MessageSquare className="h-4 w-4" />
                Groups
              </NavLink>
               <NavLink href="/admin/discussions">
                <MessageSquare className="h-4 w-4" />
                Discussions
              </NavLink>
            </nav>
          </div>
          <div className="mt-auto p-4">
            <Card>
                <CardHeader className="p-2 pt-0 md:p-4">
                  <CardTitle>Need Help?</CardTitle>
                  <CardDescription>
                    Ask the assistant or check our documentation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="sm" className="w-full">
                        Get Help
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-80 md:w-96 p-0 rounded-xl shadow-2xl" 
                      side="top" 
                      align="end"
                    >
                      <CommunityAssistantWidget />
                    </PopoverContent>
                  </Popover>
                </CardContent>
              </Card>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
           <div className="w-full flex-1">
             {/* Can add a global admin search here later */}
           </div>
           <div>
            {user && (
                <div className="flex items-center gap-4">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatarUrl ?? undefined} />
                        <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-sm font-medium">{user.displayName}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleSignOut}><LogOut className="h-4 w-4"/></Button>
                </div>
            )}
           </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
