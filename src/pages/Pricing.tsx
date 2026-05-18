import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Check, Heart, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { usePremium } from "@/hooks/usePremium";

const features = [
  "Add background sounds to your recordings",
  "Save unlimited messages to Favorites",
  "Unlock the Premium avatar pack",
  "Support a kind, ad-free community",
];

const Pricing = () => {
  const navigate = useNavigate();
  const { premium, plan } = usePremium();
  const [loading, setLoading] = useState<"monthly" | "lifetime" | null>(null);

  const startCheckout = async (kind: "monthly" | "lifetime") => {
    setLoading(kind);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in first");
        navigate("/auth");
        return;
      }
      const fn = kind === "monthly" ? "create-checkout" : "create-lifetime-payment";
      const { data, error } = await supabase.functions.invoke(fn);
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (e: any) {
      toast.error(e.message || "Could not start checkout");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-white" fill="currentColor" />
            <h1 className="text-2xl font-bold text-white">Premium</h1>
          </div>
          <Button onClick={() => navigate("/dashboard")} variant="secondary" size="sm" className="rounded-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-10 text-white">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold">Voices of Kindness Premium</span>
          </div>
          <h2 className="text-4xl font-bold mb-3">Unlock the full experience</h2>
          <p className="text-white/90 max-w-xl mx-auto">
            Premium adds little touches that make sharing kindness even more delightful.
          </p>
        </div>

        {premium && (
          <Card className="mb-6 bg-green-50 border-green-300">
            <CardContent className="py-4 text-center text-green-800 font-medium">
              You're already a Premium member ({plan === "lifetime" ? "Lifetime" : "Monthly"}) — thank you! 💚
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-glow bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Monthly</CardTitle>
              <CardDescription>Cancel anytime</CardDescription>
              <div className="mt-2">
                <span className="text-4xl font-bold text-primary">$4</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full rounded-xl bg-primary"
                onClick={() => startCheckout("monthly")}
                disabled={!!loading || premium}
              >
                {loading === "monthly" ? "Opening checkout..." : premium ? "You have Premium" : "Subscribe"}
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-glow bg-white/95 backdrop-blur-sm border-2 border-primary relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
              BEST VALUE
            </div>
            <CardHeader>
              <CardTitle>Lifetime</CardTitle>
              <CardDescription>Pay once, keep forever</CardDescription>
              <div className="mt-2">
                <span className="text-4xl font-bold text-primary">$27</span>
                <span className="text-muted-foreground"> one-time</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
                <li className="flex items-start gap-2 text-sm font-medium">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>Pays for itself after 7 months</span>
                </li>
              </ul>
              <Button
                className="w-full rounded-xl bg-primary"
                onClick={() => startCheckout("lifetime")}
                disabled={!!loading || premium}
              >
                {loading === "lifetime" ? "Opening checkout..." : premium ? "You have Premium" : "Unlock lifetime"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Pricing;