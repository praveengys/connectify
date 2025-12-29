'use client';

import { useState } from 'react';
import type { UserProfile } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit, User, MessageSquare, Users, PlusCircle, ThumbsUp, MessageCircle, MoreHorizontal, Image as ImageIcon, Video, Mic, Search } from 'lucide-react';
import ProfileForm from './ProfileForm';
import { Progress } from '../ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import Link from 'next/link';
import { Textarea } from '../ui/textarea';
import Image from 'next/image';

type DashboardClientProps = {
  user: UserProfile;
};

const getProfileCompleteness = (profile: UserProfile): number => {
    let score = 0;
    const fields = [
        { value: profile.username, weight: 15 },
        { value: profile.bio, weight: 20 },
        { value: profile.avatarUrl, weight: 15 },
        { value: profile.interests, weight: 10, isArray: true },
        { value: profile.skills, weight: 10, isArray: true },
        { value: profile.location, weight: 10 },
        { value: profile.languages, weight: 5, isArray: true },
        { value: profile.currentlyExploring, weight: 10 }
    ];

    fields.forEach(field => {
        if (field.isArray) {
        if (field.value && (field.value as string[]).length > 0) score += field.weight;
        } else {
        if (field.value) score += field.weight;
        }
    });
    score += 5;
    return Math.min(score, 100);
};

