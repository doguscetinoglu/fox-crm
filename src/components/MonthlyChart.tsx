"use client";

const TR_MONTHS: Record<string, string> = {
  "01": "Oca", "02": "Şub", "03": "Mar", "04": "Nis",
  "05": "May", "06": "Haz", "07": "Tem", "08": "Ağu",
  "09": "Eyl", "10": "Eki", "11": "Kas", "12": "Ara",
};

interface Item { month: string; count: number; }

export default function MonthlyChart({ data }: { data: Item[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-2 h-24">
      {data.map((d) => {
        const pct = (d.count / max) * 100;
        const [, mm] = d.month.split("-");
        return (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-1.5 group relative">
            <span className="text-xs font-bold text-gray-300 absolute -top-5">{d.count || ""}</span>
            <div
              className="w-full bg-violet-600/70 hover:bg-violet-500 rounded-t transition-all duration-500 cursor-default"
              style={{ height: `${Math.max(pct, 4)}%` }}
            />
            <span className="text-[10px] text-gray-500">{TR_MONTHS[mm] ?? mm}</span>
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-gray-200 text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-10">
              {d.count} ticket
            </div>
          </div>
        );
      })}
    </div>
  );
}
