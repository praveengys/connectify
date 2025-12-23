import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Header from '@/components/Header';

export default function Home() {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero-community');

  const features = [
    {
      icon: <CheckCircle2 className="h-8 w-8 text-primary" />,
      title: 'Secure Member Accounts',
      description: 'Your personal space is protected with industry-standard security.',
    },
    {
      icon: <CheckCircle2 className="h-8 w-8 text-primary" />,
      title: 'Community Discussions',
      description: 'Engage in meaningful conversations and share your ideas.',
    },
    {
      icon: <CheckCircle2 className="h-8 w-8 text-primary" />,
      title: 'Group Interactions',
      description: 'Form smaller groups around your interests for focused collaboration.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <section className="relative w-full py-20 md:py-32 lg:py-40 bg-card">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl font-headline font-bold tracking-tighter sm:text-5xl md:text-6xl text-primary-foreground">
                Welcome to Connectify Hub
              </h1>
              <p className="mt-4 text-lg text-muted-foreground md:text-xl">
                The place where connections are made, ideas are born, and communities thrive. Join us and be part of something bigger.
              </p>
              <div className="mt-8 flex justify-center gap-4">
                <Button asChild size="lg">
                  <Link href="/signup">Join the Community</Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {heroImage && (
          <section className="w-full py-12 md:py-24">
            <div className="container mx-auto px-4 md:px-6">
              <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                data-ai-hint={heroImage.imageHint}
                width={1200}
                height={600}
                className="rounded-xl shadow-2xl mx-auto aspect-video overflow-hidden object-cover"
              />
            </div>
          </section>
        )}

        <section className="w-full py-12 md:py-24 bg-card">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-8 md:grid-cols-3">
              {features.map((feature, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center gap-4">
                    {feature.icon}
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
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
