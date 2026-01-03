'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { UserProfile } from "@/hooks/use-auth";
import { Image as ImageIcon, Video, Mic, MapPin, Loader2, X } from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { createPost } from "@/lib/firebase/firestore";
import { Card, CardContent } from "../ui/card";
import { uploadPhoto } from "@/lib/actions";
import Image from "next/image";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { useAuth } from "@/hooks/use-auth";

export default function PostCreator({ user: initialUser }: { user: UserProfile }) {
  const { user } = useAuth(); // Use the live user from auth context
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = event.target.files?.[0];
    if (file) {
      if (mediaFile) {
        toast({ title: "You can only upload one file at a time.", variant: "destructive" });
        return;
      }
      setMediaFile(file);
      setMediaType(type);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
  };
  
  const handleMicClick = () => {
    setIsRecording(true);
    toast({ title: "Listening...", description: "Your voice is being recorded." });
    setTimeout(() => {
      setContent(prev => prev + (prev ? " " : "") + "This is a sample transcribed text.");
      setIsRecording(false)
      toast({ title: "Finished recording", description: "Text has been added." });
    }, 3000);
  }

  const handleCreatePost = async () => {
    // CRITICAL FIX: Ensure user and user.uid are present before posting.
    if (!user?.uid) {
        toast({
            title: "Authentication Error",
            description: "Please wait a moment and try again. Your session is initializing.",
            variant: "destructive"
        });
        return;
    }
      
    if (!content.trim() && !mediaFile) {
        toast({
            title: "Post is empty",
            description: "Add some text or media to your post.",
            variant: "destructive"
        });
        return;
    }

    setIsPosting(true);
    let mediaUrl: string | undefined = undefined;

    try {
        if (mediaFile) {
            toast({ title: 'Uploading media...', description: 'Please wait.' });
            const formData = new FormData();
            formData.append('photo', mediaFile); // 'photo' key is used by our server action for all media
            const result: any = await uploadPhoto(formData);
            
            if (!result?.secure_url) {
              throw new Error('Media upload failed to return a URL.');
            }
            mediaUrl = result.secure_url;
        }

        // Use the confirmed user.uid for the authorId
        await createPost(user.uid, content, 'active', mediaUrl ? [mediaUrl] : []);
        
        setContent('');
        clearMedia();

        toast({
            title: "Posted!",
            description: "Your post is now live on the feed.",
        });
    } catch (error: any) {
        toast({
            title: "Error",
            description: `Could not create post: ${error.message}`,
            variant: "destructive"
        });
    } finally {
        setIsPosting(false);
    }
  };
  
  const displayUser = user || initialUser;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Avatar>
            <AvatarImage src={displayUser.avatarUrl || ''} />
            <AvatarFallback>{displayUser.displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          <Textarea 
            placeholder={`Share what's on your mind, ${displayUser.displayName.split(' ')[0]}...`}
            className="flex-grow border-none focus-visible:ring-0 bg-transparent p-0" 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isPosting}
          />
        </div>
        
        {mediaPreview && (
            <div className="mt-4 relative w-fit">
                {mediaType === 'image' && <Image src={mediaPreview} alt="Preview" width={100} height={100} className="rounded-md object-cover" />}
                {mediaType === 'video' && <video src={mediaPreview} controls className="w-full max-w-sm rounded-md" />}
                 <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={clearMedia}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        )}

        <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <div className="flex gap-1 text-muted-foreground">
                <input type="file" ref={imageInputRef} onChange={(e) => handleFileChange(e, 'image')} accept="image/*" className="hidden" />
                <input type="file" ref={videoInputRef} onChange={(e) => handleFileChange(e, 'video')} accept="video/*" className="hidden" />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => imageInputRef.current?.click()} disabled={isPosting}>
                          <ImageIcon />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Add Image</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => videoInputRef.current?.click()} disabled={isPosting}>
                          <Video />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Add Video</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
            </div>
            <div className="flex gap-2">
                <Button onClick={handleCreatePost} disabled={isPosting || (!user?.uid) || (!content.trim() && !mediaFile)}>
                    {isPosting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Post
                </Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
