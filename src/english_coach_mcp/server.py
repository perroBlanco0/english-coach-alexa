"""MCP server exposing the English coaching tools as an Alexa+ Agent Skill.

Runs as a real, self-hosted Streamable HTTP MCP server (spec 2025-11-25+): the
orchestrator Lambda calls these tools over the wire on every real user
interaction (see `orchestrator/app.py`), instead of this module being a
disconnected copy of the pipeline logic.
"""

from __future__ import annotations

import json
import os
import time
import uuid

import boto3
from botocore.client import Config
from mcp.server.mcpserver import MCPServer
from mcp.server.streamable_http import TransportSecuritySettings
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

mcp = MCPServer("english-coach")

AUDIO_BUCKET = os.environ["AUDIO_BUCKET"]
BEDROCK_MODEL_ID = os.environ["BEDROCK_MODEL_ID"]
MCP_SHARED_SECRET = os.environ.get("MCP_SHARED_SECRET", "")
PROGRESS_TABLE = os.environ.get("PROGRESS_TABLE", "")

# Same SigV4 rationale as the old orchestrator: browsers/clients attach a
# Content-Type the presigned URL isn't signed for, which breaks SigV2.
s3 = boto3.client("s3", config=Config(signature_version="s3v4"))
transcribe = boto3.client("transcribe")
bedrock = boto3.client("bedrock-runtime")
polly = boto3.client("polly")
dynamodb = boto3.resource("dynamodb")

POLL_INTERVAL_SECONDS = 1
POLL_TIMEOUT_SECONDS = 25

# Transcribe reports a 0-1 confidence per word. Below this, we treat the word
# as mispronounced/misheard rather than trust the transcript at face value.
LOW_CONFIDENCE_THRESHOLD = 0.6

# How many of the user's most-repeated troubled words to surface each time,
# so the feedback stays focused instead of listing their whole history.
TOP_TROUBLED_WORDS = 3

# Fallback when Bedrock's response isn't valid JSON — keeps generate_phrases
# from failing the whole request over a formatting glitch.
DEFAULT_PHRASES = [
    "Could you point me in the right direction?",
    "Let's circle back on this tomorrow.",
    "That's such a vibe.",
    "I would like to check in, please.",
    "Can I get a receipt for this purchase?",
    "She sells seashells by the seashore.",
    "I'm going to the airport tomorrow.",
    "Can you pass me the salt, please?",
    "Let's meet for lunch on Friday.",
    "The weather is really nice today.",
]


@mcp.tool()
def analyze_pronunciation(audio_key: str, target_phrase: str, user_id: str = "") -> dict:
    """Analyze a recorded clip (already uploaded to S3) against the target phrase.

    Runs the real AWS voice pipeline: Amazon Transcribe -> Amazon Bedrock (feedback)
    -> Amazon Polly (spoken feedback), and returns everything the client needs to
    render the result. When `user_id` is given, also reads/updates that user's
    pronunciation progress in DynamoDB so feedback can call out words they keep
    getting wrong across sessions.

    Args:
        audio_key: S3 object key of the audio clip already uploaded to the
            pipeline's bucket (see the orchestrator's `request_upload_url`).
        target_phrase: The phrase the user was asked to say.
        user_id: Stable per-device identifier (frontend localStorage UUID)
            used to track progress across sessions. Optional — omitted, the
            analysis still runs, just without cross-session memory.
    """
    transcript, low_confidence_words = _transcribe(audio_key)

    # No speech was detected at all: don't run the paid Bedrock/Polly chain
    # to produce advice about words that were never said. Scoring or
    # generating feedback on an empty transcript can't be honest — it would
    # be advice about mispronunciation invented over silence.
    if not transcript.strip():
        return {
            "audio_key": audio_key,
            "expected_phrase": target_phrase,
            "transcript": "",
            "low_confidence_words": [],
            "recurring_troubled_words": [],
            "feedback": None,
            "feedback_audio_url": None,
            "no_speech_detected": True,
        }

    # Only surface a word as "recurring" when it's part of THIS attempt's
    # mistakes too — otherwise a perfect attempt would still get flagged for
    # words from unrelated past phrases, which reads as a nonsensical false
    # negative (see the "100/100 but still corrected" bug).
    history = _get_recurring_troubled_words(user_id) if user_id else []
    recurring_words = [w for w in history if w in low_confidence_words]

    feedback = _generate_feedback(transcript, target_phrase, low_confidence_words, recurring_words)
    feedback_audio_url = _synthesize_feedback_audio(feedback)

    if user_id:
        _update_progress(user_id, low_confidence_words)

    return {
        "audio_key": audio_key,
        "expected_phrase": target_phrase,
        "transcript": transcript,
        "low_confidence_words": low_confidence_words,
        "recurring_troubled_words": recurring_words,
        "feedback": feedback,
        "feedback_audio_url": feedback_audio_url,
    }


