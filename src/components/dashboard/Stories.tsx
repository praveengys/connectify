
'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import Image from "next/image";

const stories = [
    { name: "Add Story", image: null, isAdd: true },
    { name: "Robert Fox", image: "https://picsum.photos/seed/robert/80/80", dataAiHint: "man" },
    { name: "Kick Rompe", image: "https://picsum.photos/seed/kick/80/80", dataAiHint: "man gaming" },
    { name: "Arlene McCoy", image: "https://picsum.photos/seed/arlene/80/80", dataAiHint: "woman gaming" },
    { name: "John Doe", image: "https://picsum.photos/seed/john/80/80", dataAiHint: "man" },
    { name: "Jane Smith", image: "https://picsum.photos/seed/jane/80/80", dataAiHint: "woman" },
];

export default function Stories() {
  return (
      <div className="flex space-x-4 overflow-x-auto pb-4 -mx-2 px-2">
        {stories.map((story, index) => (
          <div key={index} className="flex flex-col items-center space-y-2 flex-shrink-0 w-24">
            <div className="relative w-20 h-28 rounded-xl overflow-hidden cursor-pointer group">
              {story.isAdd ? (
                <div className="w-full h-full bg-muted flex flex-col items-center justify-end p-2 text-center">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground mb-1">
                        <Plus size={24} />
                    </div>
                    <p className="text-xs font-semibold">{story.name}</p>
                </div>
              ) : (
                <>
                  <Image 
                    src={story.image!} 
                    alt={story.name} 
                    fill
                    className="object-cover"
                    data-ai-hint={story.dataAiHint}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <p className="absolute bottom-2 left-2 text-white text-xs font-semibold">{story.name}</p>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
  );
}
