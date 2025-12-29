
'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function Header() {
    const { user, loading } = useAuth();
  return (
    <header className="w-full py-4 px-4 sm:px-6 lg:px-8 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <MessageSquare size={18} />
                </div>
                <span>Connectify Hub</span>
            </Link>
            <nav className="flex items-center gap-4">
                {!loading && !user && (
                    <>
                        <Button variant="ghost" asChild>
                            <Link href="/login">Sign In</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/signup">Join Now</Link>
                        </Button>
                    </>
                )}
                {!loading && user && (
                    <Button asChild>
                        <Link href="/dashboard">Go to Dashboard</Link>
                    </Button>
                )}
            </nav>
        </div>
    </header>
  );
}
