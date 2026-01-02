
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

function HorizontalNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const handleSignOut = async () => {
    await signOutUser();
    router.push('/');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    }
  };

  const menuItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/members', icon: Users, label: 'Members' },
    { href: '/forum', icon: BookOpen, label: 'Forum' },
    { href: '/chat', icon: MessageSquare, label: 'Chat' },
  ];

  const NavLinks = ({ isMobile = false }: { isMobile?: boolean }) => (
    <nav className={cn(
        "items-center gap-1",
        isMobile ? "flex flex-col p-4" : "flex"
    )}>
      {menuItems.map((item) => (
        <Button 
          asChild 
          key={item.href} 
          variant={pathname.startsWith(item.href) ? "secondary" : "ghost"}
          className={cn("justify-start", isMobile ? "w-full" : "")}
          onClick={() => isMobile && setMobileMenuOpen(false)}
        >
          <Link href={item.href}>
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
          </Link>
        </Button>
      ))}
      {user?.role === 'admin' && (
         <Button 
          asChild 
          variant={pathname.startsWith('/admin') ? "secondary" : "ghost"}
          className={cn("justify-start", isMobile ? "w-full" : "")}
          onClick={() => isMobile && setMobileMenuOpen(false)}
        >
          <Link href="/admin">
            <Shield className="mr-2 h-4 w-4" />
            Admin
          </Link>
        </Button>
      )}
    </nav>
  );

  if (!mounted) {
    // Render a skeleton or null on the server and initial client render
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
            <div className="mr-4 flex items-center gap-2">
                 <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <MessageSquare size={18} />
                </div>
                <span className="font-bold text-lg hidden md:inline-block">Connectify</span>
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-full max-w-xs p-0">
                        <SheetHeader className="p-4 border-b">
                            <SheetTitle asChild>
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                        <MessageSquare size={18} />
                                    </div>
                                    <span className="font-bold text-lg">Connectify</span>
                                </div>
                            </SheetTitle>
                             <SheetDescription className="sr-only">
                                Main navigation menu for the Connectify Hub application.
                            </SheetDescription>
                        </SheetHeader>
                        <NavLinks isMobile />
                    </SheetContent>
                </Sheet>
            </div>
            
            <div className="flex flex-1 items-center justify-end space-x-2">
                <div className="hidden md:flex items-center gap-1">
                    <NavLinks />
                </div>
                <div className="flex items-center gap-2">
                    <div ref={searchContainerRef} className={cn("relative w-full transition-all duration-300 ease-in-out", isSearchOpen ? "max-w-xs" : "max-w-[2.5rem]")}>
                        <Button variant="ghost" size="icon" className={cn("absolute right-0 top-1/2 -translate-y-1/2 z-10", isSearchOpen ? 'hidden' : 'inline-flex')} onClick={() => setIsSearchOpen(true)}>
                            <Search className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <form onSubmit={handleSearchSubmit}>
                            <Input 
                                placeholder="Search..." 
                                className={cn("pl-8 transition-all", isSearchOpen ? 'opacity-100' : 'opacity-0')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </form>
                    </div>
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
                                        <AvatarFallback>{user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon size={16} />}</AvatarFallback>
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
                              <DropdownMenuItem onClick={() => router.push('/dashboard')}>
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
    const publicPages = ['/', '/login', '/signup', '/forgot-password', '/book-demo'];
    const isAdminPage = pathname.startsWith('/admin');
    const isPublicPage = publicPages.includes(pathname) || pathname.startsWith('/search');

    if (isPublicPage || isAdminPage) {
        if(pathname === '/book-demo' || pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password') {
            return (
                <div className="flex flex-col min-h-screen bg-background">
                    <Header />
                    <main className="flex-grow flex items-center justify-center p-4">
                        {children}
                    </main>
                </div>
            );
        }
        return <>{children}</>;
    }
  
    return (
        <div className="relative flex min-h-screen flex-col">
            <HorizontalNav />
            <div className="flex-1">{children}</div>
            <FloatingAssistant />
        </div>
    );
}
