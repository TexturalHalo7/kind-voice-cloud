import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Award, MessageCircle, Flame, ThumbsUp, Heart, Headphones, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type TierName = "Bronze" | "Silver" | "Gold" | "Diamond";

interface AchievementDef {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  unit: string;
  tiers: [number, number, number, number];
  getValue: (p: any) => number;
}

const ACHIEVEMENTS: AchievementDef[] = [
  {
    key: "messages",
    label: "Kindness Sender",
    description: "Send voice messages to spread kindness.",
    icon: MessageCircle,
    unit: "messages sent",
    tiers: [1, 20, 80, 500],
    getValue: (p) => p?.message_count || 0,
  },
  {
    key: "thanks",
    label: "Heartwarmer",
    description: "Receive likes from listeners.",
    icon: Heart,
    unit: "likes received",
    tiers: [1, 50, 80, 400],
    getValue: (p) => p?.total_thanks_received || 0,
  },
  {
    key: "general",
    label: "Positivity Spreader",
    description: "Send general positivity voice messages.",
    icon: Sparkles,
    unit: "positivity messages sent",
    tiers: [1, 20, 60, 300],
    getValue: (p) => p?.general_count || 0,
  },
  {
    key: "likesGiven",
    label: "Generous Listener",
    description: "Give likes to voice messages you enjoyed.",
    icon: ThumbsUp,
    unit: "likes given",
    tiers: [1, 20, 100, 500],
    getValue: (p) => p?.likes_given || 0,
  },
  {
    key: "listened",
    label: "Attentive Ear",
    description: "Listen to voice messages from the community.",
    icon: Headphones,
    unit: "messages listened to",
    tiers: [1, 20, 100, 500],
    getValue: (p) => p?.listened_count || 0,
  },
  {
    key: "streak",
    label: "Streak Keeper",
    description: "Keep your daily recording streak going.",
    icon: Flame,
    unit: "day streak",
    tiers: [1, 7, 30, 100],
    getValue: (p) => p?.streak_count || 0,
  },
];

const TIER_STYLES: Record<TierName | "locked", { ring: string; bg: string; icon: string; label: string }> = {
  locked: { ring: "ring-muted", bg: "bg-muted", icon: "text-muted-foreground", label: "text-muted-foreground" },
  Bronze: { ring: "ring-amber-600/50", bg: "bg-amber-100", icon: "text-amber-700", label: "text-amber-700" },
  Silver: { ring: "ring-slate-400/60", bg: "bg-slate-100", icon: "text-slate-500", label: "text-slate-600" },
  Gold: { ring: "ring-yellow-400/70", bg: "bg-yellow-100", icon: "text-yellow-600", label: "text-yellow-700" },
  Diamond: { ring: "ring-cyan-400/70", bg: "bg-cyan-100", icon: "text-cyan-600", label: "text-cyan-700" },
};

const TIER_NAMES: TierName[] = ["Bronze", "Silver", "Gold", "Diamond"];

function getTier(value: number, tiers: [number, number, number, number]): { current: TierName | null; nextIndex: number | null } {
  let current: TierName | null = null;
  for (let i = 0; i < tiers.length; i++) {
    if (value >= tiers[i]) current = TIER_NAMES[i];
  }
  const nextIndex = tiers.findIndex((t) => value < t);
  return { current, nextIndex: nextIndex === -1 ? null : nextIndex };
}

const Achievements = ({ profile }: { profile: any }) => {
  const [extra, setExtra] = useState<{ general_count: number; likes_given: number; listened_count: number }>({
    general_count: 0,
    likes_given: 0,
    listened_count: 0,
  });

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ count: generalCount }, { count: likesGiven }] = await Promise.all([
        supabase
          .from("voice_messages")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("category", "general"),
        supabase
          .from("message_thanks")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);
      const listened = parseInt(localStorage.getItem("listened_count") || "0", 10) || 0;
      setExtra({
        general_count: generalCount || 0,
        likes_given: likesGiven || 0,
        listened_count: listened,
      });
    };
    load();
  }, [profile]);

  const merged = { ...profile, ...extra };

  return (
    <Card className="shadow-glow bg-white/95 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          Achievements
        </CardTitle>
        <CardDescription>Hover over an achievement to see your progress</CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider delayDuration={100}>
          <div className="space-y-5">
            {ACHIEVEMENTS.map((a) => {
              const value = a.getValue(merged);
              const { current, nextIndex } = getTier(value, a.tiers);
              const Icon = a.icon;
              return (
                <div key={a.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-semibold">{a.label}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {current ? `${current} tier` : "Not yet unlocked"}
                    </p>
                  </div>
                  <div className="grid grid-cols-4 gap-2 w-full">
                    {a.tiers.map((threshold, i) => {
                      const tierName = TIER_NAMES[i];
                      const unlocked = value >= threshold;
                      const style = unlocked ? TIER_STYLES[tierName] : TIER_STYLES.locked;
                      const remaining = Math.max(0, threshold - value);
                      const nextTierLabel =
                        nextIndex !== null && i === nextIndex
                          ? `${remaining} more ${a.unit} to reach ${tierName}`
                          : unlocked
                          ? `Unlocked at ${threshold} ${a.unit}`
                          : `Requires ${threshold} ${a.unit}`;
                      return (
                        <Tooltip key={i}>
                          <TooltipTrigger asChild>
                            <div
                              className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all cursor-help ring-1 ${style.ring} ${style.bg} ${
                                unlocked ? "hover:scale-105" : "grayscale opacity-70"
                              }`}
                            >
                              <Icon className={`w-4 h-4 ${style.icon}`} />
                              <span className={`text-[9px] font-semibold ${style.label}`}>{tierName}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[220px]">
                            <p className="font-semibold">{a.label} — {tierName}</p>
                            <p className="text-xs opacity-80">{a.description}</p>
                            <p className="text-xs mt-1">{nextTierLabel}</p>
                            <p className="text-xs opacity-70">Current: {value} {a.unit}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};

export default Achievements;