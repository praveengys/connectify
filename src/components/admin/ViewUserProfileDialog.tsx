
'use client';

import type { UserProfile } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { Mail, Calendar, User, Briefcase, MapPin, Languages, Sparkles, PencilRuler } from 'lucide-react';

type ViewUserProfileDialogProps = {
  user: UserProfile;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | React.ReactNode }) => (
    <div className="flex items-start gap-3">
        <Icon className="h-4 w-4 text-muted-foreground mt-1" />
        <div className="flex-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-medium">{value || 'Not set'}</p>
        </div>
    </div>
);

export default function ViewUserProfileDialog({ user, isOpen, setIsOpen }: ViewUserProfileDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center items-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={user.avatarUrl ?? undefined} alt={user.displayName} />
            <AvatarFallback>{user.displayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <DialogTitle className="text-2xl">{user.displayName}</DialogTitle>
          <DialogDescription>@{user.username}</DialogDescription>
          <div className="flex gap-2 pt-2">
            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                {user.role}
            </Badge>
            {user.isMuted && <Badge variant="destructive">Muted</Badge>}
            <Badge variant="outline">{user.profileVisibility}</Badge>
          </div>
        </DialogHeader>

        <div className="mt-6 space-y-4 text-sm">
            {user.bio && <p className="text-center text-muted-foreground italic">&ldquo;{user.bio}&rdquo;</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <DetailItem icon={Mail} label="Email" value={user.email} />
                <DetailItem icon={Calendar} label="Joined" value={format(user.createdAt, 'PPP')} />
                <DetailItem icon={Briefcase} label="Company" value={user.company} />
                <DetailItem icon={MapPin} label="Location" value={user.location} />
                <DetailItem icon={Languages} label="Languages" value={user.languages?.join(', ')} />
                <DetailItem icon={Sparkles} label="Interests" value={user.interests?.join(', ')} />
                <DetailItem icon={PencilRuler} label="Skills" value={user.skills?.join(', ')} />
                <DetailItem icon={User} label="Exploring" value={user.currentlyExploring} />
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
