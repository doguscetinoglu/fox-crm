"use client";

interface Day { date: string; count: number; }

export default function DailyChart({ data }: { data: Day[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const days = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

  return (
    <div className="flex items-end gap-1.5 h-20">
      {data.map((d) => {
        const pct = (d.count / max) * 100;
        const dayName = days[new Date(d.date).getDay()];
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div
              className="w-full bg-indigo-600/70 hover:bg-indigo-500 rounded-t-sm transition-all duration-300 cursor-default"
              style={{ height: `${Math.max(pct, 4)}%` }}
            />
            <span className="text-[10px] text-gray-600">{dayName}</span>
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-gray-200 text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
              {d.count} ticket
            </div>
          </div>
        );
      })}
    </div>
  );
}
