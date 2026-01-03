
'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { PostComment, UserProfile } from '@/lib/types';
import { Loader2, ServerCrash } from 'lucide-react';
import { createComment } from '@/lib/firebase/client-actions';
import { getUserProfile } from '@/lib/firebase/firestore';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import PostCommentItem from './PostCommentItem';

type CommentSectionProps = {
  postId: string;
};

export default function CommentSection({ postId }: CommentSectionProps) {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [authors, setAuthors] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  const fetchAuthors = useCallback(async (authorIds: string[]) => {
    const newAuthorIds = authorIds.filter(id => id && !authors[id]);
    if (newAuthorIds.length === 0) return;

    const uniqueNewAuthorIds = [...new Set(newAuthorIds)];
    try {
      const fetchedAuthors = await Promise.all(
        uniqueNewAuthorIds.map(id => getUserProfile(id))
      );
      setAuthors(prev => {
        const updatedAuthors = { ...prev };
        fetchedAuthors.forEach(author => {
          if (author) updatedAuthors[author.uid] = author;
        });
        return updatedAuthors;
      });
    } catch (err) {
      console.error("Error fetching authors:", err);
    }
  }, [authors]);

  useEffect(() => {
    const { firestore } = initializeFirebase();
    const commentsRef = collection(firestore, 'posts', postId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() ?? new Date(),
      } as PostComment));
      
      setComments(newComments);
      
      const authorIds = newComments.map(c => c.authorId);
      fetchAuthors(authorIds);

      setLoading(false);
    }, (err) => {
      console.error("Error fetching comments:", err);
      setError("Could not load comments.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [postId, fetchAuthors]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) {
      return;
    }
    setSubmitting(true);
    try {
      await createComment(postId, user.uid, newComment.trim());
      setNewComment('');
    } catch (e: any) {
      toast({
        title: "Error",
        description: `Could not post comment: ${e.message}`,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-t">
      <div className="p-4 space-y-4">
        {loading && <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>}
        {error && <div className="text-destructive text-center py-4">{error}</div>}
        
        {!loading && !error && (
            <>
                {comments.map(comment => (
                    <PostCommentItem key={comment.id} comment={comment} author={authors[comment.authorId]} />
                ))}
                {comments.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first to comment!</p>}
            </>
        )}
      </div>

      {user && (
        <div className="p-4 border-t bg-secondary/50">
            <div className="flex items-start gap-4">
            <div className="w-full">
                <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    rows={2}
                    className="w-full bg-background"
                />
                <div className="flex justify-end mt-2">
                    <Button 
                        onClick={handleSubmitComment} 
                        disabled={isSubmitting || authLoading || !newComment.trim()}
                        size="sm"
                    >
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Post Comment
                    </Button>
                </div>
            </div>
            </div>
        </div>
      )}
    </div>
  );
}
