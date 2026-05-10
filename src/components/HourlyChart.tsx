"use client";

interface Item { hour: number; count: number; }

export default function HourlyChart({ data }: { data: Item[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  // Show only 0-23 as compact bars
  return (
    <div className="flex items-end gap-0.5 h-16">
      {data.map((d) => {
        const pct = (d.count / max) * 100;
        const isWork = d.hour >= 9 && d.hour <= 18;
        return (
          <div key={d.hour} className="flex-1 flex flex-col items-center gap-0.5 group relative">
            <div
              className={`w-full rounded-sm transition-all ${isWork ? "bg-indigo-500/80 hover:bg-indigo-400" : "bg-gray-700/60 hover:bg-gray-600"}`}
              style={{ height: `${Math.max(pct, 3)}%` }}
            />
            {d.hour % 6 === 0 && (
              <span className="text-[9px] text-gray-600 absolute -bottom-4">{d.hour}:00</span>
            )}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-gray-200 text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-10">
              {d.hour}:00 — {d.count}
            </div>
          </div>
        );
      })}
    </div>
  );
}
