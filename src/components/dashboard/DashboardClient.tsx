
'use client';

import type { UserProfile } from '@/hooks/use-auth';
import PostCreator from './PostCreator';
import Feed from './Feed';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import Stories from './Stories';
import Header from '../Header';

type DashboardClientProps = {
  user: UserProfile;
};

export default function DashboardClient({ user }: DashboardClientProps) {
  return (
    <div className="flex min-h-screen">
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
                <h2 className="text-2xl font-bold mb-4">Activity Feed</h2>
                <PostCreator user={user} />
                <div className="mt-8">
                  <Feed />
                </div>
            </div>
        </main>
        <RightSidebar user={user} />
    </div>
  );
}

    