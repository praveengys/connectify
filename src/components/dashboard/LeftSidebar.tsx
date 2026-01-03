
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

const NavLink = ({ href, icon: Icon, label, comingSoon, exact = false }: { href: string; icon: React.ElementType; label: string; comingSoon?: boolean, exact?: boolean }) => {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  const linkContent = (
      <div
        className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted',
            isActive && 'bg-muted text-primary font-semibold',
            comingSoon && 'opacity-50 cursor-not-allowed'
        )}
        >
        <Icon className="h-5 w-5" />
        <span className="truncate">{label}</span>
        {comingSoon && <Badge variant="secondary" className="ml-auto text-xs">Soon</Badge>}
      </div>
  );

  if (comingSoon) {
      return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger className="w-full">
                    {linkContent}
                </TooltipTrigger>
                <TooltipContent side="right">
                    <p>Coming Soon!</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      );
  }

  return (
    <Link href={href}>
        {linkContent}
    </Link>
  );
};

export default function LeftSidebar() {
  return (
    <aside className="hidden lg:flex lg:flex-col w-64 border-r bg-background">
      <div className="flex h-14 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <MessageSquare className="h-6 w-6 text-primary" />
          <span>Connectify Hub</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="grid items-start p-4 text-sm font-medium">
          <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Community</h3>
          <NavLink href="/dashboard" icon={Home} label="Home" exact />
          <NavLink href="/members" icon={Users} label="Members" />
          <NavLink href="/forum" icon={BookOpen} label="Discussions" />
          <NavLink href="/chat" icon={MessageSquare} label="Chat" />
          <NavLink href="#" icon={Calendar} label="Events" comingSoon />
          <NavLink href="#" icon={FileText} label="Blogs" comingSoon />
          
          <h3 className="px-3 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Growth</h3>
          <NavLink href="#" icon={Mail} label="Newsletter" comingSoon />
          <NavLink href="#" icon={Store} label="Marketplace" comingSoon />
          
          <h3 className="px-3 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Features</h3>
          <NavLink href="#" icon={Radio} label="Live Streams" comingSoon />
           <NavLink href="#" icon={Bot} label="AI Assistant" comingSoon />

        </nav>
      </div>
      <div className="mt-auto p-4 border-t">
        <nav className="grid gap-1">
            <NavLink href="#" icon={Settings} label="Settings" />
            <NavLink href="#" icon={HelpCircle} label="Help & Support" />
        </nav>
      </div>
    </aside>
  );
}
