
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const updates = [
    { id: 1, user: 'John', avatarHint: 'man', action: 'posted an update', time: '3 years ago' },
    { id: 2, user: 'Adele', avatarHint: 'woman', action: 'posted an update', time: '3 years ago' },
    { id: 3, user: 'John', avatarHint: 'man', action: 'posted an update', time: '4 years ago' },
    { id: 4, user: 'John', avatarHint: 'man', action: 'posted an update in the group', group: 'Coffee Addicts', time: '4 years ago' },
    { id: 5, user: 'John', avatarHint: 'man', action: 'posted an update', time: '4 years ago' },
]

export default function LatestUpdates() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Latest updates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {updates.map(update => (
                    <div key={update.id} className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={`https://picsum.photos/seed/u${update.id}/${update.user}/40/40`} data-ai-hint={update.avatarHint} />
                            <AvatarFallback>{update.user.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-sm">
                                <Link href="#" className="font-semibold hover:underline">{update.user}</Link> {update.action} {update.group && <Link href="#" className="font-semibold hover:underline">{update.group}</Link>}
                            </p>
                            <p className="text-xs text-muted-foreground">{update.time}</p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
