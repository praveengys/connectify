
'use client';

import { useEffect, useState } from 'react';
import type { Group, UserProfile } from '@/lib/types';
import { getUserProfile } from '@/lib/firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, ServerCrash } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

type ViewGroupMembersDialogProps = {
  group: Group;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

type MemberWithProfile = {
    profile: UserProfile;
    role: 'owner' | 'admin' | 'member';
}

export default function ViewGroupMembersDialog({ group, isOpen, setIsOpen }: ViewGroupMembersDialogProps) {
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchMembers = async () => {
      setLoading(true);
      setError(null);
      try {
        const memberIds = Object.keys(group.members);
        const memberPromises = memberIds.map(id => getUserProfile(id));
        const memberProfiles = await Promise.all(memberPromises);

        const memberList: MemberWithProfile[] = [];
        memberProfiles.forEach(profile => {
          if (profile) {
            memberList.push({
              profile,
              role: group.members[profile.uid],
            });
          }
        });
        
        // Sort members: owner > admin > member
        memberList.sort((a, b) => {
            const roleOrder = { owner: 0, admin: 1, member: 2 };
            return roleOrder[a.role] - roleOrder[b.role];
        });

        setMembers(memberList);
      } catch (err) {
        console.error("Failed to fetch member profiles:", err);
        setError("Could not load member details.");
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [group, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Members of "{group.name}"</DialogTitle>
          <DialogDescription>
            {group.memberCount} member(s) in this group.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
            {loading ? (
                 <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center text-destructive p-4">
                    <ServerCrash className="h-8 w-8 mb-2" />
                    <p className="text-sm text-center">{error}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {members.map(({ profile, role }) => (
                        <div key={profile.uid} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={profile.avatarUrl ?? undefined} />
                                    <AvatarFallback>{profile.displayName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{profile.displayName}</p>
                                    <p className="text-xs text-muted-foreground">@{profile.username}</p>
                                </div>
                            </div>
                            <Badge variant={role === 'owner' ? 'default' : 'secondary'} className="capitalize">{role}</Badge>
                        </div>
                    ))}
                </div>
            )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
