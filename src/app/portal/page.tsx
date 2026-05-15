"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import type { SessionUser } from "@/lib/session";

interface Attachment { url: string; name: string; size: number; type: string; }

interface Reply {
  id: number; body: string; isInternal: boolean; createdAt: string;
  user: { name: string; color: string } | null;
  attachments: Attachment[];
}

interface Ticket {
  id: number; subject: string; body: string; status: string; priority: string;
  category: string; receivedAt: string; updatedAt: string;
  assignee: { name: string; color: string } | null;
}

interface ProjTask { id: number; status: string; }
interface ProjStep { id: number; name: string; status: string; tasks: ProjTask[]; }
interface Project {
  id: number; name: string; description: string | null; status: string; createdAt: string;
  members: { user: { name: string; color: string } }[];
  steps: ProjStep[];
}
interface ProjMessage { id: number; userName: string | null; userType: string; body: string; createdAt: string; }

const PROJ_STATUS: Record<string, string> = {
  "Devam Ediyor": "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300",
  "Tamamlandı":   "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
  "Beklemede":    "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300",
  "İptal":        "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300",
};

function calcProgress(steps: ProjStep[]) {
  const all = steps.flatMap(s => s.tasks);
  if (!all.length) {
    if (!steps.length) return 0;
    return Math.round((steps.filter(s => s.status === "Tamamlandı").length / steps.length) * 100);
  }
  return Math.round((all.filter(t => t.status === "Tamamlandı").length / all.length) * 100);
}

