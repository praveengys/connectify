'use client';

import type { UserProfile } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, Mail } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type ProfileCardProps = {
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

    // A base score for just having an account
    score += 5; 

    return Math.min(score, 100);
  };

export default function ProfileCard({ user }: ProfileCardProps) {
  if (!user) return null;
  const completeness = getProfileCompleteness(user);

  return (
    <div className="p-2">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.avatarUrl ?? undefined} alt={user.displayName ?? 'User'} />
          <AvatarFallback>{user.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-lg font-semibold leading-none">{user.displayName}</p>
            <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'} className="capitalize">{user.role}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">@{user.username || 'username_not_set'}</p>
        </div>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">{user.bio || 'No bio yet.'}</p>
      
      <div className="mt-4 space-y-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
            <Mail size={14} />
            <span className="text-foreground">{user.email}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar size={14} />
            <span>Joined {user.createdAt ? formatDistanceToNow(user.createdAt, { addSuffix: true }) : 'N/A'}</span>
        </div>
      </div>
    </div>
  );
}
