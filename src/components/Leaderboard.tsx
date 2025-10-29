import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LeaderboardEntry {
  username: string;
  message_count: number;
}

const Leaderboard = () => {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, message_count")
        .order("message_count", { ascending: false })
        .limit(10);

      if (!error && data) {
        setLeaders(data);
      }
      setLoading(false);
    };

    fetchLeaderboard();

    // Set up real-time subscription
    const channel = supabase
      .channel("leaderboard-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Award className="w-5 h-5 text-orange-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-semibold text-muted-foreground">#{index + 1}</span>;
  };

  return (
    <Card className="shadow-glow bg-white/95 backdrop-blur-sm animate-in fade-in slide-in-from-bottom duration-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" />
          Top Kindness Spreaders
        </CardTitle>
        <CardDescription>
          Celebrating those who share the most positivity
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : leaders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No leaders yet. Be the first to share!
          </div>
        ) : (
          <div className="space-y-3">
            {leaders.map((leader, index) => (
              <div
                key={leader.username}
                className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex-shrink-0">{getIcon(index)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{leader.username}</p>
                </div>
                <div className="flex-shrink-0">
                  <span className="text-sm font-medium text-primary">
                    {leader.message_count} {leader.message_count === 1 ? "message" : "messages"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Leaderboard;
