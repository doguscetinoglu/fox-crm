const STATUS: Record<string, string> = {
  "Yeni":        "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 ring-1 ring-violet-300 dark:ring-violet-500/30",
  "İnceleniyor": "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-500/30",
  "Yanıtlandı":  "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-300 dark:ring-emerald-500/30",
  "Kapalı":      "bg-slate-100 dark:bg-gray-700/40 text-slate-500 dark:text-gray-400 ring-1 ring-slate-200 dark:ring-gray-600/30",
};

const STATUS_DOT: Record<string, string> = {
  "Yeni":        "bg-violet-500",
  "İnceleniyor": "bg-amber-500",
  "Yanıtlandı":  "bg-emerald-500",
  "Kapalı":      "bg-slate-400 dark:bg-gray-500",
};

const PRIORITY: Record<string, string> = {
  "Düşük":  "bg-slate-100 dark:bg-gray-700/40 text-slate-500 dark:text-gray-400",
  "Normal": "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300",
  "Yüksek": "bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300",
  "Kritik": "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS[status] ?? "bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-gray-400"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status] ?? "bg-slate-400"}`} />
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${PRIORITY[priority] ?? "bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-gray-400"}`}>
      {priority}
    </span>
  );
}
