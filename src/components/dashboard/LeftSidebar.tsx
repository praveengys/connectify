
'use client';

import Link from 'next/link';
import {
  Home,
  Users,
  BookOpen,
  MessageSquare,
  BarChart2,
  Calendar,
  Rss,
  Settings,
  HelpCircle,
  Radio,
  FileText,
  Mail,
  Store,
  Bot
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';

const NavLink = ({ href, icon: Icon, label, comingSoon, exact = false }: { href:string; icon: React.ElementType; label: string; comingSoon?: boolean, exact?: boolean }) => {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  const linkContent = (
    <div
      className={cn(
        'flex items-center justify-center gap-3 rounded-lg px-3 py-3 text-muted-foreground transition-all hover:text-primary hover:bg-muted',
        isActive && 'bg-muted text-primary font-semibold',
        comingSoon && 'opacity-50 cursor-not-allowed'
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="sr-only">{label}</span>
    </div>
  );

  const tooltipContent = <p>{label}{comingSoon ? ' (Coming Soon)' : ''}</p>;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
            {comingSoon ? (
                <div>{linkContent}</div>
            ) : (
                <Link href={href}>{linkContent}</Link>
            )}
        </TooltipTrigger>
        <TooltipContent side="right">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default function LeftSidebar() {
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  useEffect(() => {
    setMounted(true);
  }, []);

  // On the server, we render a placeholder to avoid layout shift and hydration errors.
  if (!mounted) {
    return <aside className="hidden lg:block w-20 border-r bg-background"></aside>;
  }

  return (
    <aside className="hidden lg:flex lg:flex-col w-20 border-r bg-background">
      <div className="flex h-14 items-center justify-center border-b px-6">
        <Link href="/dashboard" className="flex items-center justify-center gap-2 font-semibold">
          <MessageSquare className="h-6 w-6 text-primary" />
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="grid items-start p-2 text-sm font-medium">
          <NavLink href="/dashboard" icon={Home} label="Home" exact />
          <NavLink href="/dashboard/my-posts" icon={FileText} label="My Posts" />
          <NavLink href="/members" icon={Users} label="Members" />
          <NavLink href="/forum" icon={BookOpen} label="Discussions" />
          <NavLink href="/chat" icon={MessageSquare} label="Chat" />
          <NavLink href="#" icon={Calendar} label="Events" comingSoon />
          <NavLink href="#" icon={Mail} label="Newsletter" comingSoon />
          <NavLink href="#" icon={Store} label="Marketplace" comingSoon />
          <NavLink href="#" icon={Radio} label="Live Streams" comingSoon />
          <NavLink href="#" icon={Bot} label="AI Assistant" comingSoon />
        </nav>
      </div>
      <div className="mt-auto p-2 border-t">
        <nav className="grid gap-1">
            <NavLink href="#" icon={Settings} label="Settings" />
            <NavLink href="#" icon={HelpCircle} label="Help & Support" />
        </nav>
      </div>
    </aside>
  );
}
