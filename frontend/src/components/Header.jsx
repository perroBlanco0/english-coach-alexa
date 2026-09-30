import { Github, LogOut, Cloud } from "lucide-react";
import { logout } from "../lib/auth";

export default function Header({ onLogout }) {
  const handleLogout = () => {
    logout();
    onLogout();
  };

  return (
    <header className="sticky top-0 z-20 backdrop-blur-xl bg-brand-bg/70 border-b border-brand-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/brand/logo.png"
            alt="perroBlanco0"
            className="w-8 h-8 rounded-full shrink-0"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight tracking-tight truncate">English Coach AI</p>
            <p className="text-[11px] text-slate-500 leading-tight truncate">
              Byron González · Cloud &amp; AI Architect
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-slate-400 bg-brand-surface2 rounded-full px-3 py-1.5">
            <Cloud size={12} className="text-brand-accent" />
            Serverless en AWS
          </span>
          <a
            href="https://github.com/perroBlanco0"
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-full hover:bg-brand-surface2 active:scale-95 transition text-slate-300"
            aria-label="GitHub de perroBlanco0"
          >
            <Github size={18} />
          </a>
          <button
            onClick={handleLogout}
            className="p-2 rounded-full hover:bg-brand-surface2 active:scale-95 transition text-slate-300"
            aria-label="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
