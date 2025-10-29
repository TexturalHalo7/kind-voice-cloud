import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles, Users, Globe } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center space-y-8">
        <div className="animate-in fade-in slide-in-from-top duration-1000 space-y-6">
          <div className="flex justify-center">
            <div className="bg-white/20 p-6 rounded-full shadow-glow backdrop-blur-sm">
              <Heart className="w-20 h-20 text-white animate-pulse" fill="currentColor" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-lg leading-tight">
            Voices of Kindness
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto flex items-center justify-center gap-3 flex-wrap">
            <Sparkles className="w-6 h-6" />
            Send a smile. Hear a smile.
            <Sparkles className="w-6 h-6" />
          </p>

          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            A heartwarming platform where people from all over the world share kind, 
            happy, and encouraging voice messages to brighten each other's day.
          </p>

          <div className="flex gap-4 justify-center pt-8">
            <Button
              onClick={() => navigate("/auth")}
              size="lg"
              className="bg-white text-primary hover:bg-white/90 shadow-glow rounded-full px-8 h-14 text-lg font-semibold"
            >
              Get Started Free
            </Button>
            <Button
              onClick={() => navigate("/auth")}
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10 rounded-full px-8 h-14 text-lg font-semibold backdrop-blur-sm"
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-glow text-center space-y-4 animate-in fade-in slide-in-from-left duration-700">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold">Share Kindness</h3>
            <p className="text-muted-foreground">
              Record and share uplifting voice messages with people around the world
            </p>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-glow text-center space-y-4 animate-in fade-in slide-in-from-bottom duration-700 delay-150">
            <div className="bg-secondary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-8 h-8 text-secondary-foreground" />
            </div>
            <h3 className="text-2xl font-bold">Brighten Days</h3>
            <p className="text-muted-foreground">
              Listen to random messages of encouragement whenever you need a boost
            </p>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-glow text-center space-y-4 animate-in fade-in slide-in-from-right duration-700 delay-300">
            <div className="bg-accent/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <Globe className="w-8 h-8 text-accent-foreground" />
            </div>
            <h3 className="text-2xl font-bold">Global Impact</h3>
            <p className="text-muted-foreground">
              Join a growing movement of positivity spreading across the planet
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-12 shadow-glow max-w-3xl mx-auto space-y-6">
          <h2 className="text-4xl font-bold">Ready to Spread Kindness?</h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of people making the world a little brighter, one voice message at a time.
          </p>
          <Button
            onClick={() => navigate("/auth")}
            size="lg"
            className="bg-gradient-warm hover:opacity-90 shadow-soft rounded-full px-12 h-14 text-lg font-semibold"
          >
            Start Sharing Joy Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-white/70 text-sm">
        <p>Made with ❤️ to spread positivity around the world</p>
      </footer>
    </div>
  );
};

export default Index;
