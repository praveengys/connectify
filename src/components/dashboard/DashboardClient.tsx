'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { UserProfile } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageSquare, Users, Settings, Edit, Eye, EyeOff } from 'lucide-react';
import ProfileForm from './ProfileForm';
import { updateUserProfile } from '@/lib/firebase/firestore';
import { useToast } from '@/hooks/use-toast';

type DashboardClientProps = {
  user: UserProfile;
};

export default function DashboardClient({ user: initialUser }: DashboardClientProps) {
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleProfileUpdate = (updatedUser: UserProfile) => {
    setUser(updatedUser);
  };
  
  const handleVisibilityToggle = async () => {
    const newVisibility = user.profileVisibility === 'public' ? 'private' : 'public';
    try {
      await updateUserProfile(user.uid, { profileVisibility: newVisibility });
      setUser({ ...user, profileVisibility: newVisibility });
      toast({
        title: 'Success',
        description: `Your profile is now ${newVisibility}.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile visibility.',
        variant: 'destructive',
      });
    }
  };

  const navItems = [
    { name: 'Discussions', icon: MessageSquare, future: true },
    { name: 'Groups / Chats', icon: Users, future: true },
    { name: 'Settings', icon: Settings, future: true },
  ];

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-primary">
              <AvatarImage src={user.photoURL ?? undefined} alt={user.name ?? 'User'} />
              <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-3xl font-bold">Welcome, {user.name}!</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleVisibilityToggle} className="gap-2">
              {user.profileVisibility === 'public' ? <Eye size={16} /> : <EyeOff size={16} />}
              {user.profileVisibility === 'public' ? 'Public' : 'Private'}
            </Button>
            <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Edit size={16} /> Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Your Profile</DialogTitle>
                </DialogHeader>
                <ProfileForm user={user} onUpdate={handleProfileUpdate} closeDialog={() => setEditDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Your Workspace</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {navItems.map((item) => (
              <Card key={item.name} className="flex flex-col items-center justify-center p-6 text-center bg-secondary/50 hover:bg-secondary transition-colors">
                <item.icon className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="font-medium text-foreground">{item.name}</p>
                {item.future && <Badge variant="outline" className="mt-2">Coming Soon</Badge>}
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
