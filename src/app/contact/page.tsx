
import ContactForm from '@/components/contact/ContactForm';

export default function ContactPage() {
  return (
    <div className="w-full min-h-[calc(100vh-theme(height.14))] flex items-center justify-center py-12">
        <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight">Get in Touch</h1>
            <p className="mt-4 text-lg text-muted-foreground">
                Have a question or feedback? Fill out the form below and we'll get back to you.
            </p>
            </div>
            <ContactForm />
        </div>
    </div>
  );
}
