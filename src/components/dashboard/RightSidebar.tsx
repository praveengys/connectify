'use client';

import type { UserProfile } from '@/hooks/use-auth';
import RecentDiscussions from './RecentDiscussions';
import ProfileCompleteness from './ProfileCompleteness';
import ActiveGroups from './ActiveGroups';

type RightSidebarProps = {
  user: UserProfile;
  onEditProfile: () => void;
};

export default function RightSidebar({ user, onEditProfile }: RightSidebarProps) {
  return (
    <aside className="hidden lg:flex lg:flex-col w-80 border-l p-6 bg-secondary/30 space-y-6">
      <ProfileCompleteness user={user} onEditProfile={onEditProfile} />
      <RecentDiscussions />
      <ActiveGroups />
    </aside>
  )
}
