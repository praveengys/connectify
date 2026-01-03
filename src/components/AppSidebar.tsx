
'use client';

import {
  LayoutDashboard,
  Users,
  BookOpen,
  LogOut,
  User as UserIcon,
  Menu,
  Search,
  Shield,
  MessageSquare,
  Home,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { signOutUser } from '@/lib/firebase/auth';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from './ui/dropdown-menu';
import ProfileCard from './auth/ProfileCard';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from './ui/sheet';
import { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import FloatingAssistant from './assistant/FloatingAssistant';
import { cn } from '@/lib/utils';
import Header from './Header';
import NotificationBell from './notifications/NotificationBell';
import dynamic from 'next/dynamic';

const LeftSidebar = dynamic(() => import('./dashboard/LeftSidebar'), {
  ssr: false,
});


function HorizontalNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    await signOutUser();
    router.push('/');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  if (!mounted) {
    return (
        <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
                <div className="h-8 w-8 bg-muted rounded-lg animate-pulse md:mr-2"></div>
                <div className="h-6 w-24 bg-muted rounded-md animate-pulse hidden md:inline-block"></div>
                <div className="flex-1"></div>
                <div className="h-10 w-10 bg-muted rounded-full animate-pulse"></div>
            </div>
        </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
            <div className="mr-4 flex items-center gap-2">
                <div className="md:hidden">
                    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-full max-w-xs p-0">
                             <div className="flex h-14 items-center border-b px-6">
                                <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                                <MessageSquare className="h-6 w-6 text-primary" />
                                <span>Connectify Hub</span>
                                </Link>
                            </div>
                            <div className="p-4">
                               <nav className="grid items-start text-sm font-medium">
                                 <Link href="/dashboard" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", pathname === '/dashboard' && 'bg-muted text-primary')} onClick={() => setMobileMenuOpen(false)}><Home className="h-4 w-4" />Home</Link>
                                 <Link href="/dashboard/my-posts" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", pathname.startsWith('/dashboard/my-posts') && 'bg-muted text-primary')} onClick={() => setMobileMenuOpen(false)}><FileText className="h-4 w-4" />My Posts</Link>
                                 <Link href="/members" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", pathname.startsWith('/members') && 'bg-muted text-primary')} onClick={() => setMobileMenuOpen(false)}><Users className="h-4 w-4" />Members</Link>
                                 <Link href="/forum" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", pathname.startsWith('/forum') && 'bg-muted text-primary')} onClick={() => setMobileMenuOpen(false)}><BookOpen className="h-4 w-4" />Forum</Link>
                                 <Link href="/chat" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", pathname.startsWith('/chat') && 'bg-muted text-primary')} onClick={() => setMobileMenuOpen(false)}><MessageSquare className="h-4 w-4" />Chat</Link>
                                 {user?.role === 'admin' && <Link href="/admin" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", pathname.startsWith('/admin') && 'bg-muted text-primary')} onClick={() => setMobileMenuOpen(false)}><Shield className="h-4 w-4" />Admin</Link>}
                                 {user?.role === 'moderator' && <Link href="/moderator" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", pathname.startsWith('/moderator') && 'bg-muted text-primary')} onClick={() => setMobileMenuOpen(false)}><Shield className="h-4 w-4" />Moderator</Link>}
                                </nav>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
                 <Link href="/" className="flex items-center gap-2">
                    <div className="h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground hidden md:flex">
                        <MessageSquare size={18} />
                    </div>
                    <span className="font-bold text-lg hidden md:inline-block">Connectify</span>
                </Link>
            </div>

            <div className="flex flex-1 items-center justify-end space-x-2">
                <div className="w-full flex-1 md:w-auto md:flex-none">
                     <form onSubmit={handleSearchSubmit}>
                        <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search..."
                            className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] bg-background"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        </div>
                    </form>
                </div>
                <div className="flex items-center gap-2">
                    {loading ? (
                        <div className="h-10 w-10 animate-pulse rounded-full bg-muted"></div>
                    ) : user ? (
                        <>
                        <NotificationBell />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.avatarUrl ?? undefined} alt={user.displayName ?? 'user'} />
                                        <AvatarFallback>{user.memberFirstName?.charAt(0).toUpperCase() || user.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-80" align="end" forceMount>
                              <ProfileCard user={user} />
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                <span>Dashboard</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={(e) => {
                                    e.preventDefault();
                                    // We can use a custom event or a state management library to open the dialog
                                    // For simplicity, let's use a custom event.
                                    window.dispatchEvent(new CustomEvent('open-edit-profile'));
                                }}
                                >
                                <UserIcon className="mr-2 h-4 w-4" />
                                <span>Edit Profile</span>
                                </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={handleSignOut}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Button asChild variant="ghost">
                              <Link href="/login">Sign In</Link>
                            </Button>
                            <Button asChild>
                              <Link href="/signup">Join Now</Link>
                            </Button>
                          </div>
                    )}
                </div>
            </div>
        </div>
    </header>
  );
}

export default function AppSidebar({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const publicPages = ['/', '/login', '/signup', '/forgot-password'];
    const isAdminPage = pathname.startsWith('/admin');
    const isModeratorPage = pathname.startsWith('/moderator');
    const hideSidebars = pathname.startsWith('/chat');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isPublicPage = publicPages.includes(pathname) || pathname.startsWith('/book-demo');

    if (isPublicPage) {
        // For public pages, we might want a different, simpler layout,
        // or just the content itself. Header is handled inside LandingPage.
        return <>{children}</>;
    }
    
    if (isAdminPage || isModeratorPage) {
        return <>{children}</>;
    }
  
    return (
        <div className="relative flex min-h-screen flex-col bg-secondary/30">
            <HorizontalNav />
            {hideSidebars ? (
                <div className="flex-1">{children}</div>
            ) : (
                <div className="flex flex-1">
                    {mounted && <LeftSidebar />}
                    <main className="flex-1">{children}</main>
                </div>
            )}
            <FloatingAssistant />
        </div>
    );
}
