import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Award, MessageCircle, Flame, ThumbsUp, Calendar } from "lucide-react";

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
    tiers: [10, 50, 100, 250],
    getValue: (p) => p?.message_count || 0,
  },
  {
    key: "monthly",
    label: "Monthly Star",
    description: "Send voice messages this month.",
    icon: Calendar,
    unit: "messages this month",
    tiers: [5, 20, 50, 100],
    getValue: (p) => p?.monthly_message_count || 0,
  },
  {
    key: "streak",
    label: "Streak Keeper",
    description: "Keep your daily recording streak going.",
    icon: Flame,
    unit: "day streak",
    tiers: [3, 7, 30, 100],
    getValue: (p) => p?.streak_count || 0,
  },
  {
    key: "thanks",
    label: "Heartwarmer",
    description: "Receive thanks from listeners.",
    icon: ThumbsUp,
    unit: "thanks received",
    tiers: [5, 25, 100, 500],
    getValue: (p) => p?.total_thanks_received || 0,
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
          <div className="space-y-6">
            {ACHIEVEMENTS.map((a) => {
              const value = a.getValue(profile);
              const { current, nextIndex } = getTier(value, a.tiers);
              const Icon = a.icon;
              return (
                <div key={a.key}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold">{a.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {current ? `${current} tier` : "Not yet unlocked"}
                    </p>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
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
                              className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-help ring-1 ${style.ring} ${style.bg} ${
                                unlocked ? "hover:scale-105" : "grayscale opacity-70"
                              }`}
                            >
                              <Icon className={`w-6 h-6 ${style.icon}`} />
                              <span className={`text-[10px] font-semibold ${style.label}`}>{tierName}</span>
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