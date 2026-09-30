import { Mic, Loader2 } from "lucide-react";

const BAR_ANIMATIONS = ["animate-wave1", "animate-wave2", "animate-wave3", "animate-wave4", "animate-wave5"];

export default function RecorderButton({ isRecording, isBusy, level, onToggle, wsReady }) {
  const scale = 1 + level * 0.15;
  const disabled = !wsReady || isBusy;

  const ariaLabel = !wsReady
    ? "Esperando conexión con el servidor"
    : isBusy
    ? "Procesando tu grabación, espera"
    : isRecording
    ? "Detener grabación y enviar"
    : "Comenzar a grabar";

  const helperText = !wsReady
    ? "Esperando conexión con el servidor…"
    : isBusy
    ? "Analizando tu pronunciación…"
    : isRecording
    ? "Toca de nuevo para enviar tu grabación"
    : "Toca y di la frase (se corta sola a los 5s)";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex items-center justify-center w-40 h-40 sm:w-48 sm:h-48">
        {isRecording && (
          <>
            <span className="absolute inset-0 rounded-full bg-brand-danger/25 animate-pulseRing" />
            <span className="absolute inset-0 rounded-full bg-brand-danger/15 animate-pulseRing [animation-delay:0.4s]" />
          </>
        )}

        <button
          type="button"
          disabled={disabled}
          onClick={onToggle}
          className={`relative z-10 w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center
            select-none touch-none transition-transform duration-150 shadow-xl
            ${isRecording ? "bg-brand-danger shadow-red-500/20" : "bg-brand-accent shadow-blue-500/20"}
            ${disabled ? "opacity-40 cursor-not-allowed" : "active:scale-95"}
          `}
          style={{ transform: isRecording ? `scale(${scale})` : undefined }}
          aria-pressed={isRecording}
          aria-label={ariaLabel}
        >
          {isBusy ? (
            <Loader2 size={40} className="animate-spin text-white" />
          ) : (
            <Mic size={42} className="text-white" strokeWidth={1.75} />
          )}
        </button>
      </div>

      {isRecording && (
        <div className="flex items-end gap-1 h-6">
          {BAR_ANIMATIONS.map((anim, i) => (
            <span
              key={i}
              className={`w-1.5 rounded-full bg-brand-danger ${anim}`}
              style={{ height: "40%" }}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-slate-400 text-center max-w-[220px]">{helperText}</p>
    </div>
  );
}
