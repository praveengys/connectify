
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const blogPosts = [
    { id: 'blog-1', title: 'Tackle Your closest Spring cleaning', date: 'May 14, 2019' },
    { id: 'blog-2', title: 'The Truth About Business Blogging', date: 'May 14, 2019' },
    { id: 'blog-3', title: '10 Tips to stay healthy when...', date: 'May 14, 2019' },
    { id: 'blog-4', title: 'Visiting Amsterdam on a Budget', date: 'May 8, 2019' },
    { id: 'blog-5', title: 'OMA completes renovation of Sotheby\'s New...', date: 'May 8, 2019' },
];

export default function BlogFeed() {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg">Blog</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {blogPosts.map(post => {
                    const placeholder = PlaceHolderImages.find(p => p.id === post.id);
                    return (
                        <div key={post.id} className="flex items-center gap-4">
                            {placeholder && (
                                <Image 
                                    src={placeholder.imageUrl}
                                    alt={placeholder.description}
                                    width={80}
                                    height={60}
                                    className="rounded-md"
                                    data-ai-hint={placeholder.imageHint}
                                />
                            )}
                            <div>
                                <Link href="#" className="font-semibold text-sm leading-tight hover:underline">{post.title}</Link>
                                <p className="text-xs text-muted-foreground mt-1">{post.date}</p>
                            </div>
                        </div>
                    )
                })}
                 <Button variant="outline" className="w-full">See All</Button>
            </CardContent>
        </Card>
    );
}
