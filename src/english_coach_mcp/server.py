"""MCP server exposing the English coaching tools as an Alexa+ Agent Skill."""

import json
import os

import boto3
from mcp.server.mcpserver import MCPServer

mcp = MCPServer("english-coach")

_lambda_client = boto3.client("lambda")
ORCHESTRATOR_FUNCTION_NAME = os.environ.get("ORCHESTRATOR_FUNCTION_NAME", "")


@mcp.tool()
def analyze_pronunciation(audio_key: str, target_phrase: str) -> dict:
    """Analyze a recorded clip against the target phrase via the AWS voice pipeline.

    Args:
        audio_key: S3 object key of the audio clip already uploaded to the
            pipeline's bucket (see `request_upload_url`).
        target_phrase: The phrase the user was asked to say.
    """
    response = _lambda_client.invoke(
        FunctionName=ORCHESTRATOR_FUNCTION_NAME,
        InvocationType="RequestResponse",
        Payload=json.dumps({"audio_key": audio_key, "expected_phrase": target_phrase}).encode("utf-8"),
    )
    return json.loads(response["Payload"].read())


@mcp.tool()
def suggest_expression(context: str, level: str = "intermediate") -> dict:
    """Suggest a colloquial expression for a given context and user level.

    Args:
        context: Situation the user wants expressions for (travel, work, social media).
        level: User's proficiency level (beginner, intermediate, advanced).
    """
    # Placeholder catalog until a real content/LLM-backed generator replaces it.
    catalog = {
        "travel": "\"Could you point me in the right direction?\" — polite way to ask for directions.",
        "work": "\"Let's circle back on this\" — used to postpone a discussion point.",
        "social media": "\"That's such a vibe\" — casual way to say something feels great.",
    }
    return {
        "context": context,
        "level": level,
        "expression": catalog.get(context.lower(), "\"No worries\" — a versatile, friendly reassurance."),
    }


def main() -> None:
    mcp.run(transport="streamable-http")


if __name__ == "__main__":
    main()
