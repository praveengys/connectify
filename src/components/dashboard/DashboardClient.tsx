'use client';

import { useState, useEffect } from 'react';
import type { UserProfile } from '@/hooks/use-auth';
import PostCreator from './PostCreator';
import Feed from './Feed';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import Stories from './Stories';
import Header from '../Header';
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

  return (
    <div className="flex min-h-screen">
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
