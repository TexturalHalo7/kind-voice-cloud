import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const GlobalCounter = () => {
  const [totalMessages, setTotalMessages] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTotal = async () => {
      const { count, error } = await supabase
        .from("voice_messages")
        .select("*", { count: "exact", head: true });

      if (!error && count !== null) {
        setTotalMessages(count);
      }
      setLoading(false);
    };

    fetchTotal();

    // Real-time updates
    const channel = supabase
      .channel("message-counter")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "voice_messages",
        },
        () => {
          setTotalMessages((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Card className="shadow-glow bg-gradient-warm border-none text-white animate-in fade-in slide-in-from-bottom duration-700">
      <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
        <Heart className="w-16 h-16 animate-pulse" fill="currentColor" />
        <div className="text-center space-y-2">
          <p className="text-sm uppercase tracking-wider opacity-90">
            Messages of Kindness Shared Worldwide
          </p>
          {loading ? (
            <p className="text-6xl font-bold">...</p>
          ) : (
            <p className="text-6xl md:text-7xl font-bold animate-in zoom-in duration-500">
              {totalMessages.toLocaleString()}
            </p>
          )}
          <p className="text-sm opacity-90">
            And growing every moment 💖
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GlobalCounter;
