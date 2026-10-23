import React, { useState, useEffect } from "react";
import { BookOpen, Send, User, Clock, CheckCircle2 } from "lucide-react";

interface TradeNote {
  day: string;
  author: string;
  user_email: string;
  note: string;
  created_at: string;
}

interface TradeJournalProps {
  day: string;
  onOpenAuth: () => void;
}

export const TradeJournal: React.FC<TradeJournalProps> = ({ day, onOpenAuth }) => {
  const [notes, setNotes] = useState<TradeNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const token = localStorage.getItem("auth_token");
  const isAuthenticated = Boolean(token);

  const fetchNotes = async () => {
    if (!token) {
      setNotes([]);
      return;
    }
    try {
      setIsLoading(true);
      const res = await fetch(`/api/v1/trader/notes?day=${day}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(Array.isArray(data) ? data : []);
      }
    } catch {
      // Ignore network errors in polling
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [day, token]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !token) return;

    try {
      setIsSubmitting(true);
      setStatusMsg(null);
      const res = await fetch("/api/v1/trader/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          day,
          note: newNote.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to save operational note");
      }

      setNewNote("");
      setStatusMsg("Trade note saved to MongoDB");
      setTimeout(() => setStatusMsg(null), 3000);
      await fetchNotes();
    } catch (err: any) {
      setStatusMsg(err.message || "Error saving note");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/[0.04] hover:bg-white/[0.06] backdrop-blur-2xl border border-white/20 p-5 sm:p-6 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.25),0_12px_36px_rgba(0,0,0,0.45)] transition-all">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-white/10 border border-white/15">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight flex items-center gap-2">
              Operational Trade Journal & Decision Notes
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 font-mono">
                {day}
              </span>
            </h3>
            <p className="text-xs text-neutral-400 font-light">
              Institutional log for documenting auction bids, wind forecast variances, and CCGT hedging rationale.
            </p>
          </div>
        </div>

        {statusMsg && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{statusMsg}</span>
          </div>
        )}
      </div>

      {!isAuthenticated ? (
        <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-neutral-400" />
          </div>
          <div className="max-w-md">
            <p className="text-xs text-neutral-300 font-medium">
              Sign in as an Institutional Trader to record and view operational trading notes for this delivery day.
            </p>
            <p className="text-[11px] text-neutral-400 mt-1">
              Notes are securely tied to your trader profile and synchronized to MongoDB.
            </p>
          </div>
          <button
            onClick={onOpenAuth}
            className="mt-1 px-4 py-1.5 rounded-full bg-white hover:bg-neutral-200 text-neutral-950 text-xs font-semibold tracking-wide transition-all cursor-pointer"
          >
            Sign In to Access Journal
          </button>
        </div>
      ) : (
        <div className="pt-4 space-y-4">
          {/* Note Input Box */}
          <form onSubmit={handleAddNote} className="space-y-2.5">
            <div className="relative">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Log your trading desk rationale (e.g., 'Procured +1,850 MW thermal hedge via CCGT auction due to forecast variance during 17:00-19:00 evening peak')..."
                rows={2}
                className="w-full bg-white/[0.05] border border-white/15 focus:border-white rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none transition-all resize-none font-sans leading-relaxed"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-neutral-400 font-mono">
                Persisted in MongoDB: <code className="text-neutral-300">trade_notes</code>
              </span>
              <button
                type="submit"
                disabled={!newNote.trim() || isSubmitting}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white hover:bg-neutral-200 disabled:opacity-30 text-neutral-950 text-xs font-semibold transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Save Note</span>
              </button>
            </div>
          </form>

          {/* Notes Feed */}
          <div className="space-y-2.5 pt-2">
            {isLoading ? (
              <div className="text-xs text-neutral-400 flex items-center gap-2 py-4">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>Loading delivery notes...</span>
              </div>
            ) : notes.length === 0 ? (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center text-xs text-neutral-400">
                No trading notes recorded for delivery day <span className="font-mono text-neutral-300">{day}</span> yet.
              </div>
            ) : (
              notes.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                    <span className="flex items-center gap-1.5 font-medium text-white">
                      <User className="w-3 h-3 text-neutral-300" />
                      {item.author}
                    </span>
                    <span className="font-mono text-[10px] text-neutral-400">
                      {new Date(item.created_at).toLocaleString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-200 leading-relaxed font-sans whitespace-pre-wrap">
                    {item.note}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
