import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, RefreshCw, Sparkles, Heart, ThumbsUp, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import StartConversationButton from "./StartConversationButton";

interface MessagePlayerProps {
  userId?: string;
}

type MessageCategory = "all" | "general" | "encouragement" | "gratitude" | "motivation";

const MessagePlayer = ({ userId }: MessagePlayerProps) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState<string>("");
  const [messageId, setMessageId] = useState<string | null>(null);
  const [messageOwnerId, setMessageOwnerId] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("all");
  const [messageCategory, setMessageCategory] = useState<string>("general");
  const [thanksCount, setThanksCount] = useState(0);
  const [hasThanked, setHasThanked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [filterCategory, setFilterCategory] = useState<MessageCategory>("all");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const a = audioRef.current;
    if (a) {
      a.muted = false;
      a.volume = 1;
    }
  }, [audioUrl]);

  useEffect(() => {
    if (messageId && userId) {
      checkIfFavorited();
      checkIfThanked();
    }
  }, [messageId, userId]);

  const checkIfFavorited = async () => {
    if (!messageId || !userId) return;
    
    const { data } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("voice_message_id", messageId)
      .maybeSingle();
    
    setIsFavorited(!!data);
  };

  const checkIfThanked = async () => {
    if (!messageId || !userId) return;
    
    const { data } = await supabase
      .from("message_thanks")
      .select("id")
      .eq("user_id", userId)
      .eq("voice_message_id", messageId)
      .maybeSingle();
    
    setHasThanked(!!data);
  };

  const fetchMessage = async () => {
    // Stop and clear current audio before loading a new message
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }
    setAudioUrl(null);
    setLoading(true);
    setHasThanked(false);
    setIsFavorited(false);

    try {
      // Use secure function to get voice messages
      const { data: messages, error } = await supabase.rpc("get_random_voice_messages", {
        category_filter: filterCategory,
        limit_count: 50
      });

      if (error) throw error;

      if (!messages || messages.length === 0) {
        toast.error("No messages available in this category. Try another!");
        setLoading(false);
        return;
      }

      const selectedIndex = Math.floor(Math.random() * messages.length);
      const selectedMessage = messages[selectedIndex];

      setAudioUrl(selectedMessage.audio_url);
      setUsername(selectedMessage.username || "Anonymous");
      setMessageId(selectedMessage.id);
      setMessageOwnerId(selectedMessage.user_id);
      setMessageCategory(selectedMessage.category || "general");
      setThanksCount(selectedMessage.thanks_count || 0);
      toast.success("Here's a message of kindness for you! 💝");
    } catch (error: any) {
      toast.error("Failed to fetch message: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (!messageId || !userId) {
      toast.error("Please log in to save favorites");
      return;
    }

    try {
      if (isFavorited) {
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", userId)
          .eq("voice_message_id", messageId);
        setIsFavorited(false);
        toast.success("Removed from favorites");
      } else {
        await supabase
          .from("favorites")
          .insert({ user_id: userId, voice_message_id: messageId });
        setIsFavorited(true);
        toast.success("Added to favorites! ❤️");
      }
    } catch (error: any) {
      toast.error("Failed to update favorites");
    }
  };

  const handleThankYou = async () => {
    if (!messageId || !userId) {
      toast.error("Please log in to send thanks");
      return;
    }

    if (hasThanked) {
      toast.info("You've already thanked this message");
      return;
    }

    try {
      const { error } = await supabase
        .from("message_thanks")
        .insert({ user_id: userId, voice_message_id: messageId });

      if (error) {
        if (error.code === "23505") {
          toast.info("You've already thanked this message");
          setHasThanked(true);
        } else {
          throw error;
        }
        return;
      }

      setHasThanked(true);
      setThanksCount((prev) => prev + 1);
      toast.success("Thank you sent! 🙏");
    } catch (error: any) {
      toast.error("Failed to send thanks");
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "encouragement": return "bg-blue-500/20 text-blue-700";
      case "gratitude": return "bg-green-500/20 text-green-700";
      case "motivation": return "bg-orange-500/20 text-orange-700";
      default: return "bg-purple-500/20 text-purple-700";
    }
  };

  return (
    <Card className="shadow-glow bg-white/95 backdrop-blur-sm animate-in fade-in slide-in-from-right duration-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          Brighten My Day
        </CardTitle>
        <CardDescription>
          Listen to a message of kindness from the community
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Filter className="w-4 h-4 text-accent" />
            Filter by Category
          </label>
          <Select value={filterCategory} onValueChange={(v: MessageCategory) => setFilterCategory(v)}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="general">General Positivity</SelectItem>
              <SelectItem value="encouragement">Encouragement</SelectItem>
              <SelectItem value="gratitude">Gratitude</SelectItem>
              <SelectItem value="motivation">Motivation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col items-center gap-4 py-6">
          {!audioUrl ? (
            <Button
              onClick={fetchMessage}
              disabled={loading}
              size="lg"
              className="w-32 h-32 rounded-full bg-secondary hover:bg-secondary/90 hover:scale-105 transition-all duration-300 shadow-lg disabled:opacity-70"
            >
              {loading ? (
                <RefreshCw className="w-12 h-12 text-secondary-foreground animate-spin" />
              ) : (
                <Play className="w-12 h-12 text-secondary-foreground ml-1" fill="currentColor" />
              )}
            </Button>
          ) : (
            <div className="space-y-5 w-full">
              {/* Styled audio player card */}
              <div className="relative p-5 rounded-2xl bg-gradient-to-br from-accent/10 via-secondary/10 to-primary/5 border border-accent/20 shadow-lg overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/20 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-primary/15 to-transparent rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative">
                  {/* Header with avatar and info */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-accent to-secondary flex items-center justify-center shadow-lg">
                      <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getCategoryColor(messageCategory)}`}>
                          {messageCategory.charAt(0).toUpperCase() + messageCategory.slice(1)}
                        </span>
                      </div>
                      <p className="text-lg font-semibold text-foreground truncate">{username}</p>
                      <p className="text-xs text-muted-foreground">Shared a message of kindness</p>
                    </div>
                  </div>
                  
                  {/* Audio player */}
                  <div className="bg-background/60 backdrop-blur-sm rounded-xl p-3 border border-border/50">
                    <audio
                      ref={audioRef}
                      src={audioUrl ?? undefined}
                      controls
                      className="w-full h-10 [&::-webkit-media-controls-panel]:bg-transparent"
                      crossOrigin="anonymous"
                      preload="metadata"
                      playsInline
                      muted={false}
                      onPlay={() => {
                        const a = audioRef.current;
                        if (a) {
                          a.muted = false;
                          a.volume = 1;
                        }
                      }}
                      onError={() =>
                        toast.error(
                          "Playback failed. Your browser may not support this audio format. Try a different browser."
                        )
                      }
                    />
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
                    <Button
                      onClick={handleFavorite}
                      variant="ghost"
                      size="sm"
                      className={`rounded-full px-4 transition-all duration-300 ${isFavorited ? "bg-red-100 text-red-600 hover:bg-red-200" : "hover:bg-accent/10"}`}
                    >
                      <Heart className={`w-4 h-4 mr-1.5 ${isFavorited ? "fill-current" : ""}`} />
                      {isFavorited ? "Saved" : "Save"}
                    </Button>
                    <Button
                      onClick={handleThankYou}
                      variant="ghost"
                      size="sm"
                      disabled={hasThanked}
                      className={`rounded-full px-4 transition-all duration-300 ${hasThanked ? "bg-green-100 text-green-600" : "hover:bg-accent/10"}`}
                    >
                      <ThumbsUp className={`w-4 h-4 mr-1.5 ${hasThanked ? "fill-current" : ""}`} />
                      Thank You {thanksCount > 0 && `(${thanksCount})`}
                    </Button>
                    {userId && messageOwnerId && userId !== messageOwnerId && (
                      <StartConversationButton
                        currentUserId={userId}
                        otherUserId={messageOwnerId}
                        voiceMessageId={messageId || undefined}
                        className="rounded-full px-4 transition-all duration-300 hover:bg-blue-100 hover:text-blue-600"
                      />
                    )}
                  </div>
                </div>
              </div>

              <Button
                onClick={fetchMessage}
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-accent via-secondary to-accent hover:opacity-90 shadow-md hover:shadow-lg transition-all duration-300"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Hear Another Message
              </Button>
            </div>
          )}

          <p className="text-sm text-muted-foreground text-center">
            {loading
              ? "Finding a message for you..."
              : audioUrl
              ? "Enjoy this moment of positivity"
              : "Click to receive a message of encouragement"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MessagePlayer;
