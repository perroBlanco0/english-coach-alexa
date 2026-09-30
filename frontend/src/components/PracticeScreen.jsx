import { useEffect, useState } from "react";
import { Shuffle, Sparkles, Mic } from "lucide-react";
import { useVoicePipeline } from "../hooks/useVoicePipeline";
import RecorderButton from "./RecorderButton";
import StatusIndicator from "./StatusIndicator";
import ResultsPanel from "./ResultsPanel";

const PHRASES = [
  "Could you point me in the right direction?",
  "Let's circle back on this tomorrow.",
  "That's such a vibe.",
  "I would like to check in, please.",
  "Can I get a receipt for this purchase?",
  "She sells seashells by the seashore.",
];

const CACHE_KEY = "english-coach:generated-phrases";

function loadCachedPhrases() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.length ? parsed : null;
  } catch {
    return null;
  }
}

export default function PracticeScreen() {
  const [pool, setPool] = useState(() => loadCachedPhrases() || PHRASES);
  const [targetPhrase, setTargetPhrase] = useState(pool[0]);
  const {
    wsStatus,
    stage,
    isRecording,
    level,
    result,
    error,
    toggleRecording,
    reset,
    expressionTip,
    expressionLoading,
    requestExpressionTip,
    generatedPhrases,
    phrasesLoading,
    requestGeneratedPhrases,
  } = useVoicePipeline();

  useEffect(() => {
    if (generatedPhrases?.length) {
      setPool(generatedPhrases);
      setTargetPhrase(generatedPhrases[0]);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(generatedPhrases));
      } catch {
        // best-effort cache; fine if storage is unavailable
      }
    }
  }, [generatedPhrases]);

  const wsReady = wsStatus === "connected";
  const isBusy = stage === "uploading" || stage === "processing";
  const showResult = stage === "done" || stage === "error" || stage === "no_speech";

  const shufflePhrase = () => {
    const next = pool[Math.floor(Math.random() * pool.length)];
    setTargetPhrase(next);
    reset();
  };

  const handleToggle = () => {
    if (!wsReady || isBusy) return;
    toggleRecording(targetPhrase);
  };

  // Once a result is in, the recording UI shrinks to a slim recap bar so the
  // feedback — the thing the user actually came back for — is what's on
  // screen, not pushed below a full-size phrase card + mic button.
  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col items-center gap-5">
      <StatusIndicator wsStatus={wsStatus} stage={stage} />

      {showResult ? (
        <button
          onClick={reset}
          className="w-full flex items-center gap-3 bg-brand-surface border border-brand-border rounded-2xl px-4 py-3 text-left active:scale-[0.99] transition"
        >
          <span className="shrink-0 w-9 h-9 rounded-full bg-brand-accent/15 flex items-center justify-center">
            <Mic size={16} className="text-brand-accent" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] text-slate-500">Toca para intentar de nuevo</span>
            <span className="block text-sm text-slate-200 truncate">"{targetPhrase}"</span>
          </span>
        </button>
      ) : (
        <section className="w-full bg-brand-surface border border-brand-border rounded-3xl p-6 sm:p-7 text-center space-y-2 shadow-xl shadow-black/20">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Frase objetivo</p>
          <h2 className="text-xl sm:text-2xl font-semibold text-white leading-snug tracking-tight">
            "{targetPhrase}"
          </h2>
          <div className="flex items-center justify-center gap-4 mt-1">
            <button
              onClick={shufflePhrase}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-accent active:opacity-60 transition"
            >
              <Shuffle size={13} />
              Cambiar frase
            </button>
            <button
              onClick={() => requestGeneratedPhrases("intermediate", 10)}
              disabled={!wsReady || phrasesLoading}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-accent active:opacity-60 transition disabled:opacity-40"
            >
              <Sparkles size={13} />
              {phrasesLoading ? "Generando…" : "Frases nuevas (IA)"}
            </button>
          </div>

          <div className="pt-4">
            <RecorderButton
              isRecording={isRecording}
              isBusy={isBusy}
              level={level}
              wsReady={wsReady}
              onToggle={handleToggle}
            />
          </div>
        </section>
      )}

      <ResultsPanel
        result={result}
        error={error}
        targetPhrase={targetPhrase}
        expressionTip={expressionTip}
        expressionLoading={expressionLoading}
        onRequestExpressionTip={requestExpressionTip}
        onReset={reset}
      />
    </main>
  );
}
