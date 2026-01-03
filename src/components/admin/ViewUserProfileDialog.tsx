

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
import { Mail, Calendar, User, Briefcase, MapPin, Languages, Sparkles, PencilRuler, Phone, Star, Key, Clock, AlertTriangle, Hash, Shield } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';

type ViewUserProfileDialogProps = {
  user: UserProfile;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | React.ReactNode | number | null | undefined }) => {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3">
            <Icon className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
            <div className="flex-1">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium break-words">{value}</p>
            </div>
        </div>
    );
};

export default function ViewUserProfileDialog({ user, isOpen, setIsOpen }: ViewUserProfileDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-1">
            <DialogHeader className="text-center items-center p-6">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={user.avatarUrl ?? undefined} alt={user.displayName} />
                <AvatarFallback>{user.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <DialogTitle className="text-2xl">{user.displayName}</DialogTitle>
              {user.username && <DialogDescription>@{user.username}</DialogDescription>}
              <div className="flex gap-2 pt-2 flex-wrap justify-center">
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                    {user.role}
                </Badge>
                {user.isMuted && <Badge variant="destructive">Muted</Badge>}
                 {user.isBanned && <Badge variant="destructive">Banned</Badge>}
                <Badge variant="outline">{user.profileVisibility}</Badge>
              </div>
            </DialogHeader>

            <div className="mt-6 space-y-6 px-6 pb-6">
                
                <Separator />
                <h4 className="font-semibold text-lg">General Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailItem icon={Mail} label="Email" value={user.email} />
                    {user.createdAt && (
                        <DetailItem 
                            icon={Calendar} 
                            label="Joined" 
                            value={typeof user.createdAt === 'string' ? user.createdAt : format(new Date(user.createdAt), 'PPP')} 
                        />
                    )}
                </div>
                
                <Separator />
                <h4 className="font-semibold text-lg">Imported Member Data</h4>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailItem icon={Hash} label="Member ID" value={user.memberId} />
                    <DetailItem icon={User} label="Title" value={user.memberTitle} />
                    <DetailItem icon={User} label="First Name" value={user.memberFirstName} />
                    <DetailItem icon={User} label="Last Name" value={user.memberLastName} />
                    <DetailItem icon={Mail} label="Member Email" value={user.memberEmailAddress} />
                    <DetailItem icon={Phone} label="Mobile Number" value={user.memberMobileNumber} />
                    <DetailItem icon={Star} label="Experience" value={user.memberExperience} />
                    <DetailItem icon={Shield} label="Member Type" value={user.memberType} />
                    <DetailItem icon={Key} label="OTP" value={user.memberOTP} />
                    <DetailItem icon={Badge} label="Member Status" value={user.memberStatus} />
                    <DetailItem icon={AlertTriangle} label="First Reminder" value={user.firstReminder} />
                    <DetailItem icon={AlertTriangle} label="Final Reminder" value={user.finalReminder} />
                    <DetailItem icon={Clock} label="Created At (Import)" value={user.createdAt} />
                    <DetailItem icon={Clock} label="Modified At (Import)" value={user.modified_at} />
                </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
