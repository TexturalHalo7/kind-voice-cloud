export interface AvatarOption {
  id: string;
  emoji: string;
  label: string;
  bg: string; // tailwind bg class
  premium?: boolean;
}

export const AVATARS: AvatarOption[] = [
  { id: "sun", emoji: "☀️", label: "Sun", bg: "bg-yellow-200" },
  { id: "moon", emoji: "🌙", label: "Moon", bg: "bg-indigo-200" },
  { id: "star", emoji: "⭐", label: "Star", bg: "bg-amber-200" },
  { id: "heart", emoji: "💖", label: "Heart", bg: "bg-pink-200" },
  { id: "flower", emoji: "🌸", label: "Flower", bg: "bg-rose-200" },
  { id: "cloud", emoji: "☁️", label: "Cloud", bg: "bg-sky-200" },
  { id: "rainbow", emoji: "🌈", label: "Rainbow", bg: "bg-purple-200" },
  { id: "leaf", emoji: "🍃", label: "Leaf", bg: "bg-green-200" },
  { id: "ocean", emoji: "🌊", label: "Ocean", bg: "bg-cyan-200" },
  { id: "fire", emoji: "🔥", label: "Fire", bg: "bg-orange-200" },
  { id: "cat", emoji: "🐱", label: "Cat", bg: "bg-amber-100" },
  { id: "dog", emoji: "🐶", label: "Dog", bg: "bg-yellow-100" },
  { id: "fox", emoji: "🦊", label: "Fox", bg: "bg-orange-100" },
  { id: "panda", emoji: "🐼", label: "Panda", bg: "bg-slate-200" },
  { id: "owl", emoji: "🦉", label: "Owl", bg: "bg-stone-200" },
  { id: "bunny", emoji: "🐰", label: "Bunny", bg: "bg-pink-100" },
  { id: "bear", emoji: "🐻", label: "Bear", bg: "bg-amber-200" },
  { id: "koala", emoji: "🐨", label: "Koala", bg: "bg-gray-200" },
  { id: "butterfly", emoji: "🦋", label: "Butterfly", bg: "bg-violet-200" },
  { id: "sparkles", emoji: "✨", label: "Sparkles", bg: "bg-yellow-100" },
];

export const PREMIUM_AVATARS: AvatarOption[] = [
  { id: "p_galaxy", emoji: "🌌", label: "Galaxy", bg: "bg-gradient-to-br from-indigo-400 to-purple-600", premium: true },
  { id: "p_unicorn", emoji: "🦄", label: "Unicorn", bg: "bg-gradient-to-br from-pink-300 to-violet-400", premium: true },
  { id: "p_dragon", emoji: "🐲", label: "Dragon", bg: "bg-gradient-to-br from-emerald-400 to-teal-600", premium: true },
  { id: "p_crown", emoji: "👑", label: "Crown", bg: "bg-gradient-to-br from-yellow-300 to-amber-500", premium: true },
  { id: "p_phoenix", emoji: "🔥", label: "Phoenix", bg: "bg-gradient-to-br from-orange-400 to-red-500", premium: true },
  { id: "p_diamond", emoji: "💎", label: "Diamond", bg: "bg-gradient-to-br from-cyan-300 to-sky-500", premium: true },
  { id: "p_wizard", emoji: "🧙", label: "Wizard", bg: "bg-gradient-to-br from-purple-400 to-fuchsia-600", premium: true },
  { id: "p_rocket", emoji: "🚀", label: "Rocket", bg: "bg-gradient-to-br from-slate-700 to-indigo-800", premium: true },
  { id: "p_comet", emoji: "☄️", label: "Comet", bg: "bg-gradient-to-br from-blue-400 to-purple-500", premium: true },
  { id: "p_aurora", emoji: "🌠", label: "Aurora", bg: "bg-gradient-to-br from-teal-300 via-emerald-300 to-purple-400", premium: true },
  { id: "p_lotus", emoji: "🪷", label: "Lotus", bg: "bg-gradient-to-br from-rose-300 to-pink-500", premium: true },
  { id: "p_trophy", emoji: "🏆", label: "Trophy", bg: "bg-gradient-to-br from-amber-300 to-yellow-600", premium: true },
];

export const ALL_AVATARS: AvatarOption[] = [...AVATARS, ...PREMIUM_AVATARS];

export const getAvatar = (id?: string | null): AvatarOption =>
  ALL_AVATARS.find((a) => a.id === id) || ALL_AVATARS[0];

export const isPremiumAvatar = (id?: string | null): boolean =>
  !!PREMIUM_AVATARS.find((a) => a.id === id);