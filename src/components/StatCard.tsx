"use client";

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  accent?: string;
  icon?: string;
}

export default function StatCard({ label, value, sub, accent = "bg-gray-800", icon }: StatCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold text-gray-100 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        {icon && (
          <div className={`w-10 h-10 rounded-xl ${accent} flex items-center justify-center text-xl`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
