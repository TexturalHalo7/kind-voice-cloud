import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Mic, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface VoiceMessage {
  id: string;
  audio_url: string;
  category: string;
  thanks_count: number;
  created_at: string;
}

const MyVoiceMessages = ({ userId }: { userId: string }) => {
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("voice_messages")
      .select("id, audio_url, category, thanks_count, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load your messages");
    } else {
      setMessages(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (userId) fetchMessages();
  }, [userId]);

  const handleDelete = async (id: string, audioUrl: string) => {
    setDeletingId(id);
    try {
      // Best-effort: remove audio file from storage
      try {
        const marker = "/voice-messages/";
        const idx = audioUrl.indexOf(marker);
        if (idx !== -1) {
          const path = audioUrl.substring(idx + marker.length).split("?")[0];
          await supabase.storage.from("voice-messages").remove([path]);
        }
      } catch {
        // Ignore storage errors; DB row deletion is the source of truth
      }

      const { error } = await supabase
        .from("voice_messages")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setMessages((prev) => prev.filter((m) => m.id !== id));
      toast.success("Voice message deleted");
    } catch (error: any) {
      toast.error("Failed to delete: " + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="shadow-glow bg-white/95 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-primary" />
          My Voice Messages
        </CardTitle>
        <CardDescription>
          Listen back to messages you've shared, or remove ones you no longer want public
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-6">Loading...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            You haven't shared any voice messages yet.
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/50"
              >
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium capitalize">
                      {m.category}
                    </span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}</span>
                    {m.thanks_count > 0 && (
                      <>
                        <span>•</span>
                        <span>🙏 {m.thanks_count}</span>
                      </>
                    )}
                  </div>
                  <audio src={m.audio_url} controls preload="none" className="w-full h-9" />
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 shrink-0"
                      disabled={deletingId === m.id}
                      aria-label="Delete voice message"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this voice message?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove your voice message. Others will no longer be able to hear it. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(m.id, m.audio_url)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyVoiceMessages;
