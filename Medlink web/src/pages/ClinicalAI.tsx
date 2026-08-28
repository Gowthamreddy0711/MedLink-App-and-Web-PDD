import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  BrainCircuit,
  Send,
  Calendar,
  Users,
  ClipboardList,
  Megaphone,
  Copy,
  Check,
  Trash2,
  Bell,
  UserCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AIChatMessage } from "../types";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { DoctorCard } from "../components/DoctorCard";
import {
  querySmartAssistant,
  CopilotContext,
  SessionContext,
} from "../services/localCopilotEngine";

// ── Quick Actions ──────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: "My Duties",         icon: Calendar,       prompt: "What are my duties?" },
  { label: "Find Coverage",     icon: Users,          prompt: "Who can cover my shift?" },
  { label: "My Leave Status",   icon: ClipboardList,  prompt: "What is my leave status?" },
  { label: "Open Requests",     icon: ShieldCheck,    prompt: "Show open coverage requests" },
  { label: "Notices",           icon: Megaphone,      prompt: "Show latest hospital notices" },
  { label: "My Notifications",  icon: Bell,           prompt: "Show my notifications" },
  { label: "My Profile",        icon: UserCircle,     prompt: "Show my profile" },
] as const;

// ── Markdown Bold Renderer ─────────────────────────────────────────────────

/**
 * Converts **bold** markers in a text string into <strong> elements.
 * Used to render the engine's structured responses without a markdown library.
 */
function renderBold(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}

/**
 * Renders a complete assistant message as formatted JSX.
 * Handles: headings (###), bullet lines (•, -), blank lines, italic (*text*),
 * and bold (**text**) — all from the engine's plain-text output.
 */
