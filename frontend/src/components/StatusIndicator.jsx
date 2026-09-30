import { Wifi, WifiOff, Mic, UploadCloud, BrainCircuit, CheckCircle2, Loader2 } from "lucide-react";

const WS_LABEL = {
  connecting: { label: "Conectando…", tone: "text-brand-warning", icon: Loader2, spin: true },
  connected: { label: "Conectado", tone: "text-brand-success", icon: Wifi },
  disconnected: { label: "Desconectado", tone: "text-brand-danger", icon: WifiOff },
  error: { label: "Error de conexión", tone: "text-brand-danger", icon: WifiOff },
};

const STAGE_LABEL = {
  idle: null,
  recording: { label: "Grabando", tone: "text-brand-danger", icon: Mic },
  uploading: { label: "Subiendo audio", tone: "text-brand-warning", icon: UploadCloud, spin: true },
  processing: { label: "Procesando con IA", tone: "text-brand-accent", icon: BrainCircuit, spin: true },
  done: { label: "Análisis listo", tone: "text-brand-success", icon: CheckCircle2 },
  no_speech: { label: "Sin voz detectada", tone: "text-brand-warning", icon: Mic },
  error: { label: "Error en el análisis", tone: "text-brand-danger", icon: WifiOff },
};

function Badge({ label, tone, icon: Icon, spin }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-brand-surface2 ${tone}`}
    >
      <Icon size={13} className={spin ? "animate-spin" : ""} />
      {label}
    </span>
  );
}

export default function StatusIndicator({ wsStatus, stage }) {
  const ws = WS_LABEL[wsStatus] || WS_LABEL.disconnected;
  const stageInfo = STAGE_LABEL[stage];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge {...ws} />
      {stageInfo && <Badge {...stageInfo} />}
    </div>
  );
}
