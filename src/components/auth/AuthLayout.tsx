
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from "./LoginForm";
import SignUpForm from "./SignUpForm";
import { useRouter } from "next/navigation";

type AuthLayoutProps = {
    defaultTab: 'login' | 'signup';
}

export default function AuthLayout({ defaultTab }: AuthLayoutProps) {
    const router = useRouter();

    const handleTabChange = (value: string) => {
        if (value === 'login') {
            router.push('/login');
        } else {
            router.push('/signup');
        }
    }

    return (
        <Tabs defaultValue={defaultTab} className="w-full max-w-md" onValueChange={handleTabChange}>
            <div className="flex justify-center">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
            </div>
            <TabsContent value="login">
                <Card>
                    <CardHeader>
                        <CardTitle>Welcome Back!</CardTitle>
                        <CardDescription>Enter your credentials to access your account.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <LoginForm />
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="signup">
                <Card>
                    <CardHeader>
                        <CardTitle>Create an Account</CardTitle>
                        <CardDescription>Join the community by filling out the form below.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SignUpForm />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}
