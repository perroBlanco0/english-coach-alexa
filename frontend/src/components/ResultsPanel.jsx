import { Sparkles, AlertTriangle, MessageCircleHeart, MicOff } from "lucide-react";
import { scorePronunciation } from "../lib/score";
import AudioPlayer from "./AudioPlayer";

function ScoreRing({ score }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#30d158" : score >= 50 ? "#ff9f0a" : "#ff453a";

  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#3a3a3c" strokeWidth="7" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold tracking-tight">{score}</span>
        <span className="text-[10px] text-slate-500">/ 100</span>
      </div>
    </div>
  );
}

function Label({ children }) {
  return <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 mb-1">{children}</p>;
}

export default function ResultsPanel({
  result,
  error,
  targetPhrase,
  expressionTip,
  expressionLoading,
  onRequestExpressionTip,
  onReset,
}) {
  if (error) {
    return (
      <div className="w-full bg-brand-surface border border-brand-danger/30 rounded-3xl p-5 flex items-start gap-3">
        <AlertTriangle size={20} className="text-brand-danger shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-red-300">No se pudo completar el análisis</p>
          <p className="text-xs text-slate-400 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!result) return null;

  if (result.no_speech_detected) {
    return (
      <div className="w-full bg-brand-surface border border-brand-border rounded-3xl p-5 flex items-start gap-3">
        <MicOff size={20} className="text-slate-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-200">No alcanzamos a escucharte</p>
          <ul className="text-xs text-slate-400 mt-1.5 space-y-1 list-disc list-inside">
            <li>Revisa que el micrófono no esté silenciado</li>
            <li>Confirma que el navegador tenga permiso para usarlo</li>
            <li>Espera al aviso de grabación antes de empezar a hablar</li>
          </ul>
          <button
            onClick={onReset}
            className="mt-3 text-xs font-medium px-3.5 py-2 rounded-full bg-brand-surface2 text-slate-200 hover:text-white active:scale-95 transition"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  const score = scorePronunciation(result.transcript, targetPhrase);

  return (
    <div className="w-full bg-brand-surface border border-brand-border rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl shadow-black/20">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <ScoreRing score={score} />

        <div className="flex-1 w-full space-y-3.5">
          <div>
            <Label>Frase esperada</Label>
            <p className="text-sm text-slate-200">{targetPhrase}</p>
          </div>
          <div>
            <Label>Transcripción detectada</Label>
            <p className="text-sm text-slate-200">{result.transcript || "—"}</p>
          </div>
          {result.low_confidence_words?.length > 0 && (
            <div>
              <Label>Palabras a repasar</Label>
              <div className="flex flex-wrap gap-1.5">
                {result.low_confidence_words.map((word, i) => (
                  <span
                    key={`${word}-${i}`}
                    className="text-xs px-2.5 py-1 rounded-full bg-brand-warning/15 text-brand-warning"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}
          {result.recurring_troubled_words?.length > 0 && (
            <div>
              <Label>Sigues repitiendo estos errores</Label>
              <div className="flex flex-wrap gap-1.5">
                {result.recurring_troubled_words.map((word, i) => (
                  <span
                    key={`${word}-${i}`}
                    className="text-xs px-2.5 py-1 rounded-full bg-brand-danger/15 text-brand-danger"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-brand-border pt-4 flex items-start gap-2.5">
        <Sparkles size={16} className="text-brand-accent shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <Label>Feedback</Label>
          <p className="text-sm text-slate-200 leading-relaxed">{result.feedback}</p>

          {result.feedback_audio_url && (
            <div className="mt-3.5">
              <AudioPlayer src={result.feedback_audio_url} />
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-brand-border pt-4 space-y-2.5">
        <div className="flex items-start gap-2.5">
          <MessageCircleHeart size={16} className="text-brand-accent shrink-0 mt-0.5" />
          <Label>Expresión relacionada con esta frase</Label>
        </div>
        <button
          onClick={() => onRequestExpressionTip?.(targetPhrase)}
          disabled={expressionLoading}
          className="text-xs font-medium px-3.5 py-1.5 rounded-full bg-brand-surface2 text-slate-300 hover:text-white active:scale-95 transition disabled:opacity-50"
        >
          {expressionLoading ? "Buscando…" : "Sugerir expresión"}
        </button>
        {expressionTip && !expressionLoading && (
          <p className="text-sm text-slate-200 leading-relaxed">{expressionTip.expression}</p>
        )}
      </div>
    </div>
  );
}
