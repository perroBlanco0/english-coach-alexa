"""MCP server exposing the English coaching tools as an Alexa+ Agent Skill."""

from mcp.server.mcpserver import MCPServer

mcp = MCPServer("english-coach")


@mcp.tool()
def analyze_pronunciation(transcript: str, target_phrase: str) -> dict:
    """Compare what the user said against the target phrase and return feedback.

    Args:
        transcript: What the speech-to-text engine heard from the user.
        target_phrase: The phrase the user was asked to say.
    """
    # Placeholder scoring until real phoneme/acoustic analysis (Bedrock/Strands) is wired in.
    matches = transcript.strip().lower() == target_phrase.strip().lower()
    return {
        "target_phrase": target_phrase,
        "heard": transcript,
        "matches": matches,
        "feedback": "Great job!" if matches else "Close — try slowing down on each syllable.",
    }


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
