import { getAvatar } from "@/lib/avatars";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  avatarId?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: "w-8 h-8 text-base",
  md: "w-10 h-10 text-xl",
  lg: "w-16 h-16 text-3xl",
  xl: "w-24 h-24 text-5xl",
};

const UserAvatar = ({ avatarId, size = "md", className }: UserAvatarProps) => {
  const avatar = getAvatar(avatarId);
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center shrink-0",
        avatar.bg,
        sizeMap[size],
        className
      )}
      aria-label={avatar.label}
    >
      <span>{avatar.emoji}</span>
    </div>
  );
};

export default UserAvatar;