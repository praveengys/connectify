
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, MessageSquare, Users, BookOpen, Sparkles, UserCheck, Shield, Zap, LifeBuoy } from 'lucide-react';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import AboutSection from '@/components/landing/AboutSection';
import NewsletterForm from '@/components/landing/NewsletterForm';

const phrases = [
    "The Community Behind AITSP",
    "Meaningful Discussions",
    "Shared Learning",
    "Collective Progress",
];

export default function LandingPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [typedText, setTypedText] = useState('');
    const [phraseIndex, setPhraseIndex] = useState(0);

    useEffect(() => {
        if (!loading && user) {
            router.replace('/dashboard');
        }
    }, [user, loading, router]);
    
    useEffect(() => {
        let currentIndex = 0;
        let isDeleting = false;
        let timeoutId: NodeJS.Timeout;

        const type = () => {
          const currentPhrase = phrases[phraseIndex];
          
          if (isDeleting) {
            setTypedText(currentPhrase.substring(0, currentIndex - 1));
            currentIndex--;
            if (currentIndex === 0) {
              isDeleting = false;
              setPhraseIndex((prevIndex) => (prevIndex + 1) % phrases.length);
            }
          } else {
            setTypedText(currentPhrase.substring(0, currentIndex + 1));
            currentIndex++;
            if (currentIndex === currentPhrase.length) {
              // Pause at the end of the phrase
              timeoutId = setTimeout(() => {
                isDeleting = true;
              }, 2000);
            }
          }
        };
    
        const typingInterval = setInterval(type, isDeleting ? 75 : 150);
    
        return () => {
            clearInterval(typingInterval);
            clearTimeout(timeoutId);
        };
      }, [phraseIndex]);


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative container mx-auto px-4 py-20 md:py-32 text-center flex flex-col items-center">
          <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem] opacity-20"></div>
          <div className="animate-fade-in-up">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 h-24 md:h-32">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500">
                    {typedText}
                </span>
                <span className="typing-cursor">|</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
              The AITSP Community Platform is a dedicated digital space built exclusively for AITSP members to connect, collaborate, and grow together. It brings professionals, leaders, and contributors into a single trusted environment designed to foster meaningful discussions, shared learning, and collective progress.
            </p>
          </div>
          <div className="flex gap-4 animate-fade-in-up animation-delay-200">
            <Button asChild size="lg" className="shadow-lg shadow-primary/20">
              <Link href="/login">
                Join Discussions <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/groups">Explore Groups</Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900/50 dark:to-background animate-background-pan [background-size:200%_200%]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl font-bold">Our Core Principles</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="card-hover bg-background/80 backdrop-blur-sm animate-fade-in-up animation-delay-200">
                <CardContent className="p-8 text-center">
                    <div className="p-4 bg-primary/10 rounded-full inline-block mb-4">
                        <UserCheck className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Member-Centric</h3>
                    <p className="text-muted-foreground">
                    Built exclusively for AITSP members, ensuring relevance, trust, and meaningful engagement.
                    </p>
                </CardContent>
              </Card>
              <Card className="card-hover bg-background/80 backdrop-blur-sm animate-fade-in-up animation-delay-400">
                <CardContent className="p-8 text-center">
                    <div className="p-4 bg-primary/10 rounded-full inline-block mb-4">
                        <Users className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Community-Driven</h3>
                    <p className="text-muted-foreground">
                    Encouraging discussions, knowledge sharing, and collaboration across groups and topics.
                    </p>
                </CardContent>
              </Card>
              <Card className="card-hover bg-background/80 backdrop-blur-sm animate-fade-in-up animation-delay-600">
                <CardContent className="p-8 text-center">
                    <div className="p-4 bg-primary/10 rounded-full inline-block mb-4">
                        <Shield className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Secure & Trusted</h3>
                    <p className="text-muted-foreground">
                    Access-controlled platform with clear moderation and admin oversight.
                    </p>
                </CardContent>
              </Card>
               <Card className="card-hover bg-background/80 backdrop-blur-sm animate-fade-in-up animation-delay-600">
                <CardContent className="p-8 text-center">
                    <div className="p-4 bg-primary/10 rounded-full inline-block mb-4">
                        <Zap className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Real-Time Engagement</h3>
                    <p className="text-muted-foreground">
                    Live updates, discussions, activity tracking, and notifications keep members connected.
                    </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* About Section */}
        <AboutSection />

        {/* Newsletter and Contact Section */}
        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <NewsletterForm />
              <Link href="/contact" className="h-full">
                <Card className="h-full card-hover flex flex-col items-center justify-center text-center p-8 relative overflow-hidden">
                    <div className="absolute -bottom-10 -right-10 w-32 h-32 text-primary/5">
                        <LifeBuoy className="w-full h-full" strokeWidth={0.5}/>
                    </div>
                    <div className="relative">
                        <div className="p-4 bg-primary/10 rounded-full inline-block mb-4">
                            <LifeBuoy className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold">Contact</h3>
                        <p className="text-muted-foreground mt-2">Questions, comments, or concerns? We’re here to help!</p>
                    </div>
                </Card>
              </Link>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="container mx-auto px-4 py-20 text-center">
            <div className="animate-fade-in-up">
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to engage with the AITSP Community?</h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                  Your community, your conversations, your growth.
              </p>
              <Button asChild size="lg" className="shadow-lg shadow-primary/20">
                  <Link href="/login">
                  Join Discussions
                  </Link>
              </Button>
            </div>
        </section>
      </main>
      <footer className="w-full py-6 bg-background">
        <div className="container mx-auto px-4 md:px-6 text-center text-muted-foreground">
          <p>&copy; 2025 AITSP Community Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
