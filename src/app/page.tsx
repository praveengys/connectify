
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, MessageSquare, Users, BookOpen, Sparkles } from 'lucide-react';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import AboutSection from '@/components/landing/AboutSection';

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
        <section className="relative container mx-auto px-4 py-20 md:py-32 text-center flex flex-col items-center">
          <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem] opacity-20"></div>
          <div className="animate-fade-in-up">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500">
              Welcome to Connectify Hub
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
              The all-in-one platform to connect with peers, share knowledge, and grow together. Join a thriving community today.
            </p>
          </div>
          <div className="flex gap-4 animate-fade-in-up animation-delay-200">
            <Button asChild size="lg" className="shadow-lg shadow-primary/20">
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
        <section className="py-20 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900/50 dark:to-background animate-background-pan [background-size:200%_200%]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl font-bold">What We Offer</h2>
              <p className="text-muted-foreground mt-2">Everything you need in a community platform.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="card-hover bg-background/80 backdrop-blur-sm animate-fade-in-up animation-delay-200">
                <CardContent className="p-8 text-center">
                    <div className="p-4 bg-primary/10 rounded-full inline-block mb-4">
                        <Users className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Engaging Discussions</h3>
                    <p className="text-muted-foreground">
                    Dive into threaded conversations in our organized forums, ask questions, and share your expertise.
                    </p>
                </CardContent>
              </Card>
              <Card className="card-hover bg-background/80 backdrop-blur-sm animate-fade-in-up animation-delay-400">
                <CardContent className="p-8 text-center">
                    <div className="p-4 bg-primary/10 rounded-full inline-block mb-4">
                        <MessageSquare className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Real-Time Chat</h3>
                    <p className="text-muted-foreground">
                    Connect instantly with members in public or private groups. Perfect for networking and quick collaborations.
                    </p>
                </CardContent>
              </Card>
              <Card className="card-hover bg-background/80 backdrop-blur-sm animate-fade-in-up animation-delay-600">
                <CardContent className="p-8 text-center">
                    <div className="p-4 bg-primary/10 rounded-full inline-block mb-4">
                        <BookOpen className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Member Profiles</h3>
                    <p className="text-muted-foreground">
                    Build your profile, showcase your skills, and discover other members with shared interests.
                    </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* About Section */}
        <AboutSection />

        {/* Call to Action Section */}
        <section className="container mx-auto px-4 py-20 text-center">
            <div className="animate-fade-in-up">
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Join?</h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                  Become a part of our growing community and start connecting with like-minded individuals from around the world.
              </p>
              <Button asChild size="lg" className="shadow-lg shadow-primary/20">
                  <Link href="/signup">
                  Create Your Account
                  </Link>
              </Button>
            </div>
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
