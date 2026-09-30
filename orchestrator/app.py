"""Lambda orchestrator behind the WebSocket API.

Routes (selected via `action` in the WebSocket message body):
  - $connect / $disconnect: no-op, just accept the connection.
  - request_upload_url: returns a pre-signed S3 PUT URL so the client
    uploads audio directly to S3 (bypasses the 128KB WebSocket frame limit).
  - analyze: given an `audio_key` already in S3, calls the `analyze_pronunciation`
    MCP tool (real Streamable HTTP call to the MCP server Lambda) and pushes the
    feedback back over the same WebSocket connection.
  - suggest_expression: calls the `suggest_expression` MCP tool and pushes the
    suggestion back over the same WebSocket connection.

This function is a thin WebSocket/S3 layer plus an MCP *client* — the actual
voice-pipeline work (Transcribe/Bedrock/Polly) lives in the MCP server
(`src/english_coach_mcp/server.py`), which this function calls over the wire on
every real request. That's the runtime hook the Alexa+ track requires.
"""

from __future__ import annotations

import asyncio
import json
import os
import uuid

import boto3
import httpx2
from botocore.client import Config
from mcp.client.session import ClientSession
from mcp.client.streamable_http import streamable_http_client

AUDIO_BUCKET = os.environ["AUDIO_BUCKET"]
MCP_SERVER_URL = os.environ["MCP_SERVER_URL"]
MCP_SHARED_SECRET = os.environ.get("MCP_SHARED_SECRET", "")

# Force SigV4 presigned URLs. Boto3's default (legacy SigV2) locks the
# signature to the exact Content-Type present at signing time — real
# browsers auto-attach a Content-Type header from the recorded Blob's
# `type` even when the client code never sets it, which breaks SigV2
# ("SignatureDoesNotMatch") as soon as any Content-Type shows up that
# wasn't accounted for. SigV4 only enforces headers explicitly listed in
# SignedHeaders, so an unlisted Content-Type is simply ignored.
s3 = boto3.client("s3", config=Config(signature_version="s3v4"))


def handler(event, context):
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

    try:
        if route_key == "request_upload_url":
            result = _request_upload_url(body)
        elif route_key == "analyze":
            result = _analyze(body)
        elif route_key == "suggest_expression":
            result = _suggest_expression(body)
        elif route_key == "generate_phrases":
            result = _generate_phrases(body)
        else:
            result = {"error": f"unknown action: {route_key}"}
    except Exception as exc:  # noqa: BLE001 - always report back to the client
        result = {"error": str(exc)}

    apigw.post_to_connection(
        ConnectionId=connection_id,
        Data=json.dumps(result).encode("utf-8"),
    )
    return {"statusCode": 200}


def _request_upload_url(body: dict) -> dict:
    # The extension must match what the client's MediaRecorder actually
    # encodes (see frontend/src/lib/audioFormat.js) — Transcribe infers the
    # codec from the S3 key extension, not from S3 object metadata.
    #
    # Deliberately NOT signing a Content-Type: MediaRecorder reports mimeType
    # with a codec suffix (e.g. "audio/webm;codecs=opus") that varies by
    # browser/version. Any mismatch between the signed Content-Type and the
    # header the browser actually sends makes S3 reject the PUT with 403
    # SignatureDoesNotMatch — so we just don't constrain it in the signature.
    extension = body.get("extension", "webm").lower()
    audio_key = body.get("audio_key") or f"{uuid.uuid4()}.{extension}"

    upload_url = s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": AUDIO_BUCKET, "Key": audio_key},
        ExpiresIn=300,
    )
    return {"action": "upload_url", "audio_key": audio_key, "upload_url": upload_url}


def _analyze(body: dict) -> dict:
    audio_key = body["audio_key"]
    expected_phrase = body.get("expected_phrase", "")
    user_id = body.get("user_id", "")

    result = _call_mcp_tool(
        "analyze_pronunciation",
        {"audio_key": audio_key, "target_phrase": expected_phrase, "user_id": user_id},
    )
    return {"action": "feedback", **result}


def _suggest_expression(body: dict) -> dict:
    result = _call_mcp_tool(
        "suggest_expression",
        {"target_phrase": body.get("target_phrase", ""), "level": body.get("level", "intermediate")},
    )
    return {"action": "expression", **result}


def _generate_phrases(body: dict) -> dict:
    result = _call_mcp_tool(
        "generate_phrases",
        {"level": body.get("level", "intermediate"), "count": body.get("count", 10)},
    )
    return {"action": "phrases", **result}


def _call_mcp_tool(tool_name: str, arguments: dict) -> dict:
    """Open a Streamable HTTP MCP session against the MCP server Lambda and
    call one of its tools. Runs on every real `analyze`/`suggest_expression`
    request from the frontend — this is the live, verifiable runtime call to
    the Alexa+ track's required MCP technology.
    """
    return asyncio.run(_call_mcp_tool_async(tool_name, arguments))


async def _call_mcp_tool_async(tool_name: str, arguments: dict) -> dict:
    headers = {"x-mcp-auth": MCP_SHARED_SECRET} if MCP_SHARED_SECRET else {}
    http_client = httpx2.AsyncClient(headers=headers, timeout=30.0)

    async with streamable_http_client(MCP_SERVER_URL, http_client=http_client) as (
        read_stream,
        write_stream,
    ):
        async with ClientSession(read_stream, write_stream) as session:
            await session.initialize()
            call_result = await session.call_tool(tool_name, arguments)

    if call_result.is_error:
        raise RuntimeError(f"MCP tool {tool_name} failed: {call_result.content}")

    if call_result.structured_content is not None:
        return call_result.structured_content

    for block in call_result.content:
        if getattr(block, "type", None) == "text":
            return json.loads(block.text)

    raise RuntimeError(f"MCP tool {tool_name} returned no text content")
