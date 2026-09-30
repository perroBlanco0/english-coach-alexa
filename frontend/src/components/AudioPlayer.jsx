import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2 } from "lucide-react";

// Custom playback UI instead of the browser's raw <audio controls> — matches
// the app's design and gives a single tap target that works even when
// autoplay is blocked (Safari, or no prior user gesture).
export default function AudioPlayer({ src, autoPlay = true }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    };
    const onEnd = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("play", () => setIsPlaying(true));
    audio.addEventListener("pause", () => setIsPlaying(false));

    if (autoPlay) {
      // Best-effort: works right after the user's own tap-to-record gesture.
      // Safari can still refuse it silently — the tap-to-play button below
      // is the always-available fallback.
      audio.play().catch(() => {});
    }

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.pause();
    else audio.play().catch(() => {});
  };

  return (
    <div className="flex items-center gap-3 w-full max-w-xs">
      <audio ref={audioRef} src={src} preload="auto" />
      <button
        type="button"
        onClick={toggle}
        aria-label={isPlaying ? "Pausar" : "Reproducir feedback"}
        className="shrink-0 w-9 h-9 rounded-full bg-brand-accent flex items-center justify-center text-white active:scale-95 transition-transform"
      >
        {isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" className="ml-0.5" />}
      </button>
      <div className="flex-1 flex items-center gap-2">
        <Volume2 size={13} className="text-slate-500 shrink-0" />
        <div className="flex-1 h-1 rounded-full bg-brand-surface2 overflow-hidden">
          <div
            className="h-full bg-brand-accent rounded-full"
            style={{ width: `${progress * 100}%`, transition: "width 0.15s linear" }}
          />
        </div>
      </div>
    </div>
  );
}
