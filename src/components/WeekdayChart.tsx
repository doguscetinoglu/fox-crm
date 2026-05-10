"use client";

interface Item { day: string; count: number; }

export default function WeekdayChart({ data }: { data: Item[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const colors = ["bg-gray-600", "bg-emerald-600", "bg-emerald-600", "bg-emerald-600", "bg-emerald-600", "bg-emerald-600", "bg-gray-600"];

  return (
    <div className="flex items-end gap-2 h-16">
      {data.map((d, i) => {
        const pct = (d.count / max) * 100;
        return (
          <div key={d.day} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div
              className={`w-full ${colors[i] ?? "bg-emerald-600"} hover:brightness-125 rounded-t transition-all duration-500 cursor-default`}
              style={{ height: `${Math.max(pct, 4)}%` }}
            />
            <span className="text-[10px] text-gray-500">{d.day}</span>
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-gray-200 text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-10">
              {d.count}
            </div>
          </div>
        );
      })}
    </div>
  );
}
