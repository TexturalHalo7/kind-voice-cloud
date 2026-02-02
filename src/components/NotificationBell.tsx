import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
  related_message_id: string | null;
  audio_url?: string;
}

interface NotificationBellProps {
  userId: string;
}

const NotificationBell = ({ userId }: NotificationBellProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    
    if (data) {
      // Fetch audio URLs for request_fulfilled notifications
      const notificationsWithAudio = await Promise.all(
        data.map(async (notification) => {
          if (notification.type === "request_fulfilled" && notification.related_message_id) {
            const { data: voiceMessage } = await supabase
              .from("voice_messages")
              .select("audio_url")
              .eq("id", notification.related_message_id)
              .maybeSingle();
            return { ...notification, audio_url: voiceMessage?.audio_url };
          }
          return notification;
        })
      );
      setNotifications(notificationsWithAudio);
      setUnreadCount(data.filter((n) => !n.read).length);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchNotifications();

      // Subscribe to new notifications
      const channel = supabase
        .channel("notifications")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userId]);

  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, [audioElement]);

  const togglePlay = (notification: Notification) => {
    if (!notification.audio_url) return;

    if (playingId === notification.id) {
      audioElement?.pause();
      setPlayingId(null);
      setAudioElement(null);
    } else {
      if (audioElement) {
        audioElement.pause();
      }
      const audio = new Audio(notification.audio_url);
      audio.onended = () => {
        setPlayingId(null);
        setAudioElement(null);
      };
      audio.play();
      setPlayingId(notification.id);
      setAudioElement(audio);
    }
  };

  const markAllAsRead = async () => {
    if (notifications.some((n) => !n.read)) {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", userId)
        .eq("read", false);
      
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      markAllAsRead();
    }
    if (!isOpen && audioElement) {
      audioElement.pause();
      setPlayingId(null);
      setAudioElement(null);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20 relative"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <h4 className="font-semibold">Notifications</h4>
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 ${!notification.read ? "bg-primary/5" : ""}`}
                >
                  <p className="text-sm">{notification.message}</p>
                  {notification.type === "request_fulfilled" && notification.audio_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 w-full"
                      onClick={() => togglePlay(notification)}
                    >
                      {playingId === notification.id ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Listen to Message
                        </>
                      )}
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