// Placeholder components to match the new layout
const BlogWidget = () => (
    <Card>
        <CardHeader>
            <CardTitle className="text-lg">Blog</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            {[
                { title: 'Tackle Your closest Spring cleaning', date: 'May 14, 2019', image: 'https://picsum.photos/seed/blog1/200/200' },
                { title: 'The Truth About Business Blogging', date: 'May 14, 2019', image: 'https://picsum.photos/seed/blog2/200/200' },
                { title: '10 Tips to stay healthy when...', date: 'May 14, 2019', image: 'https://picsum.photos/seed/blog3/200/200' },
                { title: 'Visiting Amsterdam on a Budget', date: 'May 8, 2019', image: 'https://picsum.photos/seed/blog4/200/200' },
            ].map((post, i) => (
                <div key={i} className="flex items-center gap-4">
                     <Image src={post.image} alt={post.title} width={64} height={64} className="rounded-md object-cover h-16 w-16" />
                    <div>
                        <p className="font-semibold text-sm leading-tight hover:text-primary cursor-pointer">{post.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{post.date}</p>
                    </div>
                </div>
            ))}
             <Button variant="outline" className="w-full">See all</Button>
        </CardContent>
    </Card>
);

const FollowingWidget = () => (
    <Card>
        <CardHeader>
            <CardTitle className="text-lg">I'm Following 16</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
            {Array.from({ length: 16 }).map((_, i) => (
                <Avatar key={i} className="h-9 w-9">
                    <AvatarImage src={`https://picsum.photos/seed/follow${i}/40/40`} />
                    <AvatarFallback>{i}</AvatarFallback>
                </Avatar>
            ))}
        </CardContent>
    </Card>
);

const ActivityFeed = ({ user }: { user: UserProfile }) => (
    <div className="space-y-6">
        <Card>
            <CardContent className="p-4">
                <div className="flex items-start gap-4">
                    <Avatar>
                        <AvatarImage src={user.avatarUrl ?? undefined} />
                        <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Textarea placeholder={`Share what's on your mind, ${user.displayName.split(' ')[0]}...`} className="border-none focus-visible:ring-0 shadow-none p-0" />
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><ImageIcon className="h-5 w-5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Video className="h-5 w-5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Mic className="h-5 w-5" /></Button>
                    </div>
                    <Button>Post Update</Button>
                </div>
            </CardContent>
        </Card>

        {/* Sample Post */}
        <Card>
            <CardContent className="p-4">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={user.avatarUrl ?? undefined} />
                            <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{user.displayName} posted an update</p>
                            <p className="text-xs text-muted-foreground">3 years ago (edited)</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                </div>
                <div className="mt-4 -mx-4">
                     <Image src="https://picsum.photos/seed/beach/800/500" alt="Beach photo" width={800} height={500} className="w-full h-auto" />
                </div>
                <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <ThumbsUp size={16} className="text-primary" />
                        You and Jennifer
                    </div>
                    <span>2 Comments</span>
                </div>

                <div className="flex gap-4 mt-4 pt-4 border-t">
                    <Button variant="ghost"><ThumbsUp className="mr-2" /> Love</Button>
                    <Button variant="ghost"><MessageCircle className="mr-2" /> Comment</Button>
                </div>

                <div className="mt-4 pt-4 border-t space-y-4">
                    <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src="https://picsum.photos/seed/jennifer/40/40" />
                            <AvatarFallback>J</AvatarFallback>
                        </Avatar>
                        <div>
                            <p><span className="font-semibold">Jennifer</span> Where is that? Looks beautiful.</p>
                            <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                                <span>Like</span>
                                <span>Reply</span>
                                <span>3 years ago</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
);

const CompleteProfileWidget = ({ completeness, user }: { completeness: number, user: UserProfile }) => {
    const profileItems = [
        { label: 'General Information', done: (user.bio && user.location) ? true : false},
        { label: 'Work Experience', done: user.company ? true : false },
        { label: 'Profile Photo', done: !!user.avatarUrl },
        { label: 'Cover Photo', done: false }, // Assuming no cover photo yet
    ];
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Complete Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="relative h-24 w-24">
                        <svg className="h-full w-full" width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="18" cy="18" r="16" fill="none" className="stroke-current text-gray-200 dark:text-gray-700" strokeWidth="2"></circle>
                            <circle cx="18" cy="18" r="16" fill="none" className="stroke-current text-green-500" strokeWidth="2" strokeDasharray={`${completeness * 100.5 / 100}, 100.5`} strokeLinecap="round" transform="rotate(-90 18 18)"></circle>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold">{completeness}%</span>
                        </div>
                    </div>
                </div>
                <ul className="space-y-3 text-sm">
                    {profileItems.map(item => (
                        <li key={item.label} className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${item.done ? 'bg-green-500' : 'bg-gray-300'}`}>
                                {item.done && <User size={12} className="text-white" />}
                            </div>
                            <span className={`${item.done ? 'text-foreground' : 'text-muted-foreground'}`}>{item.label}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
};

const LatestUpdatesWidget = () => (
     <Card>
        <CardHeader>
            <CardTitle className="text-lg">Latest updates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
             {[
                { name: 'John', update: 'posted an update', time: '3 years ago', avatar: 'https://picsum.photos/seed/john/40/40' },
                { name: 'Adele', update: 'posted an update', time: '3 years ago', avatar: 'https://picsum.photos/seed/adele/40/40' },
                { name: 'John', update: 'posted an update in the group Coffee Addicts', time: '4 years ago', avatar: 'https://picsum.photos/seed/john2/40/40' },
            ].map((item, i) => (
                 <div key={i} className="flex items-start gap-3">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={item.avatar} />
                        <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-sm">
                            <span className="font-semibold">{item.name}</span>
                            <span> {item.update}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                </div>
            ))}
        </CardContent>
    </Card>
);

const RecentlyActiveMembersWidget = () => (
    <Card>
        <CardHeader>
            <CardTitle className="text-lg">Recently Active Members</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
                <Avatar key={i} className="h-11 w-11">
                    <AvatarImage src={`https://picsum.photos/seed/active${i}/50/50`} />
                    <AvatarFallback>{i}</AvatarFallback>
                </Avatar>
            ))}
        </CardContent>
    </Card>
);

export default function DashboardClient({ user: initialUser }: DashboardClientProps) {
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);

  const handleProfileUpdate = (updatedUser: UserProfile) => {
    setUser(updatedUser);
  };
  
  const completeness = getProfileCompleteness(user);

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8 bg-secondary/30">
      
      {/* Welcome Banner */}
      <Card className="bg-background">
        <CardContent className="p-6 flex items-center justify-between">
            <div>
                <h2 className="text-xl font-semibold">You're using the Connectify Hub Demo</h2>
                <p className="text-muted-foreground">Launch your community today; get it now!</p>
            </div>
             <Image src="https://picsum.photos/seed/community/150/80" alt="Community illustration" width={150} height={80} />
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column */}
        <aside className="lg:col-span-3 space-y-6">
            <BlogWidget />
            <FollowingWidget />
        </aside>

        {/* Middle Column */}
        <main className="lg:col-span-6 space-y-6">
            <h2 className="text-2xl font-bold">Activity Feed</h2>
            <ActivityFeed user={user} />
        </main>

        {/* Right Column */}
        <aside className="lg:col-span-3 space-y-6">
             <CompleteProfileWidget completeness={completeness} user={user} />
             <LatestUpdatesWidget />
             <RecentlyActiveMembersWidget />
        </aside>
      </div>

       <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>Edit Your Profile</DialogTitle>
            </DialogHeader>
            <ProfileForm user={user} onUpdate={handleProfileUpdate} closeDialog={() => setEditDialogOpen(false)} />
            </DialogContent>
        </Dialog>
    </div>
  );
}
