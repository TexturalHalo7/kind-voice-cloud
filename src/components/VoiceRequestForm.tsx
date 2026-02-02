import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquarePlus, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VoiceRequestFormProps {
  userId: string;
  recipientId?: string;
  onSuccess?: () => void;
}

const VoiceRequestForm = ({ userId, recipientId, onSuccess }: VoiceRequestFormProps) => {
  const [topic, setTopic] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !userId) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("voice_message_requests")
        .insert({
          requester_id: userId,
          recipient_id: recipientId || null,
          topic: topic.trim(),
        });

      if (error) throw error;

      toast.success("Your request has been submitted! 🎤");
      setTopic("");
      onSuccess?.();
    } catch (error: any) {
      toast.error("Failed to submit request: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="shadow-glow bg-white/95 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquarePlus className="w-5 h-5 text-primary" />
          Request a Voice Message
        </CardTitle>
        <CardDescription>
          Tell others what kind of voice message would brighten your day
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., 'I'd love to hear some words of encouragement for starting a new job' or 'Can someone share a motivational message about staying positive?'"
            className="min-h-[100px] resize-none"
            maxLength={500}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {topic.length}/500 characters
            </span>
            <Button
              type="submit"
              disabled={!topic.trim() || submitting}
              className="rounded-full"
            >
              <Send className="w-4 h-4 mr-2" />
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default VoiceRequestForm;
