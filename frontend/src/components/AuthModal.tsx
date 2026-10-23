import React, { useState } from "react";
import { X, User, Mail, Lock, Shield, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserSession, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const endpoint = mode === "register" ? "/api/v1/auth/register" : "/api/v1/auth/login";
      const payload = mode === "register" ? { name, email, password } : { email, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Authentication failed. Please verify credentials.");
      }

      setSuccessMsg(
        mode === "register"
          ? "Trader profile created and registered in MongoDB."
          : "Authentication successful."
      );

      localStorage.setItem("auth_token", data.access_token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));

      setTimeout(() => {
        onSuccess(data.user, data.access_token);
        onClose();
      }, 700);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0a0e0c] border border-white/20 rounded-2xl p-6 sm:p-8 shadow-2xl text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          title="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 rounded-lg bg-white/10 border border-white/15 text-white">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white">
              {mode === "signin" ? "Trader Terminal Sign In" : "Create Trader Account"}
            </h2>
            <p className="text-xs text-neutral-400 font-light">
              Elexon 2026 MongoDB-backed Energy Auth
            </p>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="flex rounded-lg bg-neutral-900 border border-white/10 p-1 my-5">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
              mode === "signin"
                ? "bg-white text-neutral-950 font-semibold shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
              mode === "register"
                ? "bg-white text-neutral-950 font-semibold shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-neutral-900 border border-white/20 text-neutral-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-white shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-neutral-900 border border-white/25 text-white text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  required
                  placeholder="Alex Wright"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-neutral-950/80 border border-white/15 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/40 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Work Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
              <input
                type="email"
                required
                placeholder="trader@energy.co.uk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-neutral-950/80 border border-white/15 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/40 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-neutral-950/80 border border-white/15 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/40 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-neutral-200 text-neutral-950 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-md disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
            ) : (
              <>
                <span>{mode === "signin" ? "Sign In to Terminal" : "Register Trader Account"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-white/10 text-center">
          <p className="text-[11px] text-neutral-400">
            Encrypted session via JWT bearer tokens and MongoDB credential persistence.
          </p>
        </div>
      </div>
    </div>
  );
};
