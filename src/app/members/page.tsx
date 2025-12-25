import MembersClient from '@/components/members/MembersClient';

export default function MembersPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <MembersClient />
      </main>
      <footer className="w-full py-6 bg-background">
        <div className="container mx-auto px-4 md:px-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Connectify Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
