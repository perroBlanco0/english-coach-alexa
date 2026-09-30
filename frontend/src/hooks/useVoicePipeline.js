import { useCallback, useEffect, useRef, useState } from "react";
import { useWebSocket } from "./useWebSocket";
import { useAudioRecorder } from "./useAudioRecorder";
import { pickAudioFormat } from "../lib/audioFormat";
import { getUserId } from "../lib/auth";

const MAX_RECORD_MS = 5000;

// idle -> recording -> uploading -> processing -> done (or error)
export function useVoicePipeline() {
  const { status: wsStatus, send, subscribe } = useWebSocket();
  const { isRecording, level, start, stop } = useAudioRecorder();
  const [stage, setStage] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [expressionTip, setExpressionTip] = useState(null);
  const [expressionLoading, setExpressionLoading] = useState(false);
  const [generatedPhrases, setGeneratedPhrases] = useState(null);
  const [phrasesLoading, setPhrasesLoading] = useState(false);
  const pendingUploadRef = useRef(null); // { audio_key, upload_url }
  const autoStopTimerRef = useRef(null);
  const targetPhraseRef = useRef("");

  useEffect(() => {
    return subscribe((message) => {
      if (message.action === "upload_url") {
        pendingUploadRef.current = message;
      } else if (message.action === "feedback") {
        setResult(message);
        setStage(message.no_speech_detected ? "no_speech" : "done");
      } else if (message.action === "expression") {
        setExpressionTip(message);
        setExpressionLoading(false);
      } else if (message.action === "phrases") {
        setGeneratedPhrases(message.phrases);
        setPhrasesLoading(false);
      } else if (message.error) {
        setError(message.error);
        setStage("error");
        setExpressionLoading(false);
        setPhrasesLoading(false);
      }
    });
  }, [subscribe]);

  const requestGeneratedPhrases = useCallback(
    (level = "intermediate", count = 10) => {
      setPhrasesLoading(true);
      send("generate_phrases", { level, count });
    },
    [send]
  );

  // Calls the MCP server's `suggest_expression` tool (via the orchestrator)
  // for a colloquial-expression tip tied to the phrase just practiced.
  const requestExpressionTip = useCallback(
    (targetPhrase, level = "intermediate") => {
      setExpressionTip(null);
      setExpressionLoading(true);
      send("suggest_expression", { target_phrase: targetPhrase, level });
    },
    [send]
  );

  const finishRecording = useCallback(async () => {
    clearTimeout(autoStopTimerRef.current);

    const blob = await stop();
    if (!blob) return;

    setStage("uploading");

    // The upload_url reply may arrive slightly after recording starts;
    // give it a short grace window before failing.
    const waitForUploadTarget = async () => {
      const deadline = Date.now() + 5000;
      while (!pendingUploadRef.current && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 100));
      }
      return pendingUploadRef.current;
    };

    const target = await waitForUploadTarget();
    if (!target) {
      setError("No se recibió la URL de subida a tiempo. Intenta de nuevo.");
      setStage("error");
      return;
    }

    try {
      // No Content-Type header: the presigned URL isn't signed with one
      // (MediaRecorder's mimeType varies by browser and would break the
      // S3 signature otherwise). See orchestrator/app.py::_request_upload_url.
      const res = await fetch(target.upload_url, { method: "PUT", body: blob });
      if (!res.ok) throw new Error(`S3 respondió ${res.status}`);
    } catch (err) {
      setError(`Falló la subida del audio a S3: ${err.message}`);
      setStage("error");
      return;
    }

    setStage("processing");
    send("analyze", {
      audio_key: target.audio_key,
      expected_phrase: targetPhraseRef.current,
      user_id: getUserId(),
    });
  }, [send, stop]);

  const startRecording = useCallback(
    async (targetPhrase) => {
      setError(null);
      setResult(null);
      targetPhraseRef.current = targetPhrase;
      pendingUploadRef.current = null;

      try {
        send("request_upload_url", { extension: pickAudioFormat().extension });
        await start();
        setStage("recording");
        autoStopTimerRef.current = setTimeout(finishRecording, MAX_RECORD_MS);
      } catch (err) {
        setError(err.message || "No se pudo acceder al micrófono.");
        setStage("error");
      }
    },
    [send, start, finishRecording]
  );

  // Single tap-to-record / tap-to-send entry point for the UI.
  const toggleRecording = useCallback(
    (targetPhrase) => {
      if (stage === "recording") {
        finishRecording();
      } else {
        startRecording(targetPhrase);
      }
    },
    [stage, startRecording, finishRecording]
  );

  const reset = useCallback(() => {
    setStage("idle");
    setResult(null);
    setError(null);
    setExpressionTip(null);
  }, []);

  return {
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
  };
}