function RichMessage({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-0.5 text-[12.5px] leading-relaxed text-slate-800">
      {lines.map((line, idx) => {
        // Blank line → small spacer
        if (!line.trim()) {
          return <div key={idx} className="h-2" />;
        }

        // Heading: ### …
        if (line.startsWith("### ")) {
          return (
            <p key={idx} className="font-bold text-slate-900 text-[13px] pt-1">
              {renderBold(line.replace(/^###\s*/, ""))}
            </p>
          );
        }

        // Bullet: • or - or *
        if (/^[•\-\*]\s/.test(line)) {
          return (
            <div key={idx} className="flex gap-1.5 items-start pl-1">
              <span className="text-sky-500 mt-0.5 shrink-0">•</span>
              <span>{renderBold(line.replace(/^[•\-\*]\s/, ""))}</span>
            </div>
          );
        }

        // Numbered list: 1. 2. …
        if (/^\d+\.\s/.test(line)) {
          const numMatch = line.match(/^(\d+)\.\s(.*)/);
          if (numMatch) {
            return (
              <div key={idx} className="flex gap-1.5 items-start pl-1">
                <span className="text-sky-600 font-semibold shrink-0 text-[11px] mt-0.5 w-4 text-right">
                  {numMatch[1]}.
                </span>
                <span>{renderBold(numMatch[2])}</span>
              </div>
            );
          }
        }

        // Regular line
        return <p key={idx}>{renderBold(line)}</p>;
      })}
    </div>
  );
}

// ── User Avatar Initials ───────────────────────────────────────────────────

function getInitials(name: string | null | undefined): string {
  if (!name) return "Dr";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// ── Component ──────────────────────────────────────────────────────────────

export const ClinicalAI: React.FC = () => {
  const { user } = useAuth();
  const {
    doctors,
    leaveRequests,
    volunteers,
    notices,
    chatRooms,
    notifications,
  } = useData();

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const navigate  = useNavigate();

  const [inputPrompt, setInputPrompt] = useState("");
  const [isLoading,   setIsLoading]   = useState(false);
  const [copiedId,    setCopiedId]    = useState<string | null>(null);
  const [sessionContext, setSessionContext] = useState<SessionContext>({});

  const initMessage: AIChatMessage = {
    id: "init_1",
    sender: "ai",
    text:
      `Hello${user?.name ? `, ${user.name}` : ""}. I'm the **MedLink Smart Assistant**.\n\n` +
      `I can answer questions about your coverage duties, leave requests, available peer doctors, hospital notices, messages, and more — all using your live MedLink data.\n\n` +
      `Tap a quick action below or type a question to get started.`,
    timestamp: new Date().toISOString(),
  };

  const [messages, setMessages] = useState<AIChatMessage[]>([initMessage]);

  // Scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Build the context snapshot from DataContext subscriptions
  const buildContext = useCallback((): CopilotContext => ({
    currentUser:   user,
    doctors:       doctors       || [],
    leaveRequests: leaveRequests || [],
    volunteers:    volunteers    || [],
    notices:       notices       || [],
    chatRooms:     chatRooms     || [],
    notifications: notifications || [],
  }), [user, doctors, leaveRequests, volunteers, notices, chatRooms, notifications]);

  // ── Send handler (async — awaits the engine) ───────────────────────────

  const handleSend = useCallback(async (customPrompt?: string) => {
    const text = (customPrompt ?? inputPrompt).trim();
    if (!text || isLoading) return;

    const userMsg: AIChatMessage = {
      id:        `u_${Date.now()}`,
      sender:    "user",
      text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt("");
    setIsLoading(true);

    // Allow React to re-render the user bubble + spinner before processing
    await new Promise<void>((resolve) => setTimeout(resolve, 80));

    try {
      const result = await querySmartAssistant(text, buildContext(), sessionContext);
      setSessionContext({ lastIntent: result.intent, lastData: result.dataPayload });
      
      setMessages((prev) => [
        ...prev,
        {
          id:        `a_${Date.now()}`,
          sender:    "ai",
          text:      result.answer,
          timestamp: new Date().toISOString(),
          dataPayload: result.dataPayload,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id:        `e_${Date.now()}`,
          sender:    "ai",
          text:      "I couldn't retrieve this information from MedLink at this time. Please try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [inputPrompt, isLoading, buildContext]);

  // ── Enter key ─────────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Copy ──────────────────────────────────────────────────────────────

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── Clear chat ────────────────────────────────────────────────────────

  const handleClear = () => {
    setMessages([{ ...initMessage, id: `init_${Date.now()}`, timestamp: new Date().toISOString() }]);
    inputRef.current?.focus();
  };

  const userInitials = getInitials(user?.name || user?.fullName);

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto gap-4 animate-in fade-in duration-200">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-sky-600 to-indigo-700 rounded-xl shadow text-white shrink-0">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
              MedLink Smart Assistant
            </h1>
            <p className="text-[11px] text-slate-500 font-medium leading-tight">
              Clinical Operations · Powered by your MedLink data
            </p>
          </div>
        </div>

        {/* Clear Chat */}
        <button
          onClick={handleClear}
          disabled={isLoading || messages.length <= 1}
          title="Clear conversation"
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
        >
          <Trash2 className="w-3 h-3" />
          <span className="hidden sm:inline">Clear</span>
        </button>
      </div>

      {/* ── Quick Actions ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => handleSend(action.prompt)}
              disabled={isLoading}
              className="flex flex-col gap-2 p-3 bg-white hover:bg-sky-50 active:scale-95 border border-slate-200 hover:border-sky-300 rounded-2xl text-left transition-all cursor-pointer group shadow-2xs disabled:opacity-50 disabled:pointer-events-none"
            >
              <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg w-fit group-hover:bg-sky-100 transition-colors">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10.5px] font-semibold text-slate-700 leading-tight">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Chat Window ──────────────────────────────────────────────────── */}
      <div
        className="flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow overflow-hidden flex-1 min-h-0"
        style={{ minHeight: 420 }}
      >
        {/* Message feed */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m) => {
            const isAI = m.sender === "ai";
            return (
              <div
                key={m.id}
                className={`flex gap-2.5 ${isAI ? "justify-start" : "justify-end"}`}
              >
                {/* AI avatar */}
                {isAI && (
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-700 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    <BrainCircuit className="w-3.5 h-3.5 text-white" />
                  </div>
                )}

                <div className={`flex flex-col gap-1 max-w-[80%] ${!isAI ? "items-end" : ""}`}>
                  {/* Bubble */}
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      isAI
                        ? "bg-slate-50 border border-slate-200/80 rounded-tl-sm"
                        : "bg-sky-600 text-white rounded-tr-sm text-[12.5px] leading-relaxed"
                    }`}
                  >
                    {isAI ? (
                      <>
                        <RichMessage text={m.text} />
                        {m.dataPayload && (
                          <div className="mt-4 flex flex-col gap-3 w-full min-w-[280px]">
                            {m.dataPayload.type === "doctors" && m.dataPayload.items.map((doc, i) => (
                              <div key={doc.id || i} className="w-full text-slate-900 pointer-events-auto shadow-sm rounded-xl overflow-hidden border border-slate-200">
                                <DoctorCard 
                                  doctor={doc} 
                                  onSelectDetails={(d) => navigate(`/directory/${d.id}`)}
                                  onContactChat={() => navigate(`/messages`)}
                                />
                              </div>
                            ))}
                            {m.dataPayload.type === "leave_requests" && m.dataPayload.items.map((req, i) => (
                              <div key={req.id || i} className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col gap-2 text-slate-800 shadow-sm pointer-events-auto">
                                <div className="flex justify-between items-start gap-4">
                                  <span className="font-semibold text-slate-800 text-sm leading-tight">{req.specialization || req.coverageType || "General"} Leave</span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${req.status === 'APPROVED' || (req as any).status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' : req.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{req.status}</span>
                                </div>
                                <div className="text-[11.5px] text-slate-600 flex flex-col gap-0.5">
                                  {req.doctorName ? <p>Doctor: <span className="font-medium text-slate-700">{req.doctorName}</span></p> : null}
                                  <p>Dates: <span className="font-medium text-slate-700">{new Date(req.leaveStartDate).toLocaleDateString()} &rarr; {new Date(req.leaveEndDate).toLocaleDateString()}</span></p>
                                  {req.hospital ? <p>Hospital: <span className="font-medium text-slate-700">{req.hospital}</span></p> : null}
                                </div>
                                <button onClick={() => navigate("/coverage")} className="mt-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg self-start transition-colors cursor-pointer">
                                  View Coverage Details
                                </button>
                              </div>
                            ))}
                            {m.dataPayload.type === "chat_rooms" && m.dataPayload.items.map((room, i) => {
                               const otherId = room.participants?.find((p: string) => p !== user?.id) || "";
                               const otherName = room.participantNames?.[otherId] || "Doctor";
                               return (
                                <div key={room.id || i} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-slate-800 shadow-sm pointer-events-auto">
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-semibold text-slate-800 text-sm truncate">{otherName}</span>
                                    <span className="text-[11px] text-slate-500 truncate">{room.lastMessage || "No messages yet"}</span>
                                  </div>
                                  <button onClick={() => navigate("/messages")} className="py-1.5 px-3 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer">
                                    Open Chat
                                  </button>
                                </div>
                               );
                            })}
                            {m.dataPayload.type === "notices" && m.dataPayload.items.map((notice, i) => (
                              <div key={notice.id || i} className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col gap-1.5 text-slate-800 shadow-sm pointer-events-auto">
                                <span className="font-semibold text-slate-800 text-sm leading-tight">{notice.title}</span>
                                <span className="text-xs text-slate-600 line-clamp-2">{notice.content}</span>
                                <button onClick={() => navigate("/dashboard")} className="mt-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg self-start transition-colors cursor-pointer">
                                  View on Dashboard
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      m.text
                    )}
                  </div>

                  {/* Copy button (AI messages only) */}
                  {isAI && (
                    <button
                      onClick={() => handleCopy(m.id, m.text)}
                      className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer transition-colors self-start px-1"
                    >
                      {copiedId === m.id ? (
                        <><Check className="w-2.5 h-2.5 text-emerald-500" /> Copied</>
                      ) : (
                        <><Copy className="w-2.5 h-2.5" /> Copy</>
                      )}
                    </button>
                  )}
                </div>

                {/* User avatar */}
                {!isAI && (
                  <div className="w-7 h-7 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 text-white text-[9px] font-bold mt-0.5">
                    {userInitials}
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-700 flex items-center justify-center shrink-0 shadow-2xs">
                <BrainCircuit className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl rounded-tl-sm flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-sky-500 animate-spin" />
                <span className="text-[11px] text-slate-500">Checking MedLink data…</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Input bar ────────────────────────────────────────────────── */}
        <div className="border-t border-slate-200/80 bg-white">
          <div className="flex items-center gap-2.5 px-4 py-3">
            <input
              ref={inputRef}
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your MedLink operations…"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 focus:outline-none text-slate-800 placeholder:text-slate-400 transition-all disabled:opacity-60 bg-slate-50 focus:bg-white"
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !inputPrompt.trim()}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>

          {/* ── Disclaimer footer ─────────────────────────────────────── */}
          <div className="px-4 pb-2.5 flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-slate-400 shrink-0" />
            <p className="text-[10px] text-slate-400 leading-tight">
              Responses generated from your live MedLink Firestore data — not from an AI model. For medical decisions, consult a qualified healthcare professional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
