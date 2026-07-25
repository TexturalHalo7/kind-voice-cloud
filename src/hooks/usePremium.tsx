import { ReactNode } from "react";

// Premium tier has been removed — the app is fully free.
// This hook remains as a compatibility shim so existing callers keep working
// and every feature is unlocked for every user.
interface PremiumState {
  premium: boolean;
  plan: "monthly" | "lifetime" | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export const PremiumProvider = ({ children }: { children: ReactNode }) => <>{children}</>;

export const usePremium = (): PremiumState => ({
  premium: true,
  plan: null,
  loading: false,
  refresh: async () => {},
});