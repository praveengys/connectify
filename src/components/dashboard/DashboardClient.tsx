
'use client';

import type { UserProfile } from '@/hooks/use-auth';
import PostCreator from './PostCreator';
import Feed from './Feed';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import { Card, CardContent } from '../ui/card';

type DashboardClientProps = {
  user: UserProfile;
};

export default function DashboardClient({ user }: DashboardClientProps) {
  return (
    <div className="container mx-auto py-8">
       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="hidden lg:block lg:col-span-3">
          <LeftSidebar />
        </aside>
        
        <div className="lg:col-span-6">
           <h2 className="text-2xl font-bold mb-4">Activity Feed</h2>
          <PostCreator user={user} />
          <div className="mt-8">
            <Feed />
          </div>
        </div>

        <aside className="hidden lg:block lg:col-span-3">
          <RightSidebar user={user} />
        </aside>
      </div>
    </div>
  );
}
