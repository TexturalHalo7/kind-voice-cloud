export interface AvatarOption {
  id: string;
  emoji: string;
  label: string;
  bg: string; // tailwind bg class
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

export const getAvatar = (id?: string | null): AvatarOption =>
  AVATARS.find((a) => a.id === id) || AVATARS[0];