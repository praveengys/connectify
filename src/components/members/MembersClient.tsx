
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { UserProfile } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Search, Users } from 'lucide-react';
import { Badge } from '../ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '../ui/input';

const dummyMembers: UserProfile[] = [
    {
      uid: '1',
      displayName: 'Alex Johnson',
      username: 'alexj',
      email: 'alex.j@example.com',
      bio: 'Full-stack developer with a passion for open-source and Next.js.',
      avatarUrl: 'https://picsum.photos/seed/101/200',
      interests: ['React', 'Node.js', 'GraphQL'],
      skills: ['TypeScript', 'Firebase', 'Docker'],
      languages: ['English', 'Spanish'],
      location: 'San Francisco, CA',
      currentlyExploring: 'WebAssembly',
      role: 'member',
      profileVisibility: 'public',
      emailVerified: true,
      createdAt: new Date('2023-01-15T09:30:00Z'),
      updatedAt: new Date(),
      lastActiveAt: new Date(),
      profileScore: 85, postCount: 12, commentCount: 45
    },
    {
      uid: '2',
      displayName: 'Samantha Lee',
      username: 'samlee',
      email: 'samantha.lee@example.com',
      bio: 'UI/UX designer focused on creating intuitive and beautiful user experiences.',
      avatarUrl: 'https://picsum.photos/seed/102/200',
      interests: ['Design Systems', 'Figma', 'Accessibility'],
      skills: ['UI Design', 'Prototyping', 'User Research'],
      languages: ['English', 'Mandarin'],
      location: 'New York, NY',
      currentlyExploring: 'AI in Design',
      role: 'admin',
      profileVisibility: 'public',
      emailVerified: true,
      createdAt: new Date('2023-02-20T14:00:00Z'),
      updatedAt: new Date(),
      lastActiveAt: new Date(),
      profileScore: 92, postCount: 5, commentCount: 22
    },
    {
      uid: '3',
      displayName: 'Michael Chen',
      username: 'mikec',
      email: 'michael.chen@example.com',
      bio: 'Data scientist and machine learning enthusiast.',
      avatarUrl: 'https://picsum.photos/seed/103/200',
      interests: ['Python', 'TensorFlow', 'NLP'],
      skills: ['Data Analysis', 'ML Models', 'Statistics'],
      languages: ['English'],
      location: 'Chicago, IL',
      currentlyExploring: 'Large Language Models',
      role: 'member',
      profileVisibility: 'public',
      emailVerified: true,
      createdAt: new Date('2023-03-10T11:45:00Z'),
      updatedAt: new Date(),
      lastActiveAt: new Date(),
      profileScore: 78, postCount: 8, commentCount: 19
    },
    {
        uid: '4',
        displayName: 'Jessica Williams',
        username: 'jessw',
        email: 'jess.williams@example.com',
        bio: 'Product Manager driving innovation in tech. Love hiking on weekends.',
        avatarUrl: 'https://picsum.photos/seed/104/200',
        interests: ['Agile', 'Product Strategy', 'User Stories'],
        skills: ['Roadmapping', 'JIRA', 'Market Research'],
        languages: ['English', 'French'],
        location: 'Seattle, WA',
        currentlyExploring: 'Sustainable Tech',
        role: 'member',
        profileVisibility: 'public',
        emailVerified: true,
        createdAt: new Date('2023-04-05T18:20:00Z'),
        updatedAt: new Date(),
        lastActiveAt: new Date(),
        profileScore: 88, postCount: 3, commentCount: 31
    },
     {
      uid: '5',
      displayName: 'Chris Rodriguez',
      username: 'chrisr',
      email: 'chris.rod@example.com',
      bio: 'DevOps engineer ensuring everything runs smoothly. Cloud native advocate.',
      avatarUrl: 'https://picsum.photos/seed/105/200',
      interests: ['Kubernetes', 'CI/CD', 'AWS'],
      skills: ['Terraform', 'Ansible', 'Prometheus'],
      languages: ['English'],
      location: 'Austin, TX',
      currentlyExploring: 'eBPF',
      role: 'member',
      profileVisibility: 'public',
      emailVerified: true,
      createdAt: new Date('2023-05-12T21:00:00Z'),
      updatedAt: new Date(),
      lastActiveAt: new Date(),
      profileScore: 82, postCount: 7, commentCount: 28
    },
    {
        uid: '6',
        displayName: 'Emily Davis',
        username: 'emilyd',
        email: 'emily.d@example.com',
        bio: 'Frontend developer who loves building beautiful and performant UIs.',
        avatarUrl: 'https://picsum.photos/seed/106/200',
        interests: ['Vue.js', 'Svelte', 'Web Performance'],
        skills: ['CSS Grid', 'Animation', 'State Management'],
        languages: ['English', 'German'],
        location: 'Berlin, Germany',
        currentlyExploring: 'Solid.js',
        role: 'member',
        profileVisibility: 'public',
        emailVerified: true,
        createdAt: new Date('2023-06-18T10:00:00Z'),
        updatedAt: new Date(),
        lastActiveAt: new Date(),
        profileScore: 90, postCount: 15, commentCount: 50
    }
  ];

export default function MembersClient() {
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // We are now using dummy data, so we don't need to fetch from Firestore.
    setMembers(dummyMembers);
    setLoading(false);
  }, []);

  const filteredMembers = useMemo(() => {
    if (!searchQuery) {
      return members;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return members.filter(member => 
      member.displayName.toLowerCase().includes(lowercasedQuery) ||
      (member.email && member.email.toLowerCase().includes(lowercasedQuery))
    );
  }, [members, searchQuery]);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
      <section className="w-full py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Community Members
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-muted-foreground md:text-xl">
              Browse profiles, discover skills, and connect with peers.
            </p>
          </div>

          {(loading || authLoading) && (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          )}
          
          {!user && !authLoading && (
             <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                  <h3 className="mt-4 text-lg font-semibold">Please Log In</h3>
                  <p className="mt-1 text-sm">You must be logged in to view community members.</p>
              </div>
          )}

          {!loading && user && (
            <>
              <div className="mb-8 max-w-lg mx-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    type="search"
                    placeholder="Search by name or email..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {filteredMembers.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredMembers.map(member => (
                    <Card key={member.uid} className="card-hover">
                      <CardContent className="p-6 flex flex-col items-center text-center">
                        <Avatar className="h-24 w-24 mb-4">
                          <AvatarImage src={member.avatarUrl ?? undefined} alt={member.displayName ?? 'user'} />
                          <AvatarFallback>{member.displayName ? member.displayName.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                        </Avatar>
                        <h3 className="font-semibold text-lg">{member.displayName}</h3>
                        <p className="text-sm text-muted-foreground">@{member.username || 'new_member'}</p>
                        <p className="text-sm mt-2 text-muted-foreground line-clamp-2 h-10">
                          {member.bio || 'No bio available.'}
                        </p>
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                          {member.interests?.slice(0, 3).map(interest => (
                            <Badge key={interest} variant="secondary">{interest}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                    <Users className="mx-auto h-12 w-12" />
                    <h3 className="mt-4 text-lg font-semibold">No Members Found</h3>
                    <p className="mt-1 text-sm">Your search for "{searchQuery}" did not match any members.</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
      </main>
      <footer className="w-full py-6">
        <div className="container mx-auto px-4 md:px-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Connectify Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
