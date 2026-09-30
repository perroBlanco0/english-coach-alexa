// Amazon Transcribe's supported MediaFormat values that map cleanly to what
// MediaRecorder can natively produce, in preference order.
const CANDIDATES = [
  { mimeType: "audio/webm", extension: "webm" },
  { mimeType: "audio/ogg", extension: "ogg" },
  { mimeType: "audio/mp4", extension: "mp4" },
];

let cached = null;

// Picks the audio format once per session: the extension used for the S3
// object key MUST match what MediaRecorder actually encodes, or Transcribe
// fails to parse the file.
export function pickAudioFormat() {
  if (cached) return cached;

  const supported =
    typeof MediaRecorder !== "undefined"
      ? CANDIDATES.find((c) => MediaRecorder.isTypeSupported(c.mimeType))
      : null;

  cached = supported || { mimeType: "", extension: "webm" }; // let the browser pick if none matched
  return cached;
}
