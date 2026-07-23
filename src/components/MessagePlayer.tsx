import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, RefreshCw, Sparkles, Heart, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import StartConversationButton from "./StartConversationButton";
import ReportMessageDialog from "./ReportMessageDialog";
import UpgradeDialog from "./UpgradeDialog";
import { usePremium } from "@/hooks/usePremium";

interface MessagePlayerProps {
  userId?: string;
}

type MessageCategory =
  | "all"
  | "appreciated"
  | "encouragement"
  | "congratulate"
  | "thank-you"
  | "you-matter";

type RatingValue = "made_my_day" | "nice" | "neutral" | "inappropriate";

const RATING_OPTIONS: { value: RatingValue; emoji: string; label: string; color: string }[] = [
  { value: "made_my_day",  emoji: "❤️", label: "Made my day", color: "bg-red-100 text-red-700 hover:bg-red-200 border-red-200" },
  { value: "nice",         emoji: "😊", label: "Nice",         color: "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200" },
  { value: "neutral",      emoji: "😐", label: "Neutral",      color: "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200" },
  { value: "inappropriate",emoji: "🚩", label: "Inappropriate",color: "bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/30" },
];

const CATEGORY_LABELS: Record<string, string> = {
  appreciated: "Appreciated",
  encouragement: "Encouragement",
  congratulate: "Congratulate",
  "thank-you": "Thank you",
  "you-matter": "You matter",
  // legacy fallbacks (in case any old rows sneak through)
  general: "You matter",
  gratitude: "Thank you",
  motivation: "Congratulate",
};

