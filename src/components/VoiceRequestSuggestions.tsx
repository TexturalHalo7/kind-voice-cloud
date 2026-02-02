import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lightbulb, Mic, Clock, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface VoiceRequest {
  id: string;
  requester_id: string;
  topic: string;
  created_at: string;
  requester_username?: string;
}

interface VoiceRequestSuggestionsProps {
  userId: string;
  onRecordForRequest: (request: VoiceRequest) => void;
}

const VoiceRequestSuggestions = ({ userId, onRecordForRequest }: VoiceRequestSuggestionsProps) => {
  const [requests, setRequests] = useState<VoiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      // Fetch unfulfilled requests (excluding user's own requests)
      const { data, error } = await supabase
        .from("voice_message_requests")
        .select("*")
        .eq("is_fulfilled", false)
        .neq("requester_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      // Fetch usernames for requesters
      if (data && data.length > 0) {
        const requesterIds = [...new Set(data.map(r => r.requester_id))];
        const { data: profiles } = await supabase.rpc("get_leaderboard_profiles");
        
        const usernameMap = new Map(
          profiles?.map((p: any) => [p.user_id, p.username]) || []
        );

        const requestsWithUsernames = data.map(req => ({
          ...req,
          requester_username: usernameMap.get(req.requester_id) || "Someone",
        }));

        setRequests(requestsWithUsernames);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    // Subscribe to new requests
    const channel = supabase
      .channel("voice-requests")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "voice_message_requests",
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (loading) {
    return (
      <Card className="shadow-glow bg-white/95 backdrop-blur-sm">
        <CardContent className="py-8">
          <div className="animate-pulse text-center text-muted-foreground">
            Loading suggestions...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card className="shadow-glow bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Voice Message Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">
            No requests yet. Check back later to see what others are hoping to hear!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-glow bg-white/95 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          Voice Message Suggestions
        </CardTitle>
        <CardDescription>
          People are hoping to hear these messages - can you help?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {requests.map((request) => (
              <div
                key={request.id}
                className="p-4 rounded-xl bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 border border-primary/10 hover:border-primary/20 transition-all"
              >
                <p className="text-sm text-foreground mb-3 leading-relaxed">
                  "{request.topic}"
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {request.requester_username}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onRecordForRequest(request)}
                    className="rounded-full text-xs"
                  >
                    <Mic className="w-3 h-3 mr-1" />
                    Record
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default VoiceRequestSuggestions;
