
'use client';

import type { UserProfile } from '@/hooks/use-auth';
import Stories from './Stories';
import PostCreator from './PostCreator';
import { Card, CardContent } from '../ui/card';
import Feed from './Feed';

type DashboardClientProps = {
  user: UserProfile;
};

export default function DashboardClient({ user }: DashboardClientProps) {

  return (
    <div className="space-y-8">
       <Card>
        <CardContent className="p-6">
            <h2 className="text-2xl font-semibold">Welcome back, {user.displayName.split(' ')[0]}!</h2>
            <p className="text-muted-foreground">Here's what's happening in your community today.</p>
        </CardContent>
      </Card>
      
      <Stories />
      <PostCreator user={user} />
      <Feed user={user} />
    </div>
  );
}

    