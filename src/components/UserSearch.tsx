import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, User, MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface SearchResult {
  user_id: string;
  username: string;
}

interface UserSearchProps {
  currentUserId: string;
}

const UserSearch = ({ currentUserId }: UserSearchProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [startingConversation, setStartingConversation] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // Use the existing secure function to get usernames
      const { data, error } = await supabase
        .rpc("get_leaderboard_profiles");

      if (error) throw error;

      // Filter results client-side based on search query
      const filtered = (data || [])
        .filter(
          (profile) =>
            profile.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
            profile.user_id !== currentUserId
        )
        .slice(0, 10)
        .map((profile) => ({
          user_id: profile.user_id,
          username: profile.username,
        }));

      setResults(filtered);
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error("Failed to search users");
    } finally {
      setLoading(false);
    }
  };

  const startConversation = async (otherUserId: string) => {
    if (startingConversation) return;
    
    setStartingConversation(otherUserId);
    try {
      // Check if conversation already exists
      const { data: existingConversation } = await supabase
        .from("conversations")
        .select("id")
        .or(
          `and(participant_one_id.eq.${currentUserId},participant_two_id.eq.${otherUserId}),and(participant_one_id.eq.${otherUserId},participant_two_id.eq.${currentUserId})`
        )
        .maybeSingle();

      if (existingConversation) {
        navigate(`/conversations?id=${existingConversation.id}`);
        return;
      }

      // Create new conversation
      const { data: newConversation, error } = await supabase
        .from("conversations")
        .insert({
          participant_one_id: currentUserId,
          participant_two_id: otherUserId,
        })
        .select("id")
        .single();

      if (error) throw error;

      toast.success("Conversation started!");
      navigate(`/conversations?id=${newConversation.id}`);
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error("Failed to start conversation");
    } finally {
      setStartingConversation(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search usernames..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
        </Button>
      </div>

      {results.length > 0 && (
        <ScrollArea className="h-[200px] border rounded-lg">
          <div className="p-2 space-y-1">
            {results.map((result) => (
              <div
                key={result.user_id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-medium">{result.username}</span>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => startConversation(result.user_id)}
                  disabled={startingConversation === result.user_id}
                >
                  {startingConversation === result.user_id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Message
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {searchQuery && results.length === 0 && !loading && (
        <p className="text-center text-muted-foreground text-sm py-4">
          No users found matching "{searchQuery}"
        </p>
      )}
    </div>
  );
};

export default UserSearch;