@mcp.tool()
def suggest_expression(target_phrase: str, level: str = "intermediate") -> dict:
    """Suggest a colloquial expression related to the phrase the user just practiced.

    Args:
        target_phrase: The phrase the user was practicing pronunciation on —
            the suggestion is tied to its topic/situation, not a generic list.
        level: User's proficiency level (beginner, intermediate, advanced).
    """
    prompt = (
        f'A {level}-level English learner just practiced saying: "{target_phrase}". '
        "Suggest ONE natural colloquial English expression or idiom that fits "
        "the same topic or situation (not the same phrase). "
        'Reply with ONLY a JSON object, no other text: '
        '{"expression": "...", "meaning": "one short sentence explaining when to use it, in Spanish"}'
    )
    response = bedrock.invoke_model(
        modelId=BEDROCK_MODEL_ID,
        body=json.dumps(
            {
                "messages": [{"role": "user", "content": [{"text": prompt}]}],
                "inferenceConfig": {"maxTokens": 150},
            }
        ),
    )
    payload = json.loads(response["body"].read())
    text = payload["output"]["message"]["content"][0]["text"].strip()
    if text.startswith("```"):
        text = text.strip("`").removeprefix("json").strip()
    normalized = text.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')

    try:
        parsed = json.loads(normalized)
        expression = f'"{parsed["expression"]}" — {parsed["meaning"]}'
    except (json.JSONDecodeError, KeyError):
        expression = "\"No worries\" — una forma versátil y amigable de decir que todo está bien."

    return {"target_phrase": target_phrase, "level": level, "expression": expression}


@mcp.tool()
def generate_phrases(level: str = "intermediate", count: int = 10) -> dict:
    """Generate a batch of practice phrases for pronunciation drills.

    Called once per batch (not per practice attempt) — the client caches the
    result client-side, so this doesn't add cost to every recording.

    Args:
        level: User's proficiency level (beginner, intermediate, advanced).
        count: How many phrases to generate (kept small; this is a single
            Bedrock call regardless of count).
    """
    prompt = (
        f"Generate {count} short English phrases (6-12 words each) for a "
        f"{level}-level English pronunciation practice app aimed at "
        "Spanish-speaking learners. Mix everyday topics: travel, work, "
        "social situations, small talk. Include a couple of phrases with "
        "tricky English sounds (th, r, v/b) for pronunciation practice. "
        'Reply with ONLY a JSON array of strings, no other text. Example: '
        '["Could you point me in the right direction?", "Let\'s grab a coffee later."]'
    )
    response = bedrock.invoke_model(
        modelId=BEDROCK_MODEL_ID,
        body=json.dumps(
            {
                "messages": [{"role": "user", "content": [{"text": prompt}]}],
                "inferenceConfig": {"maxTokens": 500},
            }
        ),
    )
    payload = json.loads(response["body"].read())
    text = payload["output"]["message"]["content"][0]["text"].strip()

    # Bedrock sometimes wraps JSON in a code fence despite the instruction.
    if text.startswith("```"):
        text = text.strip("`").removeprefix("json").strip()

    # Bedrock occasionally emits "smart" typographic quotes (’ “ ”) inside
    # the JSON string values, which breaks strict json.loads. Normalize to
    # ASCII quotes before parsing rather than fail the whole request.
    normalized = text.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')

    try:
        phrases = json.loads(normalized)
    except json.JSONDecodeError:
        phrases = DEFAULT_PHRASES[:count]

    return {"level": level, "phrases": phrases}


