import { useCallback, useRef, useState } from "react";
import { pickAudioFormat } from "../lib/audioFormat";

/**
 * Tap-to-record wrapper around the native MediaRecorder API. The caller
 * (useVoicePipeline) owns the max-duration timer so the auto-stop can drive
 * the same upload/analyze flow as a manual stop.
 */
export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [level, setLevel] = useState(0); // 0..1, for the waveform animation
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);

  const stopLevelMeter = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setLevel(0);
  };

  const startLevelMeter = (stream) => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = { audioCtx, analyser };

    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((sum, v) => sum + v, 0) / data.length;
      setLevel(Math.min(1, avg / 128));
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  };

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    chunksRef.current = [];

    const { mimeType } = pickAudioFormat();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.start();
    startLevelMeter(stream);
    setIsRecording(true);
  }, []);

  const stop = useCallback(() => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || pickAudioFormat().mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        streamRef.current?.getTracks().forEach((t) => t.stop());
        analyserRef.current?.audioCtx.close();
        stopLevelMeter();
        setIsRecording(false);
        resolve(blob);
      };
      recorder.stop();
    });
  }, []);

  return { isRecording, level, start, stop };
}
