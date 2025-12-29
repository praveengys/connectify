
'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarProvider,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  BookOpen,
  LogOut,
  User as UserIcon,
  ChevronRight
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

function AppSidebar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();
  const { state } = useSidebar();

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

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <MessageSquare size={18} />
            </div>
            <span className="font-bold text-lg text-sidebar-primary group-data-[collapsible=icon]:hidden">
                Connectify
            </span>
        </div>
        <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={item.label}
                  icon={item.icon}
                >
                  {item.label}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        {loading ? (
            <div className="h-12 w-full animate-pulse rounded-md bg-sidebar-accent"></div>
        ) : user ? (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start gap-2 p-2 h-auto">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatarUrl ?? undefined} alt={user.displayName ?? 'user'} />
                            <AvatarFallback>{user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon />}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start text-left group-data-[collapsible=icon]:hidden">
                            <span className="text-sm font-medium text-sidebar-primary leading-tight">{user.displayName}</span>
                            <span className="text-xs text-muted-foreground leading-tight">@{user.username || '...'}</span>
                        </div>
                        <ChevronRight size={16} className="ml-auto group-data-[collapsible=icon]:hidden" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 mb-2 ml-2" side="right" align="start">
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
            <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
                <Button asChild variant="ghost" className="w-full">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/signup">Join Now</Link>
                </Button>
              </div>
        )}
      </SidebarFooter>
    </Sidebar>
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
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
            {children}
        </SidebarInset>
      </SidebarProvider>
    );
  }
