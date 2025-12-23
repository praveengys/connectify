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
import { Loader2, Upload } from 'lucide-react';
import type { UserProfile } from '@/hooks/use-auth';
import { updateUserProfile } from '@/lib/firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { uploadPhoto } from '@/lib/actions';

const formSchema = z.object({
  displayName: z.string().min(2, { message: 'Display Name must be at least 2 characters.' }),
  username: z.string().min(3, 'Username must be at least 3 characters.').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores.'),
  bio: z.string().max(160, 'Bio cannot be more than 160 characters.').optional().default(''),
  interests: z.string().optional().default(''),
  skills: z.string().optional().default(''),
  location: z.string().optional().default(''),
  currentlyExploring: z.string().max(60, 'Cannot be more than 60 characters.').optional().default(''),
  languages: z.string().optional().default(''),
});

type ProfileFormProps = {
  user: UserProfile;
  onUpdate: (user: UserProfile) => void;
  closeDialog: () => void;
};

export default function ProfileForm({ user, onUpdate, closeDialog }: ProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user.avatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setPreviewUrl(user.avatarUrl);
  }, [user.avatarUrl]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: user.displayName ?? '',
      username: user.username ?? '',
      bio: user.bio ?? '',
      interests: user.interests?.join(', ') ?? '',
      skills: user.skills?.join(', ') ?? '',
      location: user.location ?? '',
      currentlyExploring: user.currentlyExploring ?? '',
      languages: user.languages?.join(', ') ?? '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const updatedData = {
        ...values,
        interests: values.interests ? values.interests.split(',').map(s => s.trim()).filter(Boolean) : [],
        skills: values.skills ? values.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        languages: values.languages ? values.languages.split(',').map(s => s.trim()).filter(Boolean) : [],
      };

      await updateUserProfile(user.uid, updatedData);
      
      // We need to construct the full UserProfile object for the onUpdate callback
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4">
        <Avatar className="h-24 w-24 border-4 border-accent">
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
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={photoLoading}
        >
          {photoLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Upload Photo
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="your_unique_handle" {...field} disabled={!!user.username} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Short Bio</FormLabel>
                <FormControl>
                  <Textarea placeholder="Tell us a little about yourself" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="skills"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Skills</FormLabel>
                <FormControl>
                  <Input placeholder="JavaScript, Photography, Public Speaking" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="interests"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interests / Topics</FormLabel>
                <FormControl>
                  <Input placeholder="Technology, Startups, Design" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="languages"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Languages</FormLabel>
                <FormControl>
                  <Input placeholder="English, Spanish" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="City or Country" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currentlyExploring"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currently Exploring</FormLabel>
                <FormControl>
                  <Input placeholder="What are you learning now?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2 pt-4">
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
