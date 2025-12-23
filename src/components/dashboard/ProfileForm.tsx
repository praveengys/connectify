'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import type { UserProfile } from '@/hooks/use-auth';
import { updateUserProfile } from '@/lib/firebase/firestore';
import { uploadProfilePhoto } from '@/lib/firebase/storage';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
});

type ProfileFormProps = {
  user: UserProfile;
  onUpdate: (user: UserProfile) => void;
  closeDialog: () => void;
};

export default function ProfileForm({ user, onUpdate, closeDialog }: ProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user.photoURL);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user.name ?? '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      await updateUserProfile(user.uid, { name: values.name });
      const updatedUser = { ...user, name: values.name };
      onUpdate(updatedUser);
      toast({
        title: 'Success',
        description: 'Your profile has been updated.',
      });
      closeDialog();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update your profile.',
        variant: 'destructive',
      });
    }
    setLoading(false);
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoLoading(true);
      try {
        const photoURL = await uploadProfilePhoto(user.uid, file);
        await updateUserProfile(user.uid, { photoURL });
        const updatedUser = { ...user, photoURL };
        onUpdate(updatedUser);
        setPreviewUrl(photoURL);
        toast({
          title: 'Success',
          description: 'Profile photo updated.',
        });
      } catch (error) {
        toast({
          title: 'Upload Failed',
          description: 'Could not upload your profile photo.',
          variant: 'destructive',
        });
      }
      setPhotoLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4">
        <Avatar className="h-24 w-24 border-4 border-accent">
          <AvatarImage src={previewUrl ?? undefined} alt={user.name ?? 'User'} />
          <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
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
          <div className="flex justify-end gap-2">
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
