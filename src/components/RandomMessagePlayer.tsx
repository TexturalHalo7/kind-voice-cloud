import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, RefreshCw, Sparkles, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const RandomMessagePlayer = () => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState<string>("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const a = audioRef.current;
    if (a) {
      a.muted = false;
      a.volume = 1;
    }
  }, [audioUrl]);

  const fetchRandomMessage = async () => {
    setLoading(true);

    try {
      // Get random message using SQL function would be better, but for simplicity:
      const { data: messages, error } = await supabase
        .from("voice_messages")
        .select(`
          *,
          profiles!inner(username)
        `)
        .limit(50);

      if (error) throw error;

      if (!messages || messages.length === 0) {
        toast.error("No messages available yet. Be the first to share!");
        setLoading(false);
        return;
      }

      // Pick random message
      const randomIndex = Math.floor(Math.random() * messages.length);
      const randomMessage = messages[randomIndex];

      setAudioUrl(randomMessage.audio_url);
      setUsername((randomMessage.profiles as any).username);
      toast.success("Here's a message of kindness for you! 💝");
    } catch (error: any) {
      toast.error("Failed to fetch message: " + error.message);
    } finally {
      setLoading(false);
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
                <p className="text-sm text-muted-foreground">From</p>
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
