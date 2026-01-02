
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
              <h2 className="text-3xl md:text-4xl font-bold">From Connection to Collaboration</h2>
              <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">AITSP members needed more than just a directory or announcements channel—they needed a living community. This platform enables members to engage in focused discussions, participate in groups, share insights, and stay informed through real-time activity and interactions.</p>
               <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">The result is a transparent, member-driven ecosystem where knowledge flows freely, collaboration happens naturally, and every member stays connected to the pulse of the AITSP community.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="animate-fade-in-up animation-delay-200">
                    <div className="bg-muted/50 border-l-4 border-primary p-6 rounded-r-lg mb-8">
                        <Quote className="h-6 w-6 text-primary mb-2" />
                        <p className="text-lg font-semibold italic text-foreground">
                            Strong communities are not built by technology alone, but by purpose, participation, and trust. This platform exists to empower every AITSP member to contribute, connect, and grow together.
                        </p>
                    </div>
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
                                Founder of the AITSP Community Platform
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
          </div>
        </section>
    );
}