const MessagePlayer = ({ userId }: MessagePlayerProps) => {
  const { premium } = usePremium();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState<string>("");
  const [messageId, setMessageId] = useState<string | null>(null);
  const [messageOwnerId, setMessageOwnerId] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("all");
  const [messageCategory, setMessageCategory] = useState<string>("you-matter");
  const [isFavorited, setIsFavorited] = useState(false);
  const [filterCategory, setFilterCategory] = useState<MessageCategory>("all");
  const [hasFinishedListening, setHasFinishedListening] = useState(false);
  const [rating, setRating] = useState<RatingValue | null>(null);
  const [submittingRating, setSubmittingRating] = useState(false);
  const FREE_FAVORITE_LIMIT = 5;
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const a = audioRef.current;
    if (a) {
      a.muted = false;
      a.volume = 1;
      if (audioUrl) {
        a.play().catch(() => {
          // Autoplay may be blocked; user can press play manually
        });
      }
    }
  }, [audioUrl]);

  useEffect(() => {
    if (messageId && userId) {
      checkIfFavorited();
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

  const fetchMessage = async () => {
    // Stop and clear current audio before loading a new message
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }
    setAudioUrl(null);
    setLoading(true);
    setIsFavorited(false);
    setHasFinishedListening(false);
    setRating(null);

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

      // Filter out messages from the same person as the current message
      const filteredMessages = messageOwnerId
        ? messages.filter((m) => m.user_id !== messageOwnerId)
        : messages;

      const pool = filteredMessages.length > 0 ? filteredMessages : messages;
      const selectedIndex = Math.floor(Math.random() * pool.length);
      const selectedMessage = pool[selectedIndex];

      setAudioUrl(selectedMessage.audio_url);
      setUsername(selectedMessage.username || "Anonymous");
      setMessageId(selectedMessage.id);
      setMessageOwnerId(selectedMessage.user_id);
      setMessageCategory(selectedMessage.category || "you-matter");
      try {
        const key = "listened_count";
        const current = parseInt(localStorage.getItem(key) || "0", 10) || 0;
        localStorage.setItem(key, String(current + 1));
      } catch {}
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
    if (!premium && !isFavorited) {
      const { count, error: countError } = await supabase
        .from("favorites")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      if (countError) {
        toast.error("Failed to check favorites limit");
        return;
      }
      if ((count ?? 0) >= FREE_FAVORITE_LIMIT) {
        setUpgradeOpen(true);
        return;
      }
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

  const submitRating = async (value: RatingValue) => {
    if (!messageId || !messageOwnerId || !userId || rating || submittingRating) return;
    setSubmittingRating(true);
    const { error } = await supabase.from("message_ratings").insert({
      voice_message_id: messageId,
      listener_id: userId,
      sender_id: messageOwnerId,
      rating: value,
    });
    setSubmittingRating(false);
    if (error) {
      if (error.code === "23505") {
        setRating(value);
        toast.info("You've already rated this message");
        return;
      }
      toast.error("Failed to submit rating");
      return;
    }
    setRating(value);
    toast.success("Thanks for rating 💛");
  };

  const canRate = !!(userId && messageOwnerId && userId !== messageOwnerId);
  const ratingRequired = canRate && hasFinishedListening && !rating;

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "encouragement": return "bg-blue-500/20 text-blue-700";
      case "thank-you": return "bg-green-500/20 text-green-700";
      case "congratulate": return "bg-orange-500/20 text-orange-700";
      case "appreciated": return "bg-pink-500/20 text-pink-700";
      case "you-matter": return "bg-purple-500/20 text-purple-700";
      default: return "bg-slate-500/20 text-slate-700";
    }
  };

  return (
    <>
    <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} feature="You've reached the free limit of 5 saved favorites. Unlimited favorites" />
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
              <SelectItem value="appreciated">Appreciated</SelectItem>
              <SelectItem value="encouragement">Encouragement</SelectItem>
              <SelectItem value="congratulate">Congratulate</SelectItem>
              <SelectItem value="thank-you">Thank you</SelectItem>
              <SelectItem value="you-matter">You matter</SelectItem>
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
                          {CATEGORY_LABELS[messageCategory] || messageCategory}
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
                      onEnded={() => setHasFinishedListening(true)}
                      onError={() =>
                        toast.error(
                          "Playback failed. Your browser may not support this audio format. Try a different browser."
                        )
                      }
                    />
                  </div>
                  
                  {/* Rating (required after listening) */}
                  {canRate && (
                    <div className="mt-4 rounded-xl border border-border/50 bg-background/60 p-3">
                      <div className="text-sm font-medium text-center mb-3">
                        {rating
                          ? "Thanks for your rating 💛"
                          : hasFinishedListening
                          ? "How did this message feel? (required to hear another)"
                          : "Listen to the end, then rate it"}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {RATING_OPTIONS.map((opt) => {
                          const isSelected = rating === opt.value;
                          const disabled = !hasFinishedListening || !!rating || submittingRating;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => submitRating(opt.value)}
                              disabled={disabled}
                              className={`rounded-2xl border-2 p-3 text-center transition-all duration-200 ${
                                isSelected
                                  ? `${opt.color} border-current scale-[1.02]`
                                  : disabled
                                  ? "border-border bg-muted/40 text-muted-foreground opacity-60 cursor-not-allowed"
                                  : `${opt.color} hover:scale-[1.02]`
                              }`}
                            >
                              <div className="text-2xl leading-none mb-1">{opt.emoji}</div>
                              <div className="text-xs font-medium">{opt.label}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

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
                    {userId && messageOwnerId && userId !== messageOwnerId && (
                      <StartConversationButton
                        currentUserId={userId}
                        otherUserId={messageOwnerId}
                        voiceMessageId={messageId || undefined}
                        className="rounded-full px-4 transition-all duration-300 hover:bg-blue-100 hover:text-blue-600"
                      />
                    )}
                    {userId && messageId && messageOwnerId && userId !== messageOwnerId && (
                      <ReportMessageDialog
                        voiceMessageId={messageId}
                        reporterId={userId}
                      />
                    )}
                  </div>
                </div>
              </div>

              <Button
                onClick={fetchMessage}
                disabled={loading || ratingRequired}
                className="w-full rounded-xl bg-gradient-to-r from-accent via-secondary to-accent hover:opacity-90 shadow-md hover:shadow-lg transition-all duration-300"
                title={ratingRequired ? "Please rate this message first" : undefined}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                {ratingRequired ? "Rate to continue" : "Hear Another Message"}
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
    </>
  );
};

export default MessagePlayer;
