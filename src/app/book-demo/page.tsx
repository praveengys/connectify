
import BookDemoClient from '@/components/demo/BookDemoClient';

export default function BookDemoPage() {
  return (
    <div className="w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight">Book a Product Demo</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            See GTM Axis in action. Schedule a live demo with one of our product experts.
          </p>
        </div>
        <BookDemoClient />
    </div>
  );
}
