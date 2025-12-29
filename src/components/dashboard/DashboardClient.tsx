
'use client';

import { useState, useEffect } from 'react';
import type { UserProfile, Group, Forum, Thread } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Edit, Users, Search, BookOpen } from 'lucide-react';
import ProfileForm from './ProfileForm';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import Link from 'next/link';
import Image from 'next/image';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { Skeleton } from '../ui/skeleton';
import { Progress } from '../ui/progress';

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

const ProfileCompleteness = ({ user, completeness, onEdit }: { user: UserProfile, completeness: number, onEdit: () => void }) => (
    <Card>
        <CardHeader className="pb-4">
            <CardTitle className="text-lg flex justify-between items-center">
                <span>Complete Your Profile</span>
                 <Button variant="ghost" size="icon" onClick={onEdit}>
                    <Edit className="h-4 w-4" />
                </Button>
            </CardTitle>
            <CardDescription>A complete profile helps you connect with others.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-medium">Profile Progress</p>
                <p className="text-sm font-bold text-primary">{completeness}%</p>
            </div>
            <Progress value={completeness} className="h-2" />
        </CardContent>
    </Card>
);


const ForumsWidget = ({ forums, loading }: { forums: Forum[], loading: boolean }) => (
    <Card>
        <CardHeader>
            <CardTitle className="text-lg">Latest Forums</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            {loading && Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-md" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-4 w-[100px]" />
                    </div>
                </div>
            ))}
            {!loading && forums.map((forum) => (
                <div key={forum.id} className="flex items-center gap-4">
                     <div className="h-16 w-16 bg-secondary rounded-md flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-muted-foreground" />
                     </div>
                    <div>
                        <p className="font-semibold text-sm leading-tight hover:text-primary cursor-pointer">{forum.name}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{forum.description}</p>
                    </div>
                </div>
            ))}
            {!loading && forums.length === 0 && <p className="text-sm text-muted-foreground">No forums created yet.</p>}
             <Button variant="outline" className="w-full" asChild><Link href="/forum">See all</Link></Button>
        </CardContent>
    </Card>
);

const GroupsWidget = ({ groups, loading }: { groups: Group[], loading: boolean }) => (
    <Card>
        <CardHeader>
            <CardTitle className="text-lg">My Groups</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
            {loading && Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-11 w-11 rounded-full" />)}
            {!loading && groups.map(group => (
                 <Link href={`/chat/${group.id}`} key={group.id}>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center hover:ring-2 ring-primary">
                                    <Users className="w-5 h-5 text-muted-foreground" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{group.name}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                 </Link>
            ))}
            {!loading && groups.length === 0 && <p className="text-sm text-muted-foreground p-2">You haven't joined any groups yet.</p>}
        </CardContent>
    </Card>
);

const CommunityStats = ({ stats, loading }: { stats: Record<string, number>, loading: boolean}) => (
    <Card>
        <CardHeader>
            <CardTitle className="text-lg">Community Stats</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center p-2 rounded-lg bg-secondary/50">
                {loading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold">{stats.members || 0}</p>}
                <p className="text-sm text-muted-foreground">Members</p>
            </div>
            <div className="flex flex-col items-center p-2 rounded-lg bg-secondary/50">
                {loading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold">{stats.threads || 0}</p>}
                <p className="text-sm text-muted-foreground">Threads</p>
            </div>
            <div className="flex flex-col items-center p-2 rounded-lg bg-secondary/50">
                {loading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold">{stats.forums || 0}</p>}
                <p className="text-sm text-muted-foreground">Forums</p>
            </div>
             <div className="flex flex-col items-center p-2 rounded-lg bg-secondary/50">
                {loading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold">{stats.groups || 0}</p>}
                <p className="text-sm text-muted-foreground">Groups</p>
            </div>
        </CardContent>
    </Card>
);

const RecentlyActiveMembersWidget = ({ members, loading }: { members: UserProfile[], loading: boolean }) => (
    <Card>
        <CardHeader>
            <CardTitle className="text-lg">Recently Active Members</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
             {loading && Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-11 w-11 rounded-full" />)}
            {!loading && members.map((member) => (
                <Link href={`/members`} key={member.uid}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar className="h-11 w-11 hover:ring-2 ring-primary">
                            <AvatarImage src={member.avatarUrl ?? `https://picsum.photos/seed/${member.uid}/50/50`} />
                            <AvatarFallback>{member.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{member.displayName}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Link>
            ))}
        </CardContent>
    </Card>
);

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export default function DashboardClient({ user: initialUser }: DashboardClientProps) {
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);

  const [forums, setForums] = useState<Forum[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { firestore } = initializeFirebase();
    const unsubscribes: (() => void)[] = [];
    setLoading(true);

    // Fetch Forums
    const forumsQuery = query(collection(firestore, 'forums'), orderBy('createdAt', 'desc'), limit(4));
    unsubscribes.push(onSnapshot(forumsQuery, (snapshot) => {
        setForums(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Forum)));
    }));
    
    // Fetch Groups user is a member of
    const groupsQuery = query(collection(firestore, 'groups'), where(`members.${user.uid}`, 'in', ['owner', 'member', 'admin']), limit(16));
    unsubscribes.push(onSnapshot(groupsQuery, (snapshot) => {
        setGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group)));
    }));

    // Fetch Members
    const membersQuery = query(collection(firestore, 'users'), orderBy('createdAt', 'desc'), limit(8));
     unsubscribes.push(onSnapshot(membersQuery, (snapshot) => {
        setMembers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
    }));
    
    // Fetch Threads for count
    const threadsQuery = query(collection(firestore, 'threads'));
    unsubscribes.push(onSnapshot(threadsQuery, (snapshot) => {
        setThreads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Thread)));
    }));
    
    Promise.all([
        // Wait for first snapshot of all queries
        new Promise(res => onSnapshot(forumsQuery, res)),
        new Promise(res => onSnapshot(groupsQuery, res)),
        new Promise(res => onSnapshot(membersQuery, res)),
        new Promise(res => onSnapshot(threadsQuery, res)),
    ]).then(() => setLoading(false));

    return () => unsubscribes.forEach(unsub => unsub());
  }, [user.uid]);


  const handleProfileUpdate = (updatedUser: UserProfile) => {
    setUser(updatedUser);
  };
  
  const completeness = getProfileCompleteness(user);
  
  const communityStats = {
      members: members.length,
      forums: forums.length,
      groups: groups.length,
      threads: threads.length
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8 bg-secondary/30">
      
      {/* Welcome Banner */}
      <Card className="bg-background">
        <CardContent className="p-6 flex items-center justify-between">
            <div>
                <h2 className="text-xl font-semibold">Welcome back, {user.displayName.split(' ')[0]}!</h2>
                <p className="text-muted-foreground">Here's what's happening in your community.</p>
            </div>
             <Image data-ai-hint="community abstract" src="https://picsum.photos/seed/community/150/80" alt="Community illustration" width={150} height={80} className="hidden sm:block rounded-md" />
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column */}
        <div className="md:col-span-2 lg:col-span-2 space-y-6">
            <ForumsWidget forums={forums} loading={loading} />
            <GroupsWidget groups={groups} loading={loading} />
             <RecentlyActiveMembersWidget members={members} loading={loading} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
             <ProfileCompleteness user={user} completeness={completeness} onEdit={() => setEditDialogOpen(true)} />
             <CommunityStats stats={communityStats} loading={loading} />
        </div>
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

    