def _transcribe(audio_key: str) -> tuple[str, list[str]]:
    job_name = f"english-coach-{uuid.uuid4()}"
    media_uri = f"s3://{AUDIO_BUCKET}/{audio_key}"

    transcribe.start_transcription_job(
        TranscriptionJobName=job_name,
        Media={"MediaFileUri": media_uri},
        MediaFormat=audio_key.rsplit(".", 1)[-1].lower(),
        LanguageCode="en-US",
    )

    elapsed = 0
    while elapsed < POLL_TIMEOUT_SECONDS:
        job = transcribe.get_transcription_job(TranscriptionJobName=job_name)
        status = job["TranscriptionJob"]["TranscriptionJobStatus"]
        if status == "COMPLETED":
            transcript_uri = job["TranscriptionJob"]["Transcript"]["TranscriptFileUri"]
            return _read_transcript(transcript_uri)
        if status == "FAILED":
            raise RuntimeError(f"Transcription job {job_name} failed")
        time.sleep(POLL_INTERVAL_SECONDS)
        elapsed += POLL_INTERVAL_SECONDS

    raise TimeoutError(f"Transcription job {job_name} did not finish in time")


def _read_transcript(transcript_uri: str) -> tuple[str, list[str]]:
    import urllib.request

    with urllib.request.urlopen(transcript_uri) as response:
        payload = json.loads(response.read())

    transcript = payload["results"]["transcripts"][0]["transcript"]

    # Transcribe reports one confidence score per recognized word (pronunciation
    # items only — punctuation items have no confidence and are skipped). Below
    # LOW_CONFIDENCE_THRESHOLD, the model itself is unsure it heard the word
    # right, which is a good proxy for "the learner mispronounced this".
    low_confidence_words = [
        item["alternatives"][0]["content"]
        for item in payload["results"]["items"]
        if item["type"] == "pronunciation"
        and float(item["alternatives"][0]["confidence"]) < LOW_CONFIDENCE_THRESHOLD
    ]
    return transcript, low_confidence_words


def _generate_feedback(
    transcript: str,
    expected_phrase: str,
    low_confidence_words: list[str],
    recurring_words: list[str],
) -> str:
    low_confidence_note = (
        f"Speech-to-text is least confident about these words: {', '.join(low_confidence_words)}. "
        if low_confidence_words
        else ""
    )
    recurring_note = (
        f"This learner has struggled with these words in past sessions too: {', '.join(recurring_words)}. "
        "Mention if any of them show up again. "
        if recurring_words
        else ""
    )
    prompt = (
        "You are an English pronunciation coach for Spanish-speaking learners. "
        f'The learner was asked to say this English phrase: "{expected_phrase}". '
        f'Speech-to-text heard: "{transcript}". '
        f"{low_confidence_note}{recurring_note}"
        "Reply ENTIRELY IN SPANISH (neutral Latin American Spanish), 2-3 concise "
        "and encouraging sentences. Quote the specific English words or sounds "
        "the learner should work on (keep those words in English, in quotes), "
        "and give one concrete tip to improve their pronunciation."
    )
    response = bedrock.invoke_model(
        modelId=BEDROCK_MODEL_ID,
        body=json.dumps(
            {
                "messages": [{"role": "user", "content": [{"text": prompt}]}],
                "inferenceConfig": {"maxTokens": 150},
            }
        ),
    )
    payload = json.loads(response["body"].read())
    return payload["output"]["message"]["content"][0]["text"]


