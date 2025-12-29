
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, MessageSquare, Users, BookOpen } from 'lucide-react';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LandingPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.replace('/dashboard');
        }
    }, [user, loading, router]);


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center flex flex-col items-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4">
            Welcome to Connectify Hub
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
            The all-in-one platform to connect with peers, share knowledge, and grow together. Join a thriving community today.
          </p>
          <div className="flex gap-4">
            <Button asChild size="lg">
              <Link href="/signup">
                Join Now <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/forum">Explore Discussions</Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-secondary/40 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">What We Offer</h2>
              <p className="text-muted-foreground mt-2">Everything you need in a community platform.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="p-6">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Engaging Discussions</h3>
                <p className="text-muted-foreground">
                  Dive into threaded conversations in our organized forums, ask questions, and share your expertise.
                </p>
              </div>
              <div className="p-6">
                <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Real-Time Chat</h3>
                <p className="text-muted-foreground">
                  Connect instantly with members in public or private groups. Perfect for networking and quick collaborations.
                </p>
              </div>
              <div className="p-6">
                <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Member Profiles</h3>
                <p className="text-muted-foreground">
                  Build your profile, showcase your skills, and discover other members with shared interests.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="container mx-auto px-4 py-20 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Join?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                Become a part of our growing community and start connecting with like-minded individuals from around the world.
            </p>
            <Button asChild size="lg">
                <Link href="/signup">
                Create Your Account
                </Link>
            </Button>
        </section>
      </main>
      <footer className="w-full py-6 bg-background">
        <div className="container mx-auto px-4 md:px-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Connectify Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
