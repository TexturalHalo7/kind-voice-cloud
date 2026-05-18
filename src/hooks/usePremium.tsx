import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PremiumState {
  premium: boolean;
  plan: "monthly" | "lifetime" | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const PremiumContext = createContext<PremiumState>({
  premium: false,
  plan: null,
  loading: true,
  refresh: async () => {},
});

export const PremiumProvider = ({ children }: { children: ReactNode }) => {
  const [premium, setPremium] = useState(false);
  const [plan, setPlan] = useState<"monthly" | "lifetime" | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setPremium(false);
        setPlan(null);
        return;
      }
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setPremium(!!data?.premium);
      setPlan(data?.plan ?? null);
    } catch (e) {
      console.error("check-subscription failed", e);
      setPremium(false);
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });
    return () => subscription.unsubscribe();
  }, [refresh]);

  return (
    <PremiumContext.Provider value={{ premium, plan, loading, refresh }}>
      {children}
    </PremiumContext.Provider>
  );
};

export const usePremium = () => useContext(PremiumContext);