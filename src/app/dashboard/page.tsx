'use client';
import DashboardClient from '@/components/dashboard/DashboardClient';
import type { UserProfile } from '@/hooks/use-auth';

// Mock user for temporary development
const mockUser: UserProfile = {
  uid: 'dev-user-123',
  username: 'dev_user',
  displayName: 'Dev User',
  bio: 'This is a mock user for development purposes. I love building great apps!',
  avatarUrl: 'https://picsum.photos/seed/dev-user/200/200',
  interests: ['React', 'Next.js', 'Firebase', 'Tailwind CSS'],
  skills: ['Frontend Development', 'UI/UX Design'],
  languages: ['English', 'TypeScript'],
  location: 'Cloud City',
  currentlyExploring: 'Server Components',
  role: 'admin',
  profileVisibility: 'public',
  emailVerified: true,
  profileScore: 85,
  postCount: 12,
  commentCount: 42,
  createdAt: new Date('2023-10-26T10:00:00Z'),
  updatedAt: new Date(),
  lastActiveAt: new Date(),
  email: 'dev@example.com',
};


export default function DashboardPage() {
  // The original useAuth hook is temporarily bypassed.
  // We pass the mock user directly to the client component.
  const user = mockUser;

  return <DashboardClient user={user} />;
}
