
'use client';

import BlogFeed from './BlogFeed';
import Following from './Following';

export default function LeftSidebar() {
  return (
    <div className="space-y-6">
      <BlogFeed />
      <Following />
    </div>
  );
}
