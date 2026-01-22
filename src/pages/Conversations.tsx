import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Heart, LogOut, MessageCircle, ArrowLeft, Search } from "lucide-react";
import ConversationList from "@/components/ConversationList";
import ConversationChat from "@/components/ConversationChat";
import UserSearch from "@/components/UserSearch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Conversations = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    searchParams.get("id")
  );

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
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
            <Button
              onClick={() => navigate("/dashboard")}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <MessageCircle className="w-8 h-8 text-white" />
            <h1 className="text-2xl font-bold text-white">Messages</h1>
          </div>
          <div className="flex items-center gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Find Users
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Search Users</DialogTitle>
                </DialogHeader>
                <UserSearch currentUserId={user?.id || ""} />
              </DialogContent>
            </Dialog>
            <Button
              onClick={() => navigate("/dashboard")}
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              <Heart className="w-4 h-4 mr-2" fill="currentColor" />
              Dashboard
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

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto bg-white/95 backdrop-blur-sm rounded-2xl shadow-glow overflow-hidden min-h-[600px]">
          <div className="grid md:grid-cols-3 h-full min-h-[600px]">
            {/* Conversation List */}
            <div className={`md:border-r border-border ${selectedConversationId ? 'hidden md:block' : ''}`}>
              <ConversationList
                userId={user?.id || ""}
                selectedConversationId={selectedConversationId}
                onSelectConversation={setSelectedConversationId}
              />
            </div>

            {/* Chat Area */}
            <div className={`md:col-span-2 ${!selectedConversationId ? 'hidden md:flex' : ''}`}>
              {selectedConversationId ? (
                <ConversationChat
                  conversationId={selectedConversationId}
                  userId={user?.id || ""}
                  onBack={() => setSelectedConversationId(null)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <MessageCircle className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground">
                    Select a conversation
                  </h3>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Choose a conversation from the list to start chatting
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Conversations;
