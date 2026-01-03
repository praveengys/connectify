
'use client';

import type { UserProfile } from '@/hooks/use-auth';
import RecentDiscussions from './RecentDiscussions';
import ProfileCompleteness from './ProfileCompleteness';
import ActiveGroups from './ActiveGroups';

export default function RightSidebar({ user }: { user: UserProfile }) {
  return (
    <aside className="hidden lg:flex lg:flex-col w-80 border-l p-6 bg-background space-y-6">
      <ProfileCompleteness user={user} />
      <RecentDiscussions />
      <ActiveGroups />
    </aside>
  )
}
