
'use client';

import { useEffect, useState, useMemo, useTransition } from 'react';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { Group } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Search, MoreHorizontal, Loader2, ServerCrash, Users, Trash2, MicOff, Volume2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { deleteGroup, toggleGroupMute } from '@/lib/firebase/firestore';
import ViewGroupMembersDialog from './ViewGroupMembersDialog';


export default function GroupTable() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isMembersDialogOpen, setMembersDialogOpen] = useState(false);
  const [actionGroup, setActionGroup] = useState<Group | null>(null);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmDescription, setConfirmDescription] = useState('');
  const [confirmButtonText, setConfirmButtonText] = useState('Confirm');

  useEffect(() => {
    const { firestore } = initializeFirebase();
    const groupsRef = collection(firestore, 'groups');
    const q = query(groupsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const groupsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() ?? new Date(),
        } as Group));
        setGroups(groupsData);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching groups:", err);
        setError("Failed to load group data. Check security rules and Firestore connection.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);
  
  const handleAction = (group: Group, action: 'delete' | 'mute' | 'unmute') => {
      setActionGroup(group);
      let title = '', description = '', actionFn: (() => void) | null = null, buttonText = 'Confirm';

      switch(action) {
          case 'delete':
              title = `Delete Group: "${group.name}"?`;
              description = "This action is permanent and cannot be undone. All messages within this group will also be deleted.";
              actionFn = () => performDelete(group.id);
              buttonText = 'Confirm Delete';
              break;
          case 'mute':
              title = `Mute Group: "${group.name}"?`;
              description = "This will prevent all members from sending new messages until the group is unmuted. Members will not be notified.";
              actionFn = () => performToggleMute(group.id, true);
              buttonText = 'Mute Group';
              break;
          case 'unmute':
              title = `Unmute Group: "${group.name}"?`;
              description = "Members will be able to send messages in this group again.";
              actionFn = () => performToggleMute(group.id, false);
              buttonText = 'Unmute Group';
              break;
      }

      setConfirmTitle(title);
      setConfirmDescription(description);
      setConfirmAction(() => actionFn);
      setConfirmButtonText(buttonText);
      setConfirmOpen(true);
  }

  const performDelete = async (groupId: string) => {
    startTransition(async () => {
        try {
            await deleteGroup(groupId);
            toast({ title: 'Success', description: 'Group deleted successfully.' });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });
  };
  
  const performToggleMute = async (groupId: string, muted: boolean) => {
      startTransition(async () => {
          try {
              await toggleGroupMute(groupId, muted);
              toast({ title: 'Success', description: `Group has been ${muted ? 'muted' : 'unmuted'}.`});
          } catch(e: any) {
              toast({ title: 'Error', description: e.message, variant: 'destructive'});
          }
      });
  };

  const handleViewMembers = (group: Group) => {
    setSelectedGroup(group);
    setMembersDialogOpen(true);
  };

  const filteredGroups = useMemo(() => {
    return groups.filter(group =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [groups, searchTerm]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-destructive bg-destructive/10 p-8 rounded-lg">
        <ServerCrash className="h-12 w-12 mb-4" />
        <p className="text-lg font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Groups</CardTitle>
          <CardDescription>Manage all chat groups in the community.</CardDescription>
          <div className="mt-4 flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by group name"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.map(group => (
                <TableRow key={group.id} className={isPending && actionGroup?.id === group.id ? 'opacity-50' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Users className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <p className="font-medium">{group.name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={group.type === 'public' ? 'secondary' : 'default'} className="capitalize">
                      {group.type}
                    </Badge>
                  </TableCell>
                   <TableCell>
                    {group.muted && <Badge variant="destructive">Muted</Badge>}
                  </TableCell>
                  <TableCell>{group.memberCount}</TableCell>
                  <TableCell>{format(new Date(group.createdAt), 'PP')}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onSelect={() => handleViewMembers(group)}>View Members</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {group.muted ? (
                           <DropdownMenuItem onSelect={() => handleAction(group, 'unmute')}>
                             <Volume2 className="mr-2 h-4 w-4" /> Unmute Group
                           </DropdownMenuItem>
                        ) : (
                           <DropdownMenuItem onSelect={() => handleAction(group, 'mute')}>
                             <MicOff className="mr-2 h-4 w-4" /> Mute Group
                           </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onSelect={() => handleAction(group, 'delete')}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Group
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredGroups.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No groups found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {selectedGroup && (
        <ViewGroupMembersDialog 
          group={selectedGroup} 
          isOpen={isMembersDialogOpen} 
          setIsOpen={setMembersDialogOpen} 
        />
      )}

      <AlertDialog open={isConfirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
                if (confirmAction) confirmAction();
                setConfirmOpen(false);
            }} className="bg-destructive hover:bg-destructive/90">
                {confirmButtonText}
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
       </AlertDialog>
    </>
  );
}
