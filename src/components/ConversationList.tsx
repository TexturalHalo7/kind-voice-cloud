import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Mic } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";

interface Conversation {
  id: string;
  participant_one_id: string;
  participant_two_id: string;
  updated_at: string;
  other_user?: {
    username: string;
    user_id: string;
    avatar_id?: string;
  };
  last_message?: {
    content: string | null;
    message_type: string;
    created_at: string;
  };
  unread_count: number;
}

interface ConversationListProps {
  userId: string;
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
}

const ConversationList = ({
  userId,
  selectedConversationId,
  onSelectConversation,
}: ConversationListProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    if (!userId) return;

    // Get all conversations for the user
    const { data: convos, error } = await supabase
      .from("conversations")
      .select("*")
      .or(`participant_one_id.eq.${userId},participant_two_id.eq.${userId}`)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      setLoading(false);
      return;
    }

    if (!convos || convos.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Get other user details and last messages for each conversation
    const enrichedConversations = await Promise.all(
      convos.map(async (convo) => {
        const otherUserId =
          convo.participant_one_id === userId
            ? convo.participant_two_id
            : convo.participant_one_id;

        // Get other user's profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, user_id, avatar_id")
          .eq("user_id", otherUserId)
          .maybeSingle();

        // Get last message
        const { data: lastMessage } = await supabase
          .from("conversation_messages")
          .select("content, message_type, created_at")
          .eq("conversation_id", convo.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // Get unread count
        const { count } = await supabase
          .from("conversation_messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", convo.id)
          .neq("sender_id", userId)
          .eq("is_read", false);

        return {
          ...convo,
          other_user: profile || { username: "Unknown User", user_id: otherUserId },
          last_message: lastMessage || undefined,
          unread_count: count || 0,
        };
      })
    );

    setConversations(enrichedConversations);
    setLoading(false);
  };

  useEffect(() => {
    fetchConversations();

    // Subscribe to new messages to update the list
    const channel = supabase
      .channel("conversation_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversation_messages",
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-6 text-center">
        <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">No conversations yet</p>
        <p className="text-muted-foreground/70 text-xs mt-1">
          Start a conversation by replying to a voice message
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px]">
      <div className="divide-y divide-border">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => onSelectConversation(conversation.id)}
            className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
              selectedConversationId === conversation.id ? "bg-muted" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <UserAvatar avatarId={conversation.other_user?.avatar_id} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate">
                    {conversation.other_user?.username || "Unknown User"}
                  </span>
                  {conversation.unread_count > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                      {conversation.unread_count}
                    </span>
                  )}
                </div>
                {conversation.last_message && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                    {conversation.last_message.message_type === "voice" ? (
                      <>
                        <Mic className="w-3 h-3" />
                        <span className="truncate">Voice message</span>
                      </>
                    ) : (
                      <span className="truncate">
                        {conversation.last_message.content || "No message"}
                      </span>
                    )}
                  </div>
                )}
                {conversation.last_message && (
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {formatDistanceToNow(new Date(conversation.last_message.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
};

export default ConversationList;
