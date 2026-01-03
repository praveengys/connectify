
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud, CheckCircle, AlertTriangle } from 'lucide-react';
import { importUsers } from '@/lib/firebase/client-actions';
import Link from 'next/link';

const formSchema = z.object({
  jsonFile: z
    .custom<FileList>()
    .refine((files) => files?.length === 1, 'A JSON file is required.')
    .refine((files) => files?.[0]?.type === 'application/json', 'File must be a JSON.'),
});

type ImportResult = {
  successCount: number;
  errorCount: number;
  errors: string[];
};

export default function UserImporter() {
  const { toast } = useToast();
  const [result, setResult] = useState<ImportResult | null>(null);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const file = values.jsonFile[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const importResult = await importUsers(content);
        setResult(importResult);

        if (importResult.errorCount > 0 && importResult.errors.some(e => e.includes("Firebase Admin SDK is not initialized"))) {
            toast({
                title: 'Configuration Error',
                description: 'Please set your Firebase Admin credentials in the .env file to enable this feature.',
                variant: 'destructive',
                duration: 10000,
            });
        } else {
            toast({
                title: 'Import Complete',
                description: `${importResult.successCount} users created, ${importResult.errorCount} failed.`,
            });
        }
      } catch (error: any) {
        toast({
          title: 'Import Failed',
          description: error.message || 'An unknown error occurred during import.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  }

  if (result) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Import Results</CardTitle>
                <CardDescription>The user import process has finished.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="h-8 w-8 text-green-600"/>
                        <div>
                            <p className="font-bold text-green-800">{result.successCount} User Authentication Profiles Created</p>
                            <p className="text-sm text-green-700">These users can now log in with the password 'password123'.</p>
                        </div>
                    </div>
                     {result.errorCount > 0 && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-4">
                                <AlertTriangle className="h-8 w-8 text-red-600"/>
                                <div>
                                    <p className="font-bold text-red-800">{result.errorCount} Users Failed to Import</p>
                                </div>
                            </div>
                            <ul className="mt-4 list-disc list-inside text-sm text-red-700 space-y-1 max-h-40 overflow-y-auto">
                                {result.errors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <Button onClick={() => { setResult(null); form.reset(); }}>Start New Import</Button>
                </div>
            </CardContent>
        </Card>
    )
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Create Member Logins</CardTitle>
                <CardDescription>
                    Upload your JSON file to create login credentials for your existing Firestore user records.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                    control={form.control}
                    name="jsonFile"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Members JSON File</FormLabel>
                        <FormControl>
                            <Input 
                                type="file" 
                                accept=".json"
                                onChange={(e) => field.onChange(e.target.files)}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <UploadCloud className="mr-2 h-4 w-4" />
                    )}
                    Create Logins
                    </Button>
                </form>
                </Form>
            </CardContent>
        </Card>
        <Card className="bg-secondary/50">
             <CardHeader>
                <CardTitle>JSON File Format</CardTitle>
                <CardDescription>
                    Your file must be a JSON array. Each object must have a <code className="font-mono bg-muted px-1 py-0.5 rounded">memberId</code> and <code className="font-mono bg-muted px-1 py-0.5 rounded">memberEmailAddress</code>.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-2">The importer will create Firebase Auth users with a UID matching the <code className="font-mono bg-muted px-1 py-0.5 rounded">memberId</code> and set a temporary password of 'password123'.</p>
                <Button variant="outline" asChild>
                    <Link href="/docs/member-import-schema.json" target="_blank">View Schema</Link>
                </Button>
                 <div className="mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm">
                    <strong>Important:</strong> This tool only creates login credentials. It assumes the user profiles already exist in your Firestore database.
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
