import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { usePremium } from "@/hooks/usePremium";

const PremiumSuccess = () => {
  const navigate = useNavigate();
  const { refresh } = usePremium();

  useEffect(() => {
    // Stripe may take a moment; refresh a couple times
    refresh();
    const t1 = setTimeout(refresh, 2500);
    const t2 = setTimeout(refresh, 6000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [refresh]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <Card className="shadow-glow bg-white/95 backdrop-blur-sm max-w-md w-full">
        <CardContent className="py-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Welcome to Premium! ✨</h1>
          <p className="text-muted-foreground">
            Your payment was received. Background sounds, favorites, and the premium avatar pack are now unlocked.
          </p>
          <Button className="bg-primary rounded-xl w-full" onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => navigate("/profile")}>
            Pick a premium avatar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PremiumSuccess;