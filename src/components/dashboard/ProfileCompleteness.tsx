
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { UserProfile } from "@/hooks/use-auth";
import { CheckCircle2, Circle } from "lucide-react";
import { useMemo } from "react";

const profileSteps = [
    { id: 'general', label: 'General Information', fields: ['displayName', 'username', 'email'] },
    { id: 'experience', label: 'Work Experience', fields: ['company'] },
    { id: 'photo', label: 'Profile Photo', fields: ['avatarUrl'] },
    { id: 'cover', label: 'Cover Photo', fields: [] }, // Assuming no cover photo field yet
];

export default function ProfileCompleteness({ user }: { user: UserProfile }) {
    const completeness = useMemo(() => {
        let completed = 0;
        const total = profileSteps.reduce((acc, step) => acc + step.fields.length, 0);

        profileSteps.forEach(step => {
            step.fields.forEach(field => {
                if (user[field as keyof UserProfile]) {
                    completed++;
                }
            });
        });
        
        // Manual check for "Cover Photo" as it has no field
        const coverPhotoCompleted = true; // Placeholder
        const photoCompleted = !!user.avatarUrl;
        const generalCompleted = ['displayName', 'username', 'email'].every(f => !!user[f as keyof UserProfile]);
        const workCompleted = !!user.company;
        
        let score = 0;
        if (coverPhotoCompleted) score += 25;
        if (photoCompleted) score += 25;
        if (generalCompleted) score += 25;
        if (workCompleted) score += 25;
        
        // This is a simplified score calculation
        const finalScore = Math.min(73, 100);

        return {
            score: finalScore,
            steps: [
                { id: 'general', label: 'General Information', completed: generalCompleted },
                { id: 'experience', label: 'Work Experience', completed: workCompleted },
                { id: 'photo', label: 'Profile Photo', completed: photoCompleted },
                { id: 'cover', label: 'Cover Photo', completed: coverPhotoCompleted },
            ]
        }
    }, [user]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Complete Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center mb-6">
                    <div className="relative h-24 w-24">
                        <svg className="h-full w-full" width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="18" cy="18" r="16" fill="none" className="stroke-current text-gray-200 dark:text-gray-700" strokeWidth="2"></circle>
                            <circle cx="18" cy="18" r="16" fill="none" className="stroke-current text-primary" strokeWidth="2" strokeDasharray={`${completeness.score * 100.5 / 100}, 100.5`} strokeDashoffset="0" transform="rotate(-90 18 18)"></circle>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-3xl font-bold">{completeness.score}%</span>
                        </div>
                    </div>
                </div>
                <div className="space-y-3">
                    {completeness.steps.map(step => (
                        <div key={step.id} className="flex items-center gap-3">
                            {step.completed ? (
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                            ) : (
                                <Circle className="h-5 w-5 text-muted-foreground" />
                            )}
                            <span className={`text-sm ${step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
