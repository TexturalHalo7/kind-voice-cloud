import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface StartConversationButtonProps {
  currentUserId: string;
  otherUserId: string;
  voiceMessageId?: string;
  className?: string;
}

const StartConversationButton = ({
  currentUserId,
  otherUserId,
  voiceMessageId,
  className,
}: StartConversationButtonProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleStartConversation = async () => {
    if (currentUserId === otherUserId) {
      toast.info("This is your own message");
      return;
    }

    setLoading(true);
    try {
      // Check if conversation already exists (in either direction)
      const { data: existingConvo } = await supabase
        .from("conversations")
        .select("id")
        .or(
          `and(participant_one_id.eq.${currentUserId},participant_two_id.eq.${otherUserId}),and(participant_one_id.eq.${otherUserId},participant_two_id.eq.${currentUserId})`
        )
        .maybeSingle();

      if (existingConvo) {
        // Navigate to existing conversation
        navigate(`/conversations?id=${existingConvo.id}`);
        return;
      }

      // Create new conversation
      const { data: newConvo, error } = await supabase
        .from("conversations")
        .insert({
          participant_one_id: currentUserId,
          participant_two_id: otherUserId,
          original_voice_message_id: voiceMessageId,
        })
        .select("id")
        .single();

      if (error) throw error;

      toast.success("Conversation started!");
      navigate(`/conversations?id=${newConvo.id}`);
    } catch (error: any) {
      console.error("Error starting conversation:", error);
      toast.error("Failed to start conversation");
    }
    setLoading(false);
  };

  return (
    <Button
      onClick={handleStartConversation}
      disabled={loading}
      variant="ghost"
      size="sm"
      className={className}
    >
      <MessageCircle className="w-4 h-4 mr-1.5" />
      {loading ? "..." : "Reply"}
    </Button>
  );
};

export default StartConversationButton;
