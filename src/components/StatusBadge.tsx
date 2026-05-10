const STATUS: Record<string, string> = {
  "Yeni": "bg-violet-500/20 text-violet-300 border-violet-500/30",
  "İnceleniyor": "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "Yanıtlandı": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "Kapalı": "bg-gray-700/40 text-gray-400 border-gray-600/30",
};

const PRIORITY: Record<string, string> = {
  "Düşük": "bg-gray-700/40 text-gray-400",
  "Normal": "bg-blue-500/20 text-blue-300",
  "Yüksek": "bg-orange-500/20 text-orange-300",
  "Kritik": "bg-red-500/20 text-red-300",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${STATUS[status] ?? "bg-gray-700 text-gray-400 border-gray-600"}`}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${PRIORITY[priority] ?? "bg-gray-700 text-gray-400"}`}>
      {priority}
    </span>
  );
}
