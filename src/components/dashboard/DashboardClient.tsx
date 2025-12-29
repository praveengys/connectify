
'use client';

import { useState } from 'react';
import type { UserProfile } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit, User, MessageSquare, Users, PlusCircle } from 'lucide-react';
import ProfileForm from './ProfileForm';
import { Progress } from '../ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import Link from 'next/link';

type DashboardClientProps = {
  user: UserProfile;
};

export default function DashboardClient({ user: initialUser }: DashboardClientProps) {
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);

  const handleProfileUpdate = (updatedUser: UserProfile) => {
    setUser(updatedUser);
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
  
  const completeness = getProfileCompleteness(user);

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.displayName}.</p>
        </div>
        <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogTrigger asChild>
            <Button>
                <User className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>Edit Your Profile</DialogTitle>
            </DialogHeader>
            <ProfileForm user={user} onUpdate={handleProfileUpdate} closeDialog={() => setEditDialogOpen(false)} />
            </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Profile Completeness</CardTitle>
                    <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{completeness}%</div>
                    <Progress value={completeness} className="mt-2 h-2" />
                    <p className="text-xs text-muted-foreground mt-2">Complete your profile to get the most out of the community.</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Quick Links</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 pt-4">
                    <Button variant="outline" asChild className="justify-start">
                        <Link href="/forum/threads/new">
                            <PlusCircle className="mr-2"/> Start a New Discussion
                        </Link>
                    </Button>
                    <Button variant="outline" asChild className="justify-start">
                        <Link href="/chat">
                            <MessageSquare className="mr-2"/> Browse Chat Groups
                        </Link>
                    </Button>
                    <Button variant="outline" asChild className="justify-start">
                        <Link href="/members">
                            <Users className="mr-2"/> Find Members
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
        
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
            <CardDescription>A quick glance at your public-facing info.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center">
             <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={user.avatarUrl ?? undefined} alt={user.displayName ?? 'user'} />
                <AvatarFallback>{user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
            </Avatar>
            <h3 className="font-semibold text-lg">{user.displayName}</h3>
            <p className="text-sm text-muted-foreground">@{user.username || 'new_member'}</p>
            <p className="text-sm mt-2 text-muted-foreground line-clamp-3">
                {user.bio || 'No bio yet. Add one by editing your profile!'}
            </p>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
