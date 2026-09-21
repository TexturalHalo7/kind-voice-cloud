import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Calendar, Flame, Heart, MessageCircle, Save, User as UserIcon, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { AVATARS, EXTRA_AVATARS } from "@/lib/avatars";
import UserAvatar from "@/components/UserAvatar";
import MyVoiceMessages from "@/components/MyVoiceMessages";
import Achievements from "@/components/Achievements";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState("");
  const [avatarId, setAvatarId] = useState<string>("sun");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();
      
      setProfile(profileData);
      setUsername(profileData?.username || "");
      setAvatarId(profileData?.avatar_id || "sun");
      setLoading(false);
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

  const handleSave = async () => {
    if (!username.trim()) {
      toast.error("Username cannot be empty");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ username: username.trim(), avatar_id: avatarId })
        .eq("user_id", user?.id);

      if (error) throw error;
      
      setProfile({ ...profile, username: username.trim(), avatar_id: avatarId });
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error("Failed to update profile: " + error.message);
    } finally {
      setSaving(false);
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
            <h1 className="text-2xl font-bold text-white">My Profile</h1>
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

      <main className="container mx-auto px-4 py-12 max-w-2xl space-y-6">
        {/* Edit Profile Card */}
        <Card className="shadow-glow bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-primary" />
              Edit Profile
            </CardTitle>
            <CardDescription>Update your display name</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-3">
              <UserAvatar avatarId={avatarId} size="xl" />
              <p className="text-sm font-medium text-muted-foreground">Choose your icon</p>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 w-full">
                {AVATARS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAvatarId(a.id)}
                    className={`aspect-square rounded-full flex items-center justify-center text-2xl transition-all ${a.bg} ${
                      avatarId === a.id
                        ? "ring-2 ring-primary ring-offset-2 scale-110"
                        : "hover:scale-105 opacity-80 hover:opacity-100"
                    }`}
                    aria-label={a.label}
                  >
                    {a.emoji}
                  </button>
                ))}
              </div>
              <div className="w-full pt-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    More icons
                  </p>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 w-full">
                  {EXTRA_AVATARS.map((a) => {
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setAvatarId(a.id)}
                        className={`relative aspect-square rounded-full flex items-center justify-center text-2xl transition-all ${a.bg} ${
                          avatarId === a.id
                            ? "ring-2 ring-primary ring-offset-2 scale-110"
                            : "hover:scale-105 opacity-90 hover:opacity-100"
                        }`}
                        aria-label={a.label}
                      >
                        {a.emoji}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="rounded-xl"
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={saving || (username === profile?.username && avatarId === profile?.avatar_id)}
              className="bg-gradient-warm hover:opacity-90 rounded-xl"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card className="shadow-glow bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Your Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-warm/10 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-primary">{profile?.total_thanks_received || 0}</p>
                <p className="text-sm text-muted-foreground">❤️ Lives Brightened</p>
              </div>
              <div className="bg-gradient-cool/10 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-accent">{profile?.message_count || 0}</p>
                <p className="text-sm text-muted-foreground">🎤 Messages Shared</p>
              </div>
              <div className="bg-orange-500/10 rounded-xl p-4 text-center col-span-2">
                <div className="flex items-center justify-center gap-1">
                  <Flame className="w-6 h-6 text-orange-500" />
                  <p className="text-3xl font-bold text-orange-500">{profile?.streak_count || 0}</p>
                </div>
                <p className="text-sm text-muted-foreground">🔥 Current Streak</p>
              </div>
            </div>
            <div className="mt-4 bg-primary/10 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-1">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-medium text-primary mt-1">
                {user?.created_at ? format(new Date(user.created_at), "MMM d, yyyy") : profile?.created_at ? format(new Date(profile.created_at), "MMM d, yyyy") : "N/A"}
              </p>
              <p className="text-sm text-muted-foreground">Joined</p>
            </div>
          </CardContent>
        </Card>


        {/* My Voice Messages */}
        {user && <MyVoiceMessages userId={user.id} />}

        {/* Achievements */}
        <Achievements profile={profile} />
      </main>
    </div>
  );
};

export default Profile;