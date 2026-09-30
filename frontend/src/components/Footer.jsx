import { Github, Linkedin, Trophy, Cloud } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-brand-border mt-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/brand/logo.png" alt="perroBlanco0" className="w-8 h-8 rounded-full" />
          <div className="text-xs text-slate-400 text-center sm:text-left">
            <p className="text-slate-300 font-medium">Byron González</p>
            <p>Cloud &amp; AI Architect · Santiago, Chile</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <a
            href="https://github.com/perroBlanco0"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs hover:text-brand-cyan transition"
          >
            <Github size={15} /> perroBlanco0
          </a>
          <a
            href="https://www.linkedin.com/in/byron-gonzalez"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs hover:text-brand-cyan transition"
          >
            <Linkedin size={15} /> LinkedIn
          </a>
          <a
            href="https://devpost.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs hover:text-brand-cyan transition"
          >
            <Trophy size={15} /> Devpost
          </a>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 border border-brand-border rounded-full px-3 py-1.5">
          <Cloud size={12} className="text-brand-cyan" />
          Arquitectura 100% serverless en AWS
        </div>
      </div>
    </footer>
  );
}
