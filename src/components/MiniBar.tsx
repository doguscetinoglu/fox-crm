"use client";

interface BarItem { label: string; count: number; }

export default function MiniBar({ data, color = "bg-indigo-500" }: { data: BarItem[]; color?: string }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="space-y-2.5">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="text-xs text-gray-400 w-20 shrink-0 truncate">{item.label}</span>
          <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${color} rounded-full transition-all duration-500`}
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
          <span className="text-xs font-bold text-gray-300 w-5 text-right">{item.count}</span>
        </div>
      ))}
    </div>
  );
}
