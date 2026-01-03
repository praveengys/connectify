'use client';

import { useEffect, useState, useTransition } from 'react';
import type { Group, UserProfile } from '@/lib/types';
import { getUserProfile } from '@/lib/firebase/firestore';
import { removeUserFromGroup, updateUserGroupRole } from '@/lib/firebase/client-actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, MoreVertical, ServerCrash, Trash2, UserCog, UserMinus, ShieldCheck } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const { user: adminUser } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: (() => void) | null;
  }>({ isOpen: false, title: '', description: '', onConfirm: null });

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
              role: group.memberRoles[profile.uid],
            });
          }
        });
        
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
  
  const handleAction = (title: string, description: string, onConfirm: () => void) => {
    setConfirmState({ isOpen: true, title, description, onConfirm });
  };

  const handleRemoveMember = (member: MemberWithProfile) => {
    handleAction(
      `Remove ${member.profile.displayName}?`,
      `Are you sure you want to remove this user from the group? They will lose access immediately.`,
      () => {
        startTransition(async () => {
          try {
            await removeUserFromGroup(group.id, member.profile.uid);
            toast({ title: "User removed" });
            setMembers(prev => prev.filter(m => m.profile.uid !== member.profile.uid));
          } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
          }
        });
      }
    );
  };
  
  const handleRoleChange = (member: MemberWithProfile, newRole: 'admin' | 'member') => {
      handleAction(
        `Change role for ${member.profile.displayName}?`,
        `Set role to ${newRole}?`,
        () => {
            startTransition(async () => {
                try {
                    await updateUserGroupRole(group.id, member.profile.uid, newRole);
                    toast({ title: "Role updated" });
                    setMembers(prev => prev.map(m => m.profile.uid === member.profile.uid ? { ...m, role: newRole } : m));
                } catch (e: any) {
                    toast({ title: "Error", description: e.message, variant: "destructive" });
                }
            });
        }
    );
  }

  return (
    <>
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
                    {members.map((member) => (
                        <div key={member.profile.uid} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={member.profile.avatarUrl ?? undefined} />
                                    <AvatarFallback>{member.profile.displayName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{member.profile.displayName}</p>
                                    <p className="text-xs text-muted-foreground">@{member.profile.username}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={member.role === 'owner' ? 'default' : 'secondary'} className="capitalize">{member.role}</Badge>
                                {adminUser?.uid !== member.profile.uid && member.role !== 'owner' && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            {member.role === 'member' ? (
                                                <DropdownMenuItem onSelect={() => handleRoleChange(member, 'admin')}>
                                                    <ShieldCheck className="mr-2 h-4 w-4" /> Make Admin
                                                </DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem onSelect={() => handleRoleChange(member, 'member')}>
                                                    <UserCog className="mr-2 h-4 w-4" /> Make Member
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem className="text-destructive" onSelect={() => handleRemoveMember(member)}>
                                                <UserMinus className="mr-2 h-4 w-4" /> Remove from Group
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
    <AlertDialog open={confirmState.isOpen} onOpenChange={(open) => setConfirmState(prev => ({...prev, isOpen: open}))}>
      <AlertDialogContent>
          <AlertDialogHeader>
          <AlertDialogTitle>{confirmState.title}</AlertDialogTitle>
          <AlertDialogDescription>{confirmState.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => {
              if (confirmState.onConfirm) confirmState.onConfirm();
              setConfirmState({ isOpen: false, title: '', description: '', onConfirm: null });
          }} className="bg-destructive hover:bg-destructive/90">
              Confirm
          </AlertDialogAction>
          </AlertDialogFooter>
      </AlertDialogContent>
     </AlertDialog>
    </>
  );
}
