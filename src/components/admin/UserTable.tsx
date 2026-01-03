
'use client';

import { useEffect, useState, useMemo, useTransition } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { UserProfile } from '@/lib/types';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Search, MoreHorizontal, Loader2, ServerCrash, MicOff, UserCheck, UserX, ShieldCheck, ShieldOff, Edit, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { toggleBanUser, toggleMuteUser, updateUserProfile, updateUserRole } from '@/lib/firebase/client-actions';
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
import ViewUserProfileDialog from './ViewUserProfileDialog';
import { useAuth } from '@/hooks/use-auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import ProfileForm from '../dashboard/ProfileForm';

export default function UserTable() {
  const { user: adminUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isViewProfileOpen, setViewProfileOpen] = useState(false);
  const [isEditProfileOpen, setEditProfileOpen] = useState(false);
  const [actionUser, setActionUser] = useState<UserProfile | null>(null);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmDescription, setConfirmDescription] = useState('');


  useEffect(() => {
    const { firestore } = initializeFirebase();
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({
          ...doc.data(),
          uid: doc.id,
          createdAt: doc.data().createdAt?.toDate() ?? new Date(),
        } as UserProfile));
        setUsers(usersData);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching users:", err);
        setError("Failed to load user data. Check security rules and Firestore connection.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleAction = (user: UserProfile, action: 'mute' | 'unmute' | 'makeAdmin' | 'removeAdmin' | 'makeModerator' | 'removeModerator' | 'ban' | 'unban') => {
    setActionUser(user);
    let title = '';
    let description = '';
    let actionFn: () => void = () => {};

    switch(action) {
        case 'mute':
            title = `Mute ${user.displayName}?`;
            description = "Muted users cannot post messages or create content. They will not be notified.";
            actionFn = () => performAction(user.uid, toggleMuteUser(user.uid, true), 'User muted successfully');
            break;
        case 'unmute':
            title = `Unmute ${user.displayName}?`;
            description = "This user will be able to post content again.";
            actionFn = () => performAction(user.uid, toggleMuteUser(user.uid, false), 'User unmuted successfully');
            break;
        case 'makeAdmin':
            title = `Make ${user.displayName} an admin?`;
            description = "This will grant them full administrative privileges.";
            actionFn = () => performAction(user.uid, updateUserRole(user.uid, 'admin'), 'User role updated to admin');
            break;
        case 'removeAdmin':
            title = `Remove admin rights from ${user.displayName}?`;
            description = "This will revoke their administrative privileges.";
            actionFn = () => performAction(user.uid, updateUserRole(user.uid, 'member'), 'User role updated to member');
            break;
        case 'makeModerator':
            title = `Make ${user.displayName} a moderator?`;
            description = "This will grant them content moderation privileges.";
            actionFn = () => performAction(user.uid, updateUserRole(user.uid, 'moderator'), 'User role updated to moderator');
            break;
        case 'removeModerator':
            title = `Remove moderator rights from ${user.displayName}?`;
            description = "This will revoke their moderation privileges.";
            actionFn = () => performAction(user.uid, updateUserRole(user.uid, 'member'), 'User role updated to member');
            break;
        case 'ban':
            title = `Ban ${user.displayName}?`;
            description = "This user will be BANNED and will not be able to log in or create content. This action is reversible.";
            actionFn = () => performAction(user.uid, toggleBanUser(user.uid, true), 'User banned successfully');
            break;
        case 'unban':
            title = `Unban ${user.displayName}?`;
            description = "This will lift the ban, allowing the user to log in and participate again.";
            actionFn = () => performAction(user.uid, toggleBanUser(user.uid, false), 'User unbanned successfully');
            break;
    }
    
    setConfirmTitle(title);
    setConfirmDescription(description);
    setConfirmAction(() => actionFn); // Store the function itself
    setConfirmOpen(true);
  };

  const performAction = async (uid: string, actionPromise: Promise<any>, successMessage: string) => {
      startTransition(async () => {
          try {
              await actionPromise;
              toast({ title: 'Success', description: successMessage });
          } catch (error: any) {
              toast({ title: 'Error', description: error.message, variant: 'destructive' });
          }
      });
  };

  const handleProfileUpdate = (updatedUser: UserProfile) => {
    setUsers(prevUsers => prevUsers.map(u => u.uid === updatedUser.uid ? updatedUser : u));
    setEditProfileOpen(false);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

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
          <CardTitle>All Users</CardTitle>
           <CardDescription>
            Manage all registered users in the community.
          </CardDescription>
          <div className="mt-4 flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or username"
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
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(user => (
                <TableRow key={user.uid} className={isPending && actionUser?.uid === user.uid ? 'opacity-50' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatarUrl ?? undefined} />
                        <AvatarFallback>{user.displayName?.charAt(0) ?? '?'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.displayName}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : user.role === 'moderator' ? 'secondary' : 'outline'} className="capitalize">
                      {user.role}
                    </Badge>
                  </TableCell>
                   <TableCell>
                    <div className="flex flex-col gap-1">
                        {user.isMuted && <Badge variant="destructive" className="capitalize w-fit"><MicOff className="mr-1 h-3 w-3"/> Muted</Badge>}
                        {user.isBanned && <Badge variant="destructive" className="capitalize w-fit"><ShieldAlert className="mr-1 h-3 w-3"/> Banned</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.createdAt ? format(user.createdAt, 'PP') : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={user.uid === adminUser?.uid}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onSelect={() => { setSelectedUser(user); setViewProfileOpen(true); }}>
                            <UserCheck className="mr-2 h-4 w-4" /> View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => { setSelectedUser(user); setEditProfileOpen(true); }}>
                            <Edit className="mr-2 h-4 w-4" /> Edit Profile
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.role === 'admin' ? (
                           <DropdownMenuItem onSelect={() => handleAction(user, 'removeAdmin')}>
                                <ShieldOff className="mr-2 h-4 w-4" /> Remove Admin
                            </DropdownMenuItem>
                        ) : (
                           <DropdownMenuItem onSelect={() => handleAction(user, 'makeAdmin')}>
                                <ShieldCheck className="mr-2 h-4 w-4" /> Make Admin
                            </DropdownMenuItem>
                        )}
                         {user.role === 'moderator' ? (
                           <DropdownMenuItem onSelect={() => handleAction(user, 'removeModerator')}>
                                <ShieldOff className="mr-2 h-4 w-4" /> Remove Moderator
                            </DropdownMenuItem>
                        ) : (
                           <DropdownMenuItem onSelect={() => handleAction(user, 'makeModerator')}>
                                <ShieldCheck className="mr-2 h-4 w-4" /> Make Moderator
                            </DropdownMenuItem>
                        )}
                        {user.isMuted ? (
                            <DropdownMenuItem onSelect={() => handleAction(user, 'unmute')}>
                                <MicOff className="mr-2 h-4 w-4" /> Unmute User
                            </DropdownMenuItem>
                        ) : (
                           <DropdownMenuItem onSelect={() => handleAction(user, 'mute')}>
                                <MicOff className="mr-2 h-4 w-4" /> Mute User
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {user.isBanned ? (
                           <DropdownMenuItem className="text-green-600" onSelect={() => handleAction(user, 'unban')}>
                                <UserCheck className="mr-2 h-4 w-4" /> Unban User
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem className="text-destructive" onSelect={() => handleAction(user, 'ban')}>
                                <UserX className="mr-2 h-4 w-4" /> Ban User
                            </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* View Profile Dialog */}
      {selectedUser && (
        <ViewUserProfileDialog 
            user={selectedUser} 
            isOpen={isViewProfileOpen} 
            setIsOpen={setViewProfileOpen}
        />
      )}

      {/* Edit Profile Dialog */}
      {selectedUser && (
        <Dialog open={isEditProfileOpen} onOpenChange={setEditProfileOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Profile for {selectedUser.displayName}</DialogTitle>
                </DialogHeader>
                <ProfileForm user={selectedUser} onUpdate={handleProfileUpdate} closeDialog={() => setEditProfileOpen(false)} />
            </DialogContent>
        </Dialog>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
                {confirmDescription}
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
                if (confirmAction) {
                    confirmAction();
                }
                setConfirmOpen(false);
            }}>
                Confirm
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
       </AlertDialog>
    </>
  );
}
