import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Heart, Trash2, Crown } from "lucide-react";
import { usePremium } from "@/hooks/usePremium";

interface FavoriteMessage {
  id: string;
  voice_message_id: string;
  created_at: string;
  voice_messages: {
    audio_url: string;
    category: string;
    thanks_count: number;
    profiles: {
      username: string;
    };
  };
}

const Favorites = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);
      await fetchFavorites(session.user.id);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT") {
          navigate("/auth");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchFavorites = async (uid: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("favorites")
        .select(`
          id,
          voice_message_id,
          created_at,
          voice_messages (
            audio_url,
            category,
            thanks_count,
            profiles (username)
          )
        `)
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFavorites((data as any) || []);
    } catch (error: any) {
      toast.error("Failed to load favorites");
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", favoriteId);

      if (error) throw error;
      
      setFavorites(favorites.filter(f => f.id !== favoriteId));
      toast.success("Removed from favorites");
    } catch (error: any) {
      toast.error("Failed to remove favorite");
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "encouragement": return "bg-blue-500/20 text-blue-700";
      case "gratitude": return "bg-green-500/20 text-green-700";
      case "motivation": return "bg-orange-500/20 text-orange-700";
      default: return "bg-purple-500/20 text-purple-700";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="animate-pulse text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-white" fill="currentColor" />
            <h1 className="text-2xl font-bold text-white">My Favorites</h1>
          </div>
          <Button
            onClick={() => navigate("/dashboard")}
            variant="secondary"
            size="sm"
            className="rounded-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        {favorites.length === 0 ? (
          <Card className="shadow-glow bg-white/95 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No favorites yet</h3>
              <p className="text-muted-foreground mb-4">
                Save messages you love while listening to replay them anytime!
              </p>
              <Button onClick={() => navigate("/dashboard")} className="bg-gradient-warm">
                Discover Messages
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {favorites.map((fav) => (
              <Card key={fav.id} className="shadow-glow bg-white/95 backdrop-blur-sm">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-primary">
                          {fav.voice_messages?.profiles?.username || "Anonymous"}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(fav.voice_messages?.category || "general")}`}>
                          {fav.voice_messages?.category || "general"}
                        </span>
                      </div>
                      <audio
                        src={fav.voice_messages?.audio_url}
                        controls
                        className="w-full rounded-xl"
                      />
                    </div>
                    <Button
                      onClick={() => removeFavorite(fav.id)}
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Favorites;