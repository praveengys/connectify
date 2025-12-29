'use client';

import { Group, UserProfile } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Users, Video, Info } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { useEffect, useState } from "react";
import { getUserProfile } from "@/lib/firebase/firestore";

type GroupInfoPanelProps = {
  group: Group;
}

export default function GroupInfoPanel({ group }: GroupInfoPanelProps) {
  const [members, setMembers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const fetchMembers = async () => {
      const memberIds = Object.keys(group.members);
      const memberPromises = memberIds.map(id => getUserProfile(id));
      const memberProfiles = (await Promise.all(memberPromises)).filter(p => p !== null) as UserProfile[];
      setMembers(memberProfiles);
    }
    fetchMembers();
  }, [group.members]);

  return (
    <div className="flex flex-col h-full bg-secondary/30">
      <div className="p-6 text-center border-b">
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Users className="w-12 h-12 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold">{group.name}</h2>
        <p className="text-sm text-muted-foreground">{group.type === 'public' ? 'Public' : 'Private'} Group</p>
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" size="sm"><Users className="mr-2" /> Members</Button>
          <Button variant="outline" size="sm"><Video className="mr-2" /> Call</Button>
        </div>
      </div>
      
      <ScrollArea className="flex-grow">
          <div className="p-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><Info size={16} /> About</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This group was created to discuss topics related to {group.name}.
                    </p>
                </CardContent>
            </Card>

            <Card className="mt-4">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><Users size={16} /> Members ({group.memberCount})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {members.map(member => (
                        <div key={member.uid} className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={member.avatarUrl ?? undefined} />
                                <AvatarFallback>{member.displayName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{member.displayName}</p>
                                <p className="text-xs text-muted-foreground">@{member.username}</p>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
