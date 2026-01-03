

'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Trash2 } from 'lucide-react';
import type { UserProfile } from '@/hooks/use-auth';
import { updateUserProfile } from '@/lib/firebase/client-actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { uploadPhoto } from '@/lib/actions';
import { Card, CardContent } from '../ui/card';
import { useAuth } from '@/hooks/use-auth';
import { Separator } from '../ui/separator';

const formSchema = z.object({
  displayName: z.string().min(2, { message: 'Display Name must be at least 2 characters.' }),
  username: z.string().min(3, 'Username must be at least 3 characters.').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores.'),
  memberFirstName: z.string().optional(),
  memberLastName: z.string().optional(),
  memberEmailAddress: z.string().optional(),
  memberMobileNumber: z.string().optional(),
  memberExperience: z.string().optional(),
  memberType: z.string().optional(),
  memberStatus: z.string().optional(),
});


type ProfileFormProps = {
  user: UserProfile;
  onUpdate: (user: UserProfile) => void;
  closeDialog: () => void;
};

export default function ProfileForm({ user, onUpdate, closeDialog }: ProfileFormProps) {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user.avatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const isAdminEditing = currentUser?.role === 'admin' && currentUser.uid !== user.uid;


  useEffect(() => {
    setPreviewUrl(user.avatarUrl);
  }, [user.avatarUrl]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: user.displayName ?? '',
      username: user.username ?? '',
      memberFirstName: user.memberFirstName ?? '',
      memberLastName: user.memberLastName ?? '',
      memberEmailAddress: user.memberEmailAddress ?? '',
      memberMobileNumber: user.memberMobileNumber ?? '',
      memberExperience: user.memberExperience ?? '',
      memberType: user.memberType ?? '',
      memberStatus: user.memberStatus ?? '',
    },
  });

  useEffect(() => {
    form.reset({
      displayName: user.displayName ?? '',
      username: user.username ?? '',
      memberFirstName: user.memberFirstName ?? '',
      memberLastName: user.memberLastName ?? '',
      memberEmailAddress: user.memberEmailAddress ?? '',
      memberMobileNumber: user.memberMobileNumber ?? '',
      memberExperience: user.memberExperience ?? '',
      memberType: user.memberType ?? '',
      memberStatus: user.memberStatus ?? '',
    });
  }, [user, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const updatedData: Partial<UserProfile> = {
        displayName: values.displayName,
        memberFirstName: values.memberFirstName,
        memberLastName: values.memberLastName,
        memberEmailAddress: values.memberEmailAddress,
        memberMobileNumber: values.memberMobileNumber,
        memberExperience: values.memberExperience,
        memberType: values.memberType,
        memberStatus: values.memberStatus,
      };

      // Only include username if admin is editing or if the user is setting it for the first time
      if (isAdminEditing || !user.username) {
        updatedData.username = values.username;
      }

      await updateUserProfile(user.uid, updatedData);
      
      const updatedUser: UserProfile = { ...user, ...updatedData };

      onUpdate(updatedUser);
      
      toast({
        title: 'Success',
        description: 'Your profile has been updated.',
      });
      closeDialog();
    } catch (error: any) {
      toast({
        title: 'Error updating profile',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
    setLoading(false);
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPhotoLoading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const result: any = await uploadPhoto(formData);
      
      if (!result?.secure_url) {
        throw new Error('Image upload failed to return a URL.');
      }
      const avatarUrl = result.secure_url;
      
      await updateUserProfile(user.uid, { avatarUrl });
      const updatedUser = { ...user, avatarUrl };
      onUpdate(updatedUser);
      setPreviewUrl(avatarUrl);

      toast({
        title: 'Success',
        description: 'Profile photo updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Upload Failed',
        description: error.message || 'Could not upload your profile photo.',
        variant: 'destructive',
      });
    }
    setPhotoLoading(false);
  };
  
  const handleRemovePhoto = async () => {
    setPhotoLoading(true);
    try {
        await updateUserProfile(user.uid, { avatarUrl: null });
        const updatedUser = { ...user, avatarUrl: null };
        onUpdate(updatedUser);
        setPreviewUrl(null);
        toast({
            title: 'Success',
            description: 'Your profile photo has been removed.',
        });
    } catch (error: any) {
        toast({
            title: 'Error',
            description: error.message || 'Could not remove profile photo.',
            variant: 'destructive',
        });
    }
    setPhotoLoading(false);
  }

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto p-1">
      <Card className="bg-secondary/30">
        <CardContent className="p-6 flex items-center gap-4">
            <div className="relative">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={previewUrl ?? undefined} alt={user.displayName ?? 'User'} />
                    <AvatarFallback>{user.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={photoLoading}
                />
                <Button
                    size="icon"
                    className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photoLoading}
                    aria-label="Upload photo"
                >
                    {photoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </Button>
            </div>
            <div className="flex-1">
                <h3 className="text-xl font-bold">{user.displayName}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                 {previewUrl && (
                    <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto text-destructive"
                        onClick={handleRemovePhoto}
                        disabled={photoLoading}
                    >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Remove photo
                    </Button>
                )}
            </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <h4 className="text-lg font-semibold">Editable Profile</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                    <Input placeholder="your_unique_handle" {...field} disabled={!isAdminEditing && !!user.username} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
          </div>

          <Separator className="my-8" />
          
          <h4 className="text-lg font-semibold">Imported Member Data</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <FormField
                control={form.control}
                name="memberFirstName"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>First Name (from import)</FormLabel>
                    <FormControl>
                    <Input {...field} />
                    </FormControl>
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="memberLastName"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Last Name (from import)</FormLabel>
                    <FormControl>
                    <Input {...field} />
                    </FormControl>
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="memberEmailAddress"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Email (from import)</FormLabel>
                    <FormControl>
                    <Input {...field} />
                    </FormControl>
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="memberMobileNumber"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Mobile (from import)</FormLabel>
                    <FormControl>
                    <Input {...field} />
                    </FormControl>
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="memberExperience"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Experience (from import)</FormLabel>
                    <FormControl>
                    <Input {...field} />
                    </FormControl>
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="memberType"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Member Type (from import)</FormLabel>
                    <FormControl>
                    <Input {...field} />
                    </FormControl>
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="memberStatus"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Member Status (from import)</FormLabel>
                    <FormControl>
                    <Input {...field} />
                    </FormControl>
                </FormItem>
                )}
            />
          </div>


          <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-background pb-2">
            <Button type="button" variant="ghost" onClick={closeDialog}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
