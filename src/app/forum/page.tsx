import ForumClient from '@/components/forum/ForumClient';
import Header from '@/components/Header';

export default function ForumPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <ForumClient />
      </main>
      <footer className="w-full py-6 bg-background">
        <div className="container mx-auto px-4 md:px-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Connectify Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
