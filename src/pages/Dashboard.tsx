import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Heart, LogOut, Sparkles, Star, User as UserIcon, Flame, BookHeart, MessageCircle } from "lucide-react";
import AudioRecorder from "@/components/AudioRecorder";
import RandomMessagePlayer from "@/components/RandomMessagePlayer";
import Leaderboard from "@/components/Leaderboard";
import GlobalCounter from "@/components/GlobalCounter";
import NotificationBell from "@/components/NotificationBell";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();
      
      setProfile(profileData);
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT") {
          navigate("/auth");
        } else if (session) {
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  const getBadge = (count: number) => {
    if (count >= 250) {
      return { stars: 1, color: "text-yellow-400", label: "Gold Star" };
    } else if (count >= 100) {
      return { stars: 2, color: "text-white", label: "2 Stars" };
    } else if (count >= 50) {
      return { stars: 1, color: "text-white", label: "1 Star" };
    }
    return null;
  };

  const badge = getBadge(profile?.message_count || 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="animate-pulse text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-white" fill="currentColor" />
            <h1 className="text-2xl font-bold text-white">Voices of Kindness</h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Streak Badge */}
            {profile?.streak_count > 0 && (
              <div className="flex items-center gap-1 bg-orange-500/20 px-3 py-1 rounded-full" title="Daily Streak">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-orange-300 font-semibold text-sm">{profile.streak_count}</span>
              </div>
            )}
            
            <div className="text-white/90 text-sm">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => navigate("/profile")}
                  className="font-semibold hover:underline cursor-pointer"
                >
                  {profile?.username}
                </button>
                {badge && (
                  <div className="flex items-center gap-0.5" title={badge.label}>
                    {Array.from({ length: badge.stars }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${badge.color}`} fill="currentColor" />
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-white/70">
                {profile?.message_count || 0} messages shared
              </p>
            </div>
            
            <Button
              onClick={() => navigate("/profile")}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              title="My Profile"
            >
              <UserIcon className="w-5 h-5" />
            </Button>
            
            {user && <NotificationBell userId={user.id} />}
            
            <Button
              onClick={() => navigate("/favorites")}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              title="My Favorites"
            >
              <BookHeart className="w-5 h-5" />
            </Button>

            <Button
              onClick={() => navigate("/conversations")}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              title="Messages"
            >
              <MessageCircle className="w-5 h-5" />
            </Button>
            
            <Button
              onClick={handleLogout}
              variant="secondary"
              size="sm"
              className="rounded-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 space-y-12">
        {/* Welcome Message */}
        <div className="text-center space-y-4 animate-in fade-in slide-in-from-top duration-700">
          <div className="flex justify-center gap-2">
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Spread Some Joy Today
            </h2>
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
          </div>
          <p className="text-white/90 text-lg max-w-2xl mx-auto">
            Your voice has the power to brighten someone's day. Record a kind message or
            listen to one when you need encouragement.
          </p>
        </div>

        {/* Main Actions Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <AudioRecorder userId={user?.id || ""} />
          <RandomMessagePlayer userId={user?.id} />
        </div>

        {/* Stats Section */}
        <div className="max-w-5xl mx-auto space-y-8">
          <GlobalCounter />
          <Leaderboard />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-white/70 text-sm">
        <p>Made with ❤️ to spread positivity around the world</p>
      </footer>
    </div>
  );
};

export default Dashboard;