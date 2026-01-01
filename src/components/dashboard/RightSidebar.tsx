
'use client';

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";

const events = [
    { time: '10:45 - 11:30 AM', title: 'Beginner sharing session creator', author: 'Darlene Robertson' },
    { time: '15:20 - 16:00 PM', title: 'Improve performance for content ideas', author: 'Esther Howard' },
]

const suggestedPosts = [
    'Trending post',
    'For you',
    'Like post'
]

function UpgradeCard() {
    return (
        <Card className="bg-primary/90 text-primary-foreground relative overflow-hidden">
            <CardHeader>
                <CardTitle>Free trial used: 6 / 14 Day</CardTitle>
                <CardDescription className="text-primary-foreground/80">
                    Upgrade now for creator connect to access all features in there.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm font-bold">42%</span>
                </div>
                <Progress value={42} className="h-2 bg-primary-foreground/30" />
                <Button variant="secondary" className="mt-4 w-full">Upgrade now</Button>
            </CardContent>
            <Image 
                src="https://picsum.photos/seed/rocket/100/100"
                alt="Upgrade illustration"
                width={100}
                height={100}
                data-ai-hint="rocket illustration"
                className="absolute -right-4 -bottom-4 opacity-50"
            />
        </Card>
    );
}

function EventCalendar() {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Event</CardTitle>
                <Button variant="link" size="sm">See All</Button>
            </CardHeader>
            <CardContent>
                <Calendar
                    mode="single"
                    selected={new Date(2023, 5, 3)}
                    className="p-0"
                />
                <div className="mt-4 space-y-4">
                    {events.map((event, index) => (
                        <div key={index} className="flex items-start gap-4 pl-4 border-l-2 border-primary">
                            <div>
                               <p className="text-xs text-muted-foreground">{event.time}</p>
                               <p className="font-semibold text-sm">{event.title}</p>
                               <p className="text-xs text-muted-foreground">{event.author}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

function SuggestedPost() {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Suggested post</CardTitle>
                <Button variant="link" size="sm">See All</Button>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2">
                    {suggestedPosts.map(post => (
                        <Button key={post} variant="secondary" size="sm">{post}</Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}


export default function RightSidebar() {
  return (
    <div className="space-y-6">
      <UpgradeCard />
      <EventCalendar />
      <SuggestedPost />
    </div>
  )
}
