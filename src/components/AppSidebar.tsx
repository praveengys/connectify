
'use client';

import {
  LayoutDashboard,
  Users,
  MessageSquare,
  BookOpen,
  LogOut,
  User as UserIcon,
  Menu,
  Search,
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
import { useState } from 'react';
import { Input } from './ui/input';
import FloatingAssistant from './assistant/FloatingAssistant';

function HorizontalNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOutUser();
    router.push('/');
  };

  const menuItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/members', icon: Users, label: 'Members' },
    { href: '/forum', icon: BookOpen, label: 'Forum' },
    { href: '/chat', icon: MessageSquare, label: 'Chat' },
  ];

  const NavLinks = ({ isMobile = false }: { isMobile?: boolean }) => (
    <nav className={isMobile ? "flex flex-col gap-2 p-4" : "hidden md:flex items-center gap-4"}>
      {menuItems.map((item) => (
        <Button 
          asChild 
          key={item.href} 
          variant={pathname === item.href ? "secondary" : "ghost"}
          className={isMobile ? "justify-start" : ""}
          onClick={() => isMobile && setMobileMenuOpen(false)}
        >
          <Link href={item.href}>
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
          </Link>
        </Button>
      ))}
    </nav>
  );


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
            <div className="mr-4 hidden md:flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <MessageSquare size={18} />
                </div>
                <span className="font-bold text-lg">Connectify</span>
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
                 <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search..." className="pl-8" />
                </div>
                <div className="hidden md:flex">
                   <NavLinks />
                </div>
                <div className="flex items-center gap-2 ml-auto">
                    {loading ? (
                        <div className="h-10 w-24 animate-pulse rounded-md bg-muted"></div>
                    ) : user ? (
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

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const publicPages = ['/', '/login', '/signup', '/forgot-password'];
    const isPublicPage = publicPages.includes(pathname);
  
    if (isPublicPage) {
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
