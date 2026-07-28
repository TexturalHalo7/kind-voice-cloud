import { cn } from "@/lib/utils";

interface AudioWaveformProps {
  data?: number[];
  isPlaying?: boolean;
  barCount?: number;
  className?: string;
  barClassName?: string;
}

const AudioWaveform = ({
  data,
  isPlaying,
  barCount = 12,
  className,
  barClassName,
}: AudioWaveformProps) => {
  const active = !!data && data.length > 0;
  const bars = active ? data.slice(0, barCount) : Array.from({ length: barCount }, () => 0);

  return (
    <div className={cn("flex items-end justify-center gap-1 h-16", className)} aria-hidden="true">
      {bars.map((value, i) => {
        const scale = active ? Math.max(0.05, Math.min(1, (value as number) / 255)) : undefined;
        return (
          <span
            key={i}
            className={cn(
              "w-1.5 rounded-full bg-primary/80 origin-bottom h-full transition-transform duration-100 ease-out",
              !active && isPlaying && `animate-wave-${(i % 4) + 1}`,
              !active && !isPlaying && "scale-y-[0.15]",
              barClassName
            )}
            style={active ? { transform: `scaleY(${scale})` } : undefined}
          />
        );
      })}
    </div>
  );
};

export default AudioWaveform;
