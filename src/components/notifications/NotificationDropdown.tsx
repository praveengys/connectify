
'use client';

import { useNotifications } from '@/hooks/use-notifications';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, BellRing, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/firebase/client-actions';
import { useAuth } from '@/hooks/use-auth';
import { useFirebase } from '@/firebase/client-provider';

export default function NotificationDropdown() {
  const { firestore } = useFirebase();
  const { user } = useAuth();
  const { notifications, loading, unreadCount } = useNotifications(user?.uid);

  if (!user) return null;

  const handleMarkAsRead = (id: string) => {
    markNotificationAsRead(firestore, user.uid, id);
  };
  
  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead(firestore, user.uid);
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Notifications</CardTitle>
        {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>Mark all as read</Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-80">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
              <Bell size={32} className="mb-4" />
              <p className="font-semibold">No notifications</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          )}
          <div className="space-y-1">
            {notifications.map((notification) => (
              <Link href={notification.actionUrl || '#'} key={notification.id} passHref>
                <div
                  className={cn(
                    'flex items-start gap-3 p-4 hover:bg-accent cursor-pointer',
                    !notification.isRead && 'bg-primary/5 hover:bg-primary/10'
                  )}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="relative">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={notification.sender?.avatarUrl ?? undefined} />
                      <AvatarFallback>{notification.sender?.displayName?.charAt(0) || <BellRing/>}</AvatarFallback>
                    </Avatar>
                     {!notification.isRead && <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary border-2 border-background" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm" dangerouslySetInnerHTML={{ __html: notification.message }} />
                    <p className="text-xs text-muted-foreground">
                      {notification.createdAt ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }) : ''}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">View all notifications</Button>
      </CardFooter>
    </Card>
  );
}

    