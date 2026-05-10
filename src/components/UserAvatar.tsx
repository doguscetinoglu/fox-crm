const COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-600",
  purple: "bg-purple-600",
  green: "bg-emerald-600",
  pink: "bg-pink-600",
  orange: "bg-orange-500",
  indigo: "bg-indigo-600",
};

interface Props {
  name: string;
  color?: string;
  size?: "sm" | "md" | "lg";
}

export default function UserAvatar({ name, color = "indigo", size = "md" }: Props) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const bg = COLOR_MAP[color] ?? "bg-indigo-600";
  const sz = size === "sm" ? "w-7 h-7 text-xs" : size === "lg" ? "w-10 h-10 text-base" : "w-8 h-8 text-sm";
  return (
    <div className={`${sz} ${bg} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}>
      {initials}
    </div>
  );
}
