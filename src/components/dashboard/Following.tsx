
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const following = [
    { id: '1', name: 'User 1', image: 'https://picsum.photos/seed/f1/40/40', hint: "person" },
    { id: '2', name: 'User 2', image: 'https://picsum.photos/seed/f2/40/40', hint: "person" },
    { id: '3', name: 'User 3', image: 'https://picsum.photos/seed/f3/40/40', hint: "person" },
    { id: '4', name: 'User 4', image: 'https://picsum.photos/seed/f4/40/40', hint: "person" },
    { id: '5', name: 'User 5', image: 'https://picsum.photos/seed/f5/40/40', hint: "person" },
    { id: '6', name: 'User 6', image: 'https://picsum.photos/seed/f6/40/40', hint: "person" },
    { id: '7', name: 'User 7', image: 'https://picsum.photos/seed/f7/40/40', hint: "person" },
    { id: '8', name: 'User 8', image: 'https://picsum.photos/seed/f8/40/40', hint: "person" },
    { id: '9', name: 'User 9', image: 'https://picsum.photos/seed/f9/40/40', hint: "person" },
    { id: '10', name: 'User 10', image: 'https://picsum.photos/seed/f10/40/40', hint: "person" },
    { id: '11', name: 'User 11', image: 'https://picsum.photos/seed/f11/40/40', hint: "person" },
    { id: '12', name: 'User 12', image: 'https://picsum.photos/seed/f12/40/40', hint: "person" },
    { id: '13', name: 'User 13', image: 'https://picsum.photos/seed/f13/40/40', hint: "person" },
    { id: '14', name: 'User 14', image: 'https://picsum.photos/seed/f14/40/40', hint: "person" },
    { id: '15', name: 'User 15', image: 'https://picsum.photos/seed/f15/40/40', hint: "person" },
    { id: '16', name: 'User 16', image: 'https://picsum.photos/seed/f16/40/40', hint: "person" },
];

export default function Following() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">I'm Following 16</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
                {following.map(person => (
                    <Avatar key={person.id} className="h-10 w-10 border-2 border-background">
                        <AvatarImage src={person.image} alt={person.name} data-ai-hint={person.hint} />
                        <AvatarFallback>{person.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                ))}
            </CardContent>
        </Card>
    );
}