function ProjectCard({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ProjMessage[]>([]);
  const [msgBody, setMsgBody] = useState("");
  const [sending, setSending] = useState(false);
  const [chatTab, setChatTab] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    const r = await fetch(`/api/projects/${project.id}/messages`);
    if (r.ok) setMessages(await r.json());
  }, [project.id]);

  useEffect(() => {
    if (open) loadMessages();
  }, [open, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMsg = async () => {
    if (!msgBody.trim()) return;
    setSending(true);
    await fetch(`/api/projects/${project.id}/messages`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: msgBody }),
    });
    setMsgBody(""); setSending(false);
    loadMessages();
  };

  const progress = calcProgress(project.steps);

  return (
    <div className={`bg-white dark:bg-gray-900 border rounded-2xl shadow-sm dark:shadow-none transition-all ${open ? "border-indigo-300 dark:border-indigo-600/40" : "border-slate-200 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-gray-700"}`}>
      {/* Card header */}
      <div className="p-4 md:p-5 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-800 dark:text-gray-100 leading-snug">{project.name}</p>
            {project.description && <p className="text-sm text-slate-500 dark:text-gray-500 mt-0.5 line-clamp-1">{project.description}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${PROJ_STATUS[project.status] ?? "bg-slate-100 text-slate-500"}`}>{project.status}</span>
            <span className={`text-slate-400 dark:text-gray-600 text-xs transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 dark:text-gray-600 mb-1">
            <span>{project.steps.length} adım</span>
            <span className="font-semibold text-slate-600 dark:text-gray-400">{progress}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${progress === 100 ? "bg-emerald-500" : "bg-indigo-500"}`} style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Expanded */}
      {open && (
        <div className="border-t border-slate-100 dark:border-gray-800" onClick={e => e.stopPropagation()}>
          {/* Inner tabs */}
          <div className="flex border-b border-slate-100 dark:border-gray-800">
            <button onClick={() => setChatTab(false)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${!chatTab ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500" : "text-slate-400 dark:text-gray-600 hover:text-slate-600"}`}>
              Adımlar
            </button>
            <button onClick={() => setChatTab(true)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${chatTab ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500" : "text-slate-400 dark:text-gray-600 hover:text-slate-600"}`}>
              Sohbet
            </button>
          </div>

          {/* Steps view */}
          {!chatTab && (
            <div className="divide-y divide-slate-50 dark:divide-gray-800/60">
              {project.steps.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-400 dark:text-gray-600">Henüz adım eklenmedi</p>
              )}
              {project.steps.map((step, i) => {
                const doneT = step.tasks.filter(t => t.status === "Tamamlandı").length;
                return (
                  <div key={step.id} className="flex items-center gap-3 px-5 py-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${step.status === "Tamamlandı" ? "bg-emerald-500 text-white" : step.status === "Devam Ediyor" ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-gray-800 text-slate-400"}`}>
                      {step.status === "Tamamlandı" ? "✓" : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-gray-300">{step.name}</p>
                      {step.tasks.length > 0 && (
                        <p className="text-xs text-slate-400 dark:text-gray-600">{doneT}/{step.tasks.length} görev</p>
                      )}
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${step.status === "Tamamlandı" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" : step.status === "Devam Ediyor" ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300" : "bg-slate-100 dark:bg-gray-800 text-slate-400"}`}>
                      {step.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Chat view */}
          {chatTab && (
            <div className="flex flex-col" style={{ height: "320px" }}>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="flex items-center justify-center h-full text-slate-400 dark:text-gray-600 text-sm">Henüz mesaj yok</div>
                )}
                {messages.map(msg => {
                  const isTeam = msg.userType !== "customer";
                  return (
                    <div key={msg.id} className={`flex gap-2 ${isTeam ? "" : "flex-row-reverse"}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${isTeam ? "bg-indigo-500" : "bg-teal-500"}`}>
                        {(msg.userName ?? "?")[0].toUpperCase()}
                      </div>
                      <div className={`max-w-[75%] flex flex-col gap-0.5 ${isTeam ? "" : "items-end"}`}>
                        <div className={`px-3 py-2 rounded-2xl text-sm ${isTeam ? "bg-slate-100 dark:bg-gray-800 text-slate-800 dark:text-gray-200 rounded-tl-sm" : "bg-indigo-600 text-white rounded-tr-sm"}`}>
                          {msg.body}
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-gray-600 px-1">
                          {msg.userName ?? "?"} · {new Date(msg.createdAt).toLocaleString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <div className="p-3 border-t border-slate-100 dark:border-gray-800 flex gap-2 shrink-0">
                <input value={msgBody} onChange={e => setMsgBody(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMsg()}
                  placeholder="Mesaj yaz..."
                  className="flex-1 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-gray-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                <button onClick={sendMsg} disabled={sending || !msgBody.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition-all">
                  Gönder
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const CATEGORIES = ["Genel", "Teknik Destek", "Fatura", "Öneri", "Şikayet"];
const PRIORITIES = ["Normal", "Yüksek", "Kritik"];

function formatBytes(b: number) {
  if (b < 1024) return `${b}B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)}KB`;
  return `${(b / 1024 / 1024).toFixed(1)}MB`;
}

function AttachmentView({ att }: { att: Attachment }) {
  if (att.type.startsWith("image/")) {
    return (
      <a href={att.url} target="_blank" rel="noopener noreferrer" className="block mt-1.5">
        <img src={att.url} alt={att.name} className="max-h-40 max-w-full rounded-xl border border-black/10 object-contain" />
      </a>
    );
  }
  return (
    <a href={att.url} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-1.5 mt-1.5 text-xs bg-black/10 hover:bg-black/20 rounded-lg px-2.5 py-1.5 transition-colors">
      <span>📄</span>
      <span className="truncate max-w-[180px]">{att.name}</span>
      <span className="shrink-0 opacity-70">{formatBytes(att.size)}</span>
    </a>
  );
}

function ReplyThread({ ticketId, onClose }: { ticketId: number; onClose: () => void }) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/tickets/${ticketId}/replies`).then(r => r.json());
    setReplies(Array.isArray(res) ? res.filter((r: Reply) => !r.isInternal) : []);
  }, [ticketId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [replies]);

  const removeFile = (i: number) => setFiles(f => f.filter((_, idx) => idx !== i));

  const send = async () => {
    if (!text.trim() && files.length === 0) return;
    setSending(true);

    const uploaded: Attachment[] = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) uploaded.push(await res.json());
    }

    await fetch(`/api/tickets/${ticketId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text.trim(), isInternal: false, attachments: uploaded }),
    });
    setText("");
    setFiles([]);
    setSending(false);
    load();
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-gray-800">
      <div className="space-y-3 max-h-64 overflow-y-auto pr-1 mb-4">
        {replies.length === 0 && (
          <p className="text-xs text-slate-400 dark:text-gray-600 text-center py-4">Henüz yanıt yok</p>
        )}
        {replies.map(r => {
          const isAgent = !!r.user;
          return (
            <div key={r.id} className={`flex ${isAgent ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                isAgent
                  ? "bg-indigo-50 dark:bg-indigo-500/10 text-slate-800 dark:text-gray-100 rounded-tl-sm"
                  : "bg-slate-100 dark:bg-gray-800 text-slate-800 dark:text-gray-100 rounded-tr-sm"
              }`}>
                {isAgent && (
                  <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 mb-1">{r.user!.name}</p>
                )}
                {r.body && <p className="whitespace-pre-wrap">{r.body}</p>}
                {r.attachments?.map((att, i) => <AttachmentView key={i} att={att} />)}
                <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1 text-right">
                  {new Date(r.createdAt).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* File previews */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {files.map((f, i) => (
            <div key={i} className="relative group">
              {f.type.startsWith("image/") ? (
                <img src={URL.createObjectURL(f)} alt={f.name}
                  className="h-14 w-14 object-cover rounded-lg border border-slate-200 dark:border-gray-700" />
              ) : (
                <div className="h-14 w-14 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 flex flex-col items-center justify-center gap-0.5 px-1">
                  <span className="text-xl">📄</span>
                  <span className="text-[8px] text-slate-400 text-center leading-tight line-clamp-2">{f.name}</span>
                </div>
              )}
              <button onClick={() => removeFile(i)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Reply form */}
      <div className="flex gap-2">
        <div className="flex-1 space-y-1.5">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send(); }}
            rows={2}
            placeholder="Yanıtınızı yazın... (Ctrl+Enter ile gönder)"
            className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all resize-none"
          />
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1 text-xs text-slate-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            📎 Dosya ekle {files.length > 0 && `(${files.length})`}
          </button>
          <input ref={fileRef} type="file" multiple
            accept="image/*,application/pdf,.doc,.docx,.xlsx,.zip,.txt"
            className="hidden"
            onChange={e => {
              const picked = Array.from(e.target.files ?? []);
              setFiles(prev => [...prev, ...picked].slice(0, 5));
              e.target.value = "";
            }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <button onClick={send} disabled={sending || (!text.trim() && files.length === 0)}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition-colors">
            {sending ? "..." : "Gönder"}
          </button>
          <button onClick={onClose}
            className="px-3 py-2 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 text-xs rounded-xl transition-colors">
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PortalPage() {
  const [me, setMe]           = useState<SessionUser | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [portalTab, setPortalTab] = useState<"tickets" | "projects">("tickets");
  const [creating, setCreating] = useState(false);
  const [form, setForm]         = useState({ subject: "", body: "", category: "Genel", priority: "Normal" });
  const [saving, setSaving]     = useState(false);
  const [filter, setFilter]     = useState("Tümü");
  const [openTicketId, setOpenTicketId] = useState<number | null>(null);

  const fetchAll = useCallback(async () => {
    const [meRes, tRes, pRes] = await Promise.all([
      fetch("/api/auth/me").then(r => r.ok ? r.json() : null),
      fetch("/api/tickets").then(r => r.json()),
      fetch("/api/projects").then(r => r.ok ? r.json() : []),
    ]);
    setMe(meRes);
    setTickets(Array.isArray(tRes) ? tRes : []);
    setProjects(Array.isArray(pRes) ? pRes : []);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!me) return;
    setSaving(true);
    await fetch("/api/tickets/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, fromEmail: me.email, fromName: me.name, source: "portal" }),
    });
    setSaving(false);
    setCreating(false);
    setForm({ subject: "", body: "", category: "Genel", priority: "Normal" });
    fetchAll();
  };

  const filtered = filter === "Tümü" ? tickets : tickets.filter(t => t.status === filter);
  const open = tickets.filter(t => t.status === "Yeni" || t.status === "İnceleniyor").length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 px-4 md:px-6 py-4 shadow-sm dark:shadow-none">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shrink-0">T</div>
            <div className="min-w-0">
              <p className="font-bold text-slate-800 dark:text-gray-100 text-sm">Müşteri Portalı</p>
              {me && <p className="text-xs text-slate-400 dark:text-gray-500 truncate">{me.name}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setCreating(true)}
              className="px-3 py-2 md:px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-indigo-600/20">
              + Yeni Talep
            </button>
            <button onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; }}
              className="px-3 py-2 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 text-sm rounded-xl transition-colors">
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-5">
        {/* Tab switcher */}
        <div className="flex bg-slate-100 dark:bg-gray-800 rounded-xl p-1 gap-1 w-fit">
          <button onClick={() => setPortalTab("tickets")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${portalTab === "tickets" ? "bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 shadow-sm" : "text-slate-500 dark:text-gray-500 hover:text-slate-700"}`}>
            Taleplerim
          </button>
          <button onClick={() => setPortalTab("projects")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${portalTab === "projects" ? "bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 shadow-sm" : "text-slate-500 dark:text-gray-500 hover:text-slate-700"}`}>
            Projelerim {projects.length > 0 && <span className="ml-1 text-[10px] bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full">{projects.length}</span>}
          </button>
        </div>

        {/* ── Tickets tab ── */}
        {portalTab === "tickets" && <>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Toplam", val: tickets.length,                                    color: "text-indigo-600 dark:text-indigo-400" },
            { label: "Açık",   val: open,                                              color: "text-amber-600 dark:text-amber-400" },
            { label: "Kapalı", val: tickets.filter(t => t.status === "Kapalı").length, color: "text-slate-500 dark:text-gray-400" },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm dark:shadow-none text-center">
              <p className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${color}`}>{val}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-1.5">
          {["Tümü", "Yeni", "İnceleniyor", "Yanıtlandı", "Kapalı"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filter === s ? "bg-indigo-600 text-white shadow-sm" : "bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-slate-500 dark:text-gray-400 hover:border-indigo-200 dark:hover:border-gray-700"}`}>
              {s}
            </button>
          ))}
        </div>

        {/* Tickets */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl text-center py-16 shadow-sm dark:shadow-none">
              <div className="text-4xl mb-3">📭</div>
              <p className="font-semibold text-slate-700 dark:text-gray-400">Henüz talep yok</p>
              <p className="text-sm text-slate-400 dark:text-gray-600 mt-1">Yeni bir destek talebi oluşturabilirsiniz</p>
            </div>
          ) : filtered.map(t => {
            const isOpen = openTicketId === t.id;
            return (
              <div key={t.id}
                className={`bg-white dark:bg-gray-900 border rounded-2xl p-4 md:p-5 shadow-sm dark:shadow-none transition-all cursor-pointer ${isOpen ? "border-indigo-300 dark:border-indigo-600/40" : "border-slate-200 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-gray-700"}`}
                onClick={() => setOpenTicketId(isOpen ? null : t.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs text-slate-400 dark:text-gray-600 font-mono">#{t.id}</span>
                      <span className="text-xs bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400 px-2 py-0.5 rounded-md">{t.category}</span>
                    </div>
                    <p className="font-semibold text-slate-800 dark:text-gray-100">{t.subject}</p>
                    {t.body && !isOpen && <p className="text-sm text-slate-500 dark:text-gray-500 mt-1 line-clamp-2">{t.body}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <StatusBadge status={t.status} />
                    <PriorityBadge priority={t.priority} />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-gray-800 gap-2">
                  {t.assignee ? (
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{t.assignee.name[0]}</div>
                      <span className="text-xs text-slate-500 dark:text-gray-500 truncate">{t.assignee.name} inceliyor</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-gray-600">Ekip incelemede</span>
                  )}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-400 dark:text-gray-600">
                      {new Date(t.receivedAt).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className={`text-slate-400 dark:text-gray-600 text-xs transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
                  </div>
                </div>

                {/* Reply thread */}
                {isOpen && (
                  <div onClick={e => e.stopPropagation()}>
                    <ReplyThread ticketId={t.id} onClose={() => setOpenTicketId(null)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </>}

        {/* ── Projects tab ── */}
        {portalTab === "projects" && (
          <div className="space-y-3">
            {projects.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl text-center py-16 shadow-sm dark:shadow-none">
                <div className="text-4xl mb-3">📁</div>
                <p className="font-semibold text-slate-700 dark:text-gray-400">Henüz proje yok</p>
                <p className="text-sm text-slate-400 dark:text-gray-600 mt-1">Size atanan projeler burada görünecek</p>
              </div>
            ) : projects.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </div>

      {/* New ticket modal */}
      {creating && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setCreating(false)}>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-bold text-slate-900 dark:text-gray-100 mb-5">Yeni Destek Talebi</h2>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase block mb-1.5">Konu *</label>
                <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required placeholder="Sorunuzu kısaca özetleyin"
                  className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase block mb-1.5">Açıklama</label>
                <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={4} placeholder="Detaylı açıklama yapın..."
                  className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "category", label: "Kategori", opts: CATEGORIES },
                  { key: "priority", label: "Öncelik",  opts: PRIORITIES },
                ].map(({ key, label, opts }) => (
                  <div key={key}>
                    <label className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase block mb-1.5">{label}</label>
                    <select value={form[key as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all">
                      {opts.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving || !form.subject}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm">
                  {saving ? "Gönderiliyor..." : "Gönder"}
                </button>
                <button type="button" onClick={() => setCreating(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 font-semibold rounded-xl text-sm transition-colors">
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
