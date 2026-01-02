
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Building, Quote } from "lucide-react";
import Image from "next/image";

export default function AboutSection() {
    return (
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl font-bold">Learn About What We Do</h2>
              <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Why we do it and the people who make it all happen</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="animate-fade-in-up animation-delay-200">
                    <p className="text-muted-foreground mb-6">
                        We are building a community-driven platform focused on meaningful discussions, collaboration, and knowledge sharing. Our goal is to empower people to connect, learn, and grow together in a trusted and engaging environment.
                    </p>
                    <div className="bg-muted/50 border-l-4 border-primary p-6 rounded-r-lg mb-8">
                        <Quote className="h-6 w-6 text-primary mb-2" />
                        <p className="text-lg font-semibold italic text-foreground">
                            To create a transparent, inclusive, and intelligent community platform where every member’s voice matters.
                        </p>
                    </div>
                    <Button asChild size="lg" className="shadow-lg shadow-primary/20">
                      <Link href="/about">
                        Learn More About Us
                      </Link>
                    </Button>
                </div>
                <div className="animate-fade-in-up animation-delay-400">
                    <Card className="shadow-xl overflow-hidden">
                        <CardContent className="p-8">
                            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                                <Avatar className="h-24 w-24 border-4 border-primary/20">
                                    <AvatarImage src="https://www.gtmaxis.ai/SanthoshSrikant.jpg" />
                                    <AvatarFallback>S</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold">Santhosh</h3>
                                    <p className="text-primary font-medium">Founder & CEO</p>
                                    <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground mt-1">
                                        <Building size={14} />
                                        <span>TNBIT</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-muted-foreground mt-6 pt-6 border-t">
                                Santhosh is the visionary behind TNBIT, driving innovation and community-first thinking. With a strong focus on technology, scalability, and user experience, he leads the platform with a mission to build sustainable digital communities.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
          </div>
        </section>
    );
}
