'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { UserProfile } from "@/hooks/use-auth";
import { CheckCircle2, Circle } from "lucide-react";
import { useMemo } from "react";
import { Button } from "../ui/button";

const getProfileCompleteness = (profile: UserProfile): { score: number, steps: { id: string, label: string, completed: boolean }[] } => {
    let score = 0;
    const steps = [
        { id: 'photo', label: 'Add a profile photo', weight: 25, completed: !!profile.avatarUrl },
        { id: 'bio', label: 'Write a short bio', weight: 20, completed: !!profile.bio },
        { id: 'details', label: 'Add your company & location', weight: 20, completed: !!profile.company && !!profile.location },
        { id: 'skills', label: 'List your skills', weight: 15, completed: !!(profile.skills && profile.skills.length > 0) },
        { id: 'interests', label: 'Add your interests', weight: 20, completed: !!(profile.interests && profile.interests.length > 0) },
    ];

    steps.forEach(step => {
        if (step.completed) {
            score += step.weight;
        }
    });

    return { score: Math.min(score, 100), steps };
};


export default function ProfileCompleteness({ user, onEditProfile }: { user: UserProfile, onEditProfile: () => void }) {
    const { score, steps } = useMemo(() => getProfileCompleteness(user), [user]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Welcome, {user.displayName.split(' ')[0]} 👋</CardTitle>
                <CardDescription>Complete your profile to get the most out of the community.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4 mb-4">
                    <Progress value={score} className="w-full h-2" />
                    <span className="text-sm font-semibold text-muted-foreground">{score}%</span>
                </div>
                <div className="space-y-3">
                    {steps.map(step => (
                        <div key={step.id} className="flex items-center gap-3">
                            {step.completed ? (
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                            ) : (
                                <Circle className="h-5 w-5 text-muted-foreground/50" />
                            )}
                            <span className={`text-sm ${step.completed ? 'text-foreground line-through' : 'text-muted-foreground'}`}>{step.label}</span>
                        </div>
                    ))}
                </div>
                 <Button variant="outline" size="sm" className="w-full mt-6" onClick={onEditProfile}>Edit Profile</Button>
            </CardContent>
        </Card>
    );
}
