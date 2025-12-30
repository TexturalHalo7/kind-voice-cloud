import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { ArrowLeft, Send, Mic, Square, Play, Pause } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  sender_id: string;
  content: string | null;
  audio_url: string | null;
  message_type: string;
  is_read: boolean;
  created_at: string;
}

interface ConversationChatProps {
  conversationId: string;
  userId: string;
  onBack: () => void;
}

const ConversationChat = ({ conversationId, userId, onBack }: ConversationChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [otherUserName, setOtherUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchConversation = async () => {
    // Get conversation details
    const { data: convo } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (convo) {
      const otherUserId =
        convo.participant_one_id === userId
          ? convo.participant_two_id
          : convo.participant_one_id;

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("user_id", otherUserId)
        .maybeSingle();

      setOtherUserName(profile?.username || "Unknown User");
    }

    // Fetch messages
    const { data: msgs } = await supabase
      .from("conversation_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (msgs) {
      setMessages(msgs);
      
      // Mark messages as read
      const unreadIds = msgs
        .filter((m) => m.sender_id !== userId && !m.is_read)
        .map((m) => m.id);

      if (unreadIds.length > 0) {
        await supabase
          .from("conversation_messages")
          .update({ is_read: true })
          .in("id", unreadIds);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchConversation();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversation_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
          
          // Mark as read if from other user
          if (newMsg.sender_id !== userId) {
            supabase
              .from("conversation_messages")
              .update({ is_read: true })
              .eq("id", newMsg.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendTextMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const { error } = await supabase.from("conversation_messages").insert({
      conversation_id: conversationId,
      sender_id: userId,
      content: newMessage.trim(),
      message_type: "text",
    });

    if (error) {
      toast.error("Failed to send message");
    } else {
      setNewMessage("");
    }
    setSending(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await uploadAndSendVoice(audioBlob);
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadAndSendVoice = async (audioBlob: Blob) => {
    setSending(true);
    try {
      const fileName = `chat/${userId}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from("voice_messages")
        .upload(fileName, audioBlob, { contentType: "audio/webm" });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("voice_messages")
        .getPublicUrl(fileName);

      const { error } = await supabase.from("conversation_messages").insert({
        conversation_id: conversationId,
        sender_id: userId,
        audio_url: publicUrl,
        message_type: "voice",
      });

      if (error) throw error;
      toast.success("Voice message sent!");
    } catch (error: any) {
      console.error("Error sending voice message:", error);
      toast.error("Failed to send voice message");
    }
    setSending(false);
  };

  const playAudio = (audioUrl: string) => {
    if (audioRef.current) {
      if (playingAudio === audioUrl) {
        audioRef.current.pause();
        setPlayingAudio(null);
      } else {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setPlayingAudio(audioUrl);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Chat Header */}
      <div className="p-4 border-b flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onBack}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
          {otherUserName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="font-semibold">{otherUserName}</h3>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwn = message.sender_id === userId;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    isOwn
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.message_type === "voice" && message.audio_url ? (
                    <button
                      onClick={() => playAudio(message.audio_url!)}
                      className="flex items-center gap-2"
                    >
                      {playingAudio === message.audio_url ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5" />
                      )}
                      <span className="text-sm">Voice message</span>
                    </button>
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                  <p
                    className={`text-xs mt-1 ${
                      isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    {formatDistanceToNow(new Date(message.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Hidden audio element for playback */}
      <audio
        ref={audioRef}
        onEnded={() => setPlayingAudio(null)}
        className="hidden"
      />

      {/* Input Area */}
      <div className="p-4 border-t">
        <form onSubmit={sendTextMessage} className="flex items-center gap-2">
          <Button
            type="button"
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={sending}
            className="shrink-0"
          >
            {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending || isRecording}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || sending || isRecording}
            size="icon"
            className="shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        {isRecording && (
          <p className="text-sm text-center text-destructive mt-2 animate-pulse">
            Recording... Click the stop button when done
          </p>
        )}
      </div>
    </div>
  );
};

export default ConversationChat;
