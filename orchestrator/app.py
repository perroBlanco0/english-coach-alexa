"""Lambda orchestrator behind the WebSocket API.

Routes (selected via `action` in the WebSocket message body):
  - $connect / $disconnect: no-op, just accept the connection.
  - request_upload_url: returns a pre-signed S3 PUT URL so the client
    uploads audio directly to S3 (bypasses the 128KB WebSocket frame limit).
  - analyze: given an `audio_key` already in S3, runs Transcribe -> Bedrock
    and pushes the feedback back over the same WebSocket connection.
"""

from __future__ import annotations

import json
import os
import time
import uuid

import boto3

AUDIO_BUCKET = os.environ["AUDIO_BUCKET"]
BEDROCK_MODEL_ID = os.environ["BEDROCK_MODEL_ID"]

s3 = boto3.client("s3")
transcribe = boto3.client("transcribe")
bedrock = boto3.client("bedrock-runtime")

# Transcribe batch jobs on ~3s clips finish well within this budget; keeps
# the Lambda (30s timeout) from being killed mid-poll.
POLL_INTERVAL_SECONDS = 1
POLL_TIMEOUT_SECONDS = 25


def handler(event, context):
    # Direct synchronous invoke (e.g. from the MCP server via boto3 lambda
    # invoke) skips API Gateway entirely: no requestContext, and the event
    # itself is the action payload. Return the result directly instead of
    # posting to a WebSocket connection.
    if "requestContext" not in event:
        return _analyze(event)

    route_key = event.get("requestContext", {}).get("routeKey", "$default")

    if route_key in ("$connect", "$disconnect"):
        return {"statusCode": 200}

    connection_id = event["requestContext"]["connectionId"]
    domain = event["requestContext"]["domainName"]
    stage = event["requestContext"]["stage"]
    apigw = boto3.client(
        "apigatewaymanagementapi",
        endpoint_url=f"https://{domain}/{stage}",
    )

    body = json.loads(event.get("body") or "{}")

    if route_key == "request_upload_url":
        result = _request_upload_url(body)
    elif route_key == "analyze":
        result = _analyze(body)
    else:
        result = {"error": f"unknown action: {route_key}"}

    apigw.post_to_connection(
        ConnectionId=connection_id,
        Data=json.dumps(result).encode("utf-8"),
    )
    return {"statusCode": 200}


def _request_upload_url(body: dict) -> dict:
    audio_key = body.get("audio_key") or f"{uuid.uuid4()}.wav"
    upload_url = s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": AUDIO_BUCKET, "Key": audio_key, "ContentType": "audio/wav"},
        ExpiresIn=300,
    )
    return {"action": "upload_url", "audio_key": audio_key, "upload_url": upload_url}


def _analyze(body: dict) -> dict:
    audio_key = body["audio_key"]
    expected_phrase = body.get("expected_phrase", "")

    transcript = _transcribe(audio_key)
    feedback = _generate_feedback(transcript, expected_phrase)

    return {
        "action": "feedback",
        "audio_key": audio_key,
        "expected_phrase": expected_phrase,
        "transcript": transcript,
        "feedback": feedback,
    }


def _transcribe(audio_key: str) -> str:
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


def _read_transcript(transcript_uri: str) -> str:
    import urllib.request

    with urllib.request.urlopen(transcript_uri) as response:
        payload = json.loads(response.read())
    return payload["results"]["transcripts"][0]["transcript"]


def _generate_feedback(transcript: str, expected_phrase: str) -> str:
    prompt = (
        "You are an English pronunciation coach. The learner was asked to say: "
        f'"{expected_phrase}". Speech-to-text heard: "{transcript}". '
        "Give concise, encouraging feedback (2-3 sentences) on pronunciation, "
        "rhythm and clarity, and one tip to improve."
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
