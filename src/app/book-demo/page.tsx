
import BookDemoClient from '@/components/demo/BookDemoClient';
import Header from '@/components/Header';

export default function BookDemoPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight">Book a Product Demo</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            See GTM Axis in action. Schedule a live demo with one of our product experts.
          </p>
        </div>
        <BookDemoClient />
      </main>
      <footer className="w-full py-6 bg-background mt-auto">
        <div className="container mx-auto px-4 md:px-6 text-center text-muted-foreground">
          <p>&copy; 2025 AITSP Community Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
