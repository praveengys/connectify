'use client';

import { useState, useEffect } from 'react';
import type { UserProfile } from '@/hooks/use-auth';
import PostCreator from './PostCreator';
import Feed from './Feed';
import RightSidebar from './RightSidebar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import ProfileForm from './ProfileForm';

type DashboardClientProps = {
  user: UserProfile;
};

export default function DashboardClient({ user }: DashboardClientProps) {
  const [isEditProfileOpen, setEditProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);

  useEffect(() => {
    const openDialog = () => setEditProfileOpen(true);
    window.addEventListener('open-edit-profile', openDialog);
    return () => {
      window.removeEventListener('open-edit-profile', openDialog);
    };
  }, []);

  const handleProfileUpdate = (updatedUser: UserProfile) => {
    setCurrentUser(updatedUser);
  };

  // Keep the state in sync if the root user prop changes (e.g. from auth provider)
  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  return (
    <div className="flex flex-1">
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
                <h2 className="text-2xl font-bold mb-4">Activity Feed</h2>
                <PostCreator user={currentUser} />
                <div className="mt-8">
                  <Feed />
                </div>
            </div>
        </main>
        <RightSidebar user={currentUser} onEditProfile={() => setEditProfileOpen(true)} />

        <Dialog open={isEditProfileOpen} onOpenChange={setEditProfileOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit Your Profile</DialogTitle>
                </DialogHeader>
                <ProfileForm user={currentUser} onUpdate={handleProfileUpdate} closeDialog={() => setEditProfileOpen(false)} />
            </DialogContent>
        </Dialog>
    </div>
  );
}
