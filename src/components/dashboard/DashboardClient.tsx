
'use client';

import { useState } from 'react';
import type { UserProfile } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit, Globe, Languages, Lightbulb, MapPin, Briefcase } from 'lucide-react';
import ProfileForm from './ProfileForm';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/lib/firebase/firestore';
import { Progress } from '../ui/progress';

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
  
  const handleVisibilityChange = async (newVisibility: 'public' | 'private') => {
    if (user.profileVisibility === newVisibility) return;

    try {
      await updateUserProfile(user.uid, { profileVisibility: newVisibility });
      const updatedUser = { ...user, profileVisibility: newVisibility };
      setUser(updatedUser);
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

    // A base score for just having an account
    score += 5; 

    return Math.min(score, 100);
  };
  
  const completeness = getProfileCompleteness(user);

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <Card className="overflow-hidden">
        <CardHeader className="bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Dashboard</CardTitle>
              <CardDescription>Welcome back, {user.displayName}. Here's what's new.</CardDescription>
            </div>
             <div className="flex shrink-0 items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  {user.profileVisibility === 'public' ? <Eye size={16} /> : <EyeOff size={16} />}
                  <span className="capitalize">{user.profileVisibility}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>Profile Visibility</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={user.profileVisibility} onValueChange={(value) => handleVisibilityChange(value as 'public' | 'private')}>
                  <DropdownMenuRadioItem value="public">
                    <div className="flex items-center justify-between w-full">
                        <span>Public</span>
                        <Eye className="mr-2 h-4 w-4" />
                    </div>
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="private">
                    <div className="flex items-center justify-between w-full">
                        <span>Private</span>
                        <EyeOff className="mr-2 h-4 w-4" />
                    </div>
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Edit size={16} /> Edit Profile
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
          </div>
        </CardHeader>
        
        {completeness < 100 && (
          <div className="border-t border-b bg-secondary/30 px-6 py-3">
              <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Profile Completeness</p>
                  <p className="text-sm font-bold text-primary">{completeness}%</p>
              </div>
              <Progress value={completeness} className="mt-2 h-2" />
              {completeness < 40 && <p className="text-xs text-muted-foreground mt-2">Your profile is just getting started. Complete it to unlock all community features!</p>}
          </div>
        )}

        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="md:col-span-3 space-y-6">
             <h3 className="text-lg font-semibold">Your Information</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoSection icon={Briefcase} title="Skills">
                  {user.skills?.length > 0 ? user.skills.map(skill => <Badge key={skill} variant="outline">{skill}</Badge>) : <p className="text-sm text-muted-foreground">No skills listed.</p>}
                </InfoSection>
                <InfoSection icon={Lightbulb} title="Interests">
                  {user.interests?.length > 0 ? user.interests.map(interest => <Badge key={interest} variant="outline">{interest}</Badge>) : <p className="text-sm text-muted-foreground">No interests listed.</p>}
                </InfoSection>
                 <InfoSection icon={Globe} title="Currently Exploring">
                  <p className="text-sm">{user.currentlyExploring || 'Not specified'}</p>
                </InfoSection>
                 <InfoSection icon={MapPin} title="Location">
                  <p className="text-sm">{user.location || 'Not specified'}</p>
                </InfoSection>
                <InfoSection icon={Languages} title="Languages">
                  {user.languages?.length > 0 ? user.languages.map(lang => <Badge key={lang} variant="secondary">{lang}</Badge>) : <p className="text-sm text-muted-foreground">No languages listed.</p>}
                </InfoSection>
             </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}

const InfoSection = ({ icon: Icon, title, children }: { icon: React.ElementType, title: string, children: React.ReactNode }) => (
  <div>
    <h3 className="text-md font-semibold flex items-center gap-2 mb-3 text-muted-foreground">
      <Icon size={18} />
      <span>{title}</span>
    </h3>
    <div className="flex flex-wrap gap-2">
      {children}
    </div>
  </div>
);
