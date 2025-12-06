import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, RefreshCw, Sparkles, Heart, ThumbsUp, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RandomMessagePlayerProps {
  userId?: string;
}

type MessageCategory = "all" | "general" | "encouragement" | "gratitude" | "motivation";

const RandomMessagePlayer = ({ userId }: RandomMessagePlayerProps) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState<string>("");
  const [messageId, setMessageId] = useState<string | null>(null);
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

  const fetchRandomMessage = async () => {
    setLoading(true);
    setHasThanked(false);
    setIsFavorited(false);

    try {
      let query = supabase
        .from("voice_messages")
        .select(`
          *,
          profiles!inner(username)
        `)
        .limit(50);

      if (filterCategory !== "all") {
        query = query.eq("category", filterCategory);
      }

      const { data: messages, error } = await query;

      if (error) throw error;

      if (!messages || messages.length === 0) {
        toast.error("No messages available in this category. Try another!");
        setLoading(false);
        return;
      }

      const randomIndex = Math.floor(Math.random() * messages.length);
      const randomMessage = messages[randomIndex];

      setAudioUrl(randomMessage.audio_url);
      setUsername((randomMessage.profiles as any).username);
      setMessageId(randomMessage.id);
      setMessageCategory(randomMessage.category || "general");
      setThanksCount(randomMessage.thanks_count || 0);
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
          Listen to a random message of kindness from the community
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
              onClick={fetchRandomMessage}
              disabled={loading}
              size="lg"
              className="w-32 h-32 rounded-full bg-gradient-cool hover:scale-110 transition-all shadow-glow"
            >
              {loading ? (
                <RefreshCw className="w-12 h-12 animate-spin" />
              ) : (
                <Play className="w-12 h-12" fill="currentColor" />
              )}
            </Button>
          ) : (
            <div className="space-y-4 w-full">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <p className="text-sm text-muted-foreground">From</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(messageCategory)}`}>
                    {messageCategory}
                  </span>
                </div>
                <p className="text-lg font-semibold text-primary">{username}</p>
              </div>
              <audio
                ref={audioRef}
                src={audioUrl ?? undefined}
                controls
                className="w-full rounded-xl"
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
              
              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3">
                <Button
                  onClick={handleFavorite}
                  variant="outline"
                  size="sm"
                  className={`rounded-full ${isFavorited ? "bg-red-50 border-red-200 text-red-600" : ""}`}
                >
                  <Heart className={`w-4 h-4 mr-1 ${isFavorited ? "fill-current" : ""}`} />
                  {isFavorited ? "Saved" : "Save"}
                </Button>
                <Button
                  onClick={handleThankYou}
                  variant="outline"
                  size="sm"
                  disabled={hasThanked}
                  className={`rounded-full ${hasThanked ? "bg-green-50 border-green-200 text-green-600" : ""}`}
                >
                  <ThumbsUp className={`w-4 h-4 mr-1 ${hasThanked ? "fill-current" : ""}`} />
                  Thank You {thanksCount > 0 && `(${thanksCount})`}
                </Button>
              </div>

              <Button
                onClick={fetchRandomMessage}
                disabled={loading}
                variant="outline"
                className="w-full rounded-xl"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
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

export default RandomMessagePlayer;