def _synthesize_feedback_audio(feedback_text: str) -> str:
    speech = polly.synthesize_speech(
        Text=feedback_text,
        OutputFormat="mp3",
        VoiceId="Lupe",  # es-US neural — feedback is generated in Spanish
        LanguageCode="es-US",
        Engine="neural",
    )
    audio_key = f"feedback-audio/{uuid.uuid4()}.mp3"
    s3.put_object(Bucket=AUDIO_BUCKET, Key=audio_key, Body=speech["AudioStream"].read(), ContentType="audio/mpeg")
    return s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": AUDIO_BUCKET, "Key": audio_key},
        ExpiresIn=300,
    )


def _get_recurring_troubled_words(user_id: str) -> list[str]:
    """Words this user has been flagged as low-confidence on more than once,
    most-repeated first, capped to TOP_TROUBLED_WORDS."""
    if not PROGRESS_TABLE:
        return []
    table = dynamodb.Table(PROGRESS_TABLE)
    item = table.get_item(Key={"user_id": user_id}).get("Item")
    if not item:
        return []
    counts = item.get("troubled_words", {})
    repeated = {word: count for word, count in counts.items() if count > 1}
    ranked = sorted(repeated, key=repeated.get, reverse=True)
    return ranked[:TOP_TROUBLED_WORDS]


def _update_progress(user_id: str, low_confidence_words: list[str]) -> None:
    """Increment this session's low-confidence words in the user's running
    tally, so future sessions can spot what keeps tripping them up."""
    if not PROGRESS_TABLE:
        return
    table = dynamodb.Table(PROGRESS_TABLE)
    item = table.get_item(Key={"user_id": user_id}).get("Item") or {}
    counts = dict(item.get("troubled_words", {}))
    for word in low_confidence_words:
        counts[word] = int(counts.get(word, 0)) + 1

    table.put_item(
        Item={
            "user_id": user_id,
            "troubled_words": counts,
            "sessions_count": int(item.get("sessions_count", 0)) + 1,
            "updated_at": int(time.time()),
        }
    )


# ---- Streamable HTTP app, deployed behind a Lambda Function URL ----
#
# The Function URL is public (no IAM auth), so we gate every MCP request with
# a shared-secret header the orchestrator is configured with (MCP_SHARED_SECRET
# on both sides). This is the "proper authentication" the Streamable HTTP spec
# asks self-hosted servers to implement.

async def _require_shared_secret(request: Request, call_next):
    if MCP_SHARED_SECRET and request.headers.get("x-mcp-auth") != MCP_SHARED_SECRET:
        return JSONResponse({"error": "unauthorized"}, status_code=401)
    return await call_next(request)


def _build_app():
    # A StreamableHTTPSessionManager can only run its lifespan once per
    # instance. Mangum drives a full ASGI lifespan (startup + shutdown) on
    # every single Lambda invocation, so a module-level app would work for
    # exactly one request per warm container and then hard-fail. Building a
    # fresh Starlette app per invocation keeps this correct; tool
    # registration on `mcp` itself already happened once at import time, so
    # this is cheap.
    built = mcp.streamable_http_app(
        json_response=True,
        # Stateless mode makes every HTTP request self-contained instead of
        # relying on a session created by a previous (and by now torn down)
        # Lambda invocation — required for a Lambda-hosted Streamable HTTP
        # server.
        stateless_http=True,
        # The DNS-rebinding Host/Origin check assumes a fixed, known
        # hostname (e.g. a server bound to localhost). Here the server is a
        # public Lambda Function URL invoked server-to-server by the
        # orchestrator, whose host isn't known until deploy time and is
        # never a browser Origin — the shared-secret middleware below is the
        # real access control instead.
        transport_security=TransportSecuritySettings(enable_dns_rebinding_protection=False),
    )
    built.add_middleware(BaseHTTPMiddleware, dispatch=_require_shared_secret)
    return built


def handler(event, context):
    """Lambda entrypoint (Function URL, buffered) via Mangum."""
    from mangum import Mangum

    return Mangum(_build_app())(event, context)


def main() -> None:
    mcp.run(transport="streamable-http")


if __name__ == "__main__":
    main()
