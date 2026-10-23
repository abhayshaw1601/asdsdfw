import React, { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, Sparkles, AlertCircle } from "lucide-react";
import type { UnitType } from "../api/types";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface EnergyCopilotProps {
  day: string;
  deadlineHour: number;
  meanForecastMw: number;
  consumerDemandMw: number;
  unit: UnitType;
  onOpenAuth: () => void;
}

export const EnergyCopilot: React.FC<EnergyCopilotProps> = ({
  day,
  deadlineHour,
  meanForecastMw,
  consumerDemandMw,
  unit,
  onOpenAuth,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Welcome to the **Energy AI Copilot**. I am grounded in live Elexon wind generation, auction freeze cutoffs, and thermal procurement calculations. Ask me anything about day-ahead power buying, tomorrow's expected deficit, or safety buffer sizing.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const token = localStorage.getItem("auth_token");
  const isAuthenticated = Boolean(token);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const question = (textToSend || input).trim();
    if (!question || isLoading) return;

    if (!isAuthenticated) {
      onOpenAuth();
      return;
    }

    const newMessages: Message[] = [...messages, { role: "user", content: question }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setErrorMsg(null);

    const netThermalNeeded = Math.max(0, consumerDemandMw - meanForecastMw);

    try {
      const res = await fetch("/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          context: {
            day,
            deadlineHour,
            meanForecastMw,
            consumerDemandMw,
            netThermalNeededMw: netThermalNeeded,
            p90SafetyBufferMw: 1851,
            unit,
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 401) {
          throw new Error("Session expired. Please sign in again.");
        }
        throw new Error(errData.detail || "Unable to reach Groq AI Copilot");
      }

      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to generate copilot reply");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Open Energy AI Copilot"
        className="fixed bottom-6 right-6 z-40 px-4 py-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 hover:border-white/40 shadow-2xl backdrop-blur-xl flex items-center gap-2 text-xs font-semibold tracking-wide transition-all active:scale-95 cursor-pointer group"
      >
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <Bot className="w-4 h-4 text-white opacity-90 group-hover:opacity-100" />
        <span className="hidden sm:inline">Energy AI Copilot</span>
        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-neutral-300 font-mono">
          Groq
        </span>
      </button>

      {/* Floating Glassmorphic Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[92vw] sm:w-[420px] max-h-[580px] h-[520px] rounded-2xl bg-neutral-950/90 border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-white/[0.04]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-white/10 border border-white/15">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white tracking-tight flex items-center gap-1.5">
                  Energy AI Copilot
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                    Online
                  </span>
                </h3>
                <p className="text-[10px] text-neutral-400 font-light">
                  Day-Ahead Bidding & Thermal Deficit Advisor
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Context Banner */}
          <div className="px-3.5 py-1.5 bg-black/40 border-b border-white/5 flex items-center justify-between text-[10px] text-neutral-300 font-mono">
            <span>Delivery: {day}</span>
            <span>Freeze: {deadlineHour.toString().padStart(2, "0")}:00 London</span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-white/10 border border-white/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed text-xs ${
                    m.role === "user"
                      ? "bg-white text-neutral-950 font-medium"
                      : "bg-white/[0.06] text-neutral-200 border border-white/10"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
                {m.role === "user" && (
                  <div className="w-6 h-6 rounded-full bg-white/20 border border-white/30 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 items-center text-xs text-neutral-400 pl-8 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] font-mono ml-1">Analyzing day-ahead position...</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-[11px] text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-white shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts (If not loading) */}
          {!isLoading && messages.length <= 3 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {[
                "What is our thermal deficit?",
                "Why procure P90 vs P50?",
                "Explain the +1,852 MW bias",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-[10px] text-neutral-300 hover:text-white transition-colors cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Footer Input Area */}
          <div className="p-3 border-t border-white/10 bg-white/[0.03]">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask about tomorrow's power procurement..."
                  className="flex-1 bg-white/[0.06] border border-white/15 focus:border-white rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="p-2 rounded-xl bg-white hover:bg-neutral-200 disabled:opacity-30 text-neutral-950 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.05] border border-white/10">
                <span className="text-[11px] text-neutral-300">
                  Sign in to chat with the Energy Copilot
                </span>
                <button
                  onClick={onOpenAuth}
                  className="px-3 py-1 rounded-full bg-white hover:bg-neutral-200 text-neutral-950 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
