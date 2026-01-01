
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const activeMembers = [
    { id: '1', name: 'User 1', image: 'https://picsum.photos/seed/a1/40/40', hint: "person" },
    { id: '2', name: 'User 2', image: 'https://picsum.photos/seed/a2/40/40', hint: "person" },
    { id: '3', name: 'User 3', image: 'https://picsum.photos/seed/a3/40/40', hint: "person" },
    { id: '4', name: 'User 4', image: 'https://picsum.photos/seed/a4/40/40', hint: "person" },
    { id: '5', name: 'User 5', image: 'https://picsum.photos/seed/a5/40/40', hint: "person" },
];

export default function ActiveMembers() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Recently Active Members</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
                {activeMembers.map(person => (
                    <Avatar key={person.id} className="h-10 w-10 border-2 border-background">
                        <AvatarImage src={person.image} alt={person.name} data-ai-hint={person.hint} />
                        <AvatarFallback>{person.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                ))}
            </CardContent>
        </Card>
    );
}
