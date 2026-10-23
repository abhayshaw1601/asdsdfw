import React, { useState, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import { Zap, User, LogOut } from "lucide-react";
import { NAV_ITEMS } from "./navigation";
import { AuthModal, type UserSession } from "./AuthModal";
import type { UnitType } from "../api/types";

interface HeaderProps {
  unit: UnitType;
  onUnitToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ unit, onUnitToggle }) => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("auth_user");
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch {
        // invalid cached user
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setCurrentUser(null);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/25 backdrop-blur-md border-b border-white/20 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 sm:h-20 gap-4">
            {/* Brand Identity / Logo */}
            <Link
              to="/"
              className="flex items-center gap-3 text-left focus:outline-none group shrink-0"
            >
              <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                <svg
                  className="w-8 h-6 text-white fill-white drop-shadow-sm"
                  viewBox="0 0 54 36"
                  fill="currentColor"
                >
                  <path d="M10 18 C10 8 15 2 19 2 C16 7 16 29 19 34 C15 34 10 28 10 18 Z" />
                  <path d="M22 18 C22 6 27 0 31 0 C28 5 28 31 31 36 C27 36 22 30 22 18 Z" />
                  <circle cx="43" cy="18" r="9" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white tracking-tight text-sm sm:text-base">
                    Wind Forecast Portal
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white border border-white/15">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    Elexon 2026
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 hidden lg:block font-light">
                  UK Day-Ahead Energy Decision System
                </p>
              </div>
            </Link>

            {/* Central Navigation Pills */}
            <nav className="flex items-center gap-1 bg-black/40 border border-white/15 p-1 rounded-full backdrop-blur-md overflow-x-auto no-scrollbar">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) =>
                    `px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-white text-neutral-950 font-semibold shadow-sm"
                        : "text-neutral-300 hover:text-white hover:bg-white/10"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Right Controls: Unit Toggle & Trader Account */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onUnitToggle}
                title={`Switch unit to ${unit === "MW" ? "GW" : "MW"}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/40 hover:bg-black/60 border border-white/15 rounded-full text-xs font-semibold text-white transition-colors shadow-sm backdrop-blur-md"
              >
                <Zap className="w-3.5 h-3.5 text-white opacity-80" />
                <span className="text-neutral-400 font-light">Unit:</span>
                <span className="text-white font-bold">{unit}</span>
              </button>

              {currentUser ? (
                <div className="flex items-center gap-1.5 bg-black/40 border border-white/15 rounded-full px-3 py-1 backdrop-blur-md">
                  <User className="w-3.5 h-3.5 text-white opacity-80" />
                  <span className="text-xs font-medium text-white max-w-[100px] truncate">
                    {currentUser.name.split(" ")[0]}
                  </span>
                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="p-1 hover:text-white text-neutral-400 hover:bg-white/10 rounded-full transition-colors ml-1"
                  >
                    <LogOut className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-neutral-950 hover:bg-neutral-200 rounded-full text-xs font-semibold transition-colors shadow-sm"
                >
                  <User className="w-3.5 h-3.5 text-neutral-950" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* MongoDB Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    </>
  );
};
