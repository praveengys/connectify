'use client';

import type { UserProfile } from '@/hooks/use-auth';
import RecentDiscussions from './RecentDiscussions';
import ProfileCompleteness from './ProfileCompleteness';

export default function RightSidebar({ user }: { user: UserProfile }) {
  return (
    <div className="space-y-6">
      <ProfileCompleteness user={user} />
      <RecentDiscussions />
    </div>
  )
}
