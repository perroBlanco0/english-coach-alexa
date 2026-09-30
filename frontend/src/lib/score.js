// Client-side approximation only — the qualitative feedback is generated
// by Bedrock server-side. This score is a rough visual indicator based on
// word overlap between what Transcribe heard and the target phrase.
export function scorePronunciation(transcript, targetPhrase) {
  const normalize = (s) =>
    s
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter(Boolean);

  const heard = normalize(transcript || "");
  const target = normalize(targetPhrase || "");
  if (target.length === 0) return 0;

  const heardSet = new Set(heard);
  const matches = target.filter((word) => heardSet.has(word)).length;
  return Math.round((matches / target.length) * 100);
}
