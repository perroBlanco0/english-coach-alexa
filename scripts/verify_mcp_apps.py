"""Verify the MCP Apps card is live on the deployed MCP server.

Raw JSON-RPC over Streamable HTTP so it needs no local `mcp` install.
Run after `sam deploy`, with MCP_SHARED_SECRET set (it's in .env):

    python scripts/verify_mcp_apps.py
"""

import json
import os
import sys
import urllib.request
import uuid

URL = os.environ.get(
    "MCP_SERVER_URL",
    "https://aw3jfvvowe57alsjd3qqwg553q0jhdzs.lambda-url.us-east-1.on.aws/mcp",
)
SECRET = os.environ.get("MCP_SHARED_SECRET", "")
UI_URI = "ui://english-coach/feedback.html"


def rpc(method: str, params: dict | None = None) -> dict:
    body = json.dumps(
        {"jsonrpc": "2.0", "id": str(uuid.uuid4()), "method": method, "params": params or {}}
    ).encode()
    req = urllib.request.Request(
        URL,
        data=body,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
            "x-mcp-auth": SECRET,
        },
    )
    with urllib.request.urlopen(req, timeout=60) as response:
        return json.loads(response.read())


def main() -> int:
    failures = []

    tools = rpc("tools/list")["result"]["tools"]
    by_name = {t["name"]: t for t in tools}
    print(f"tools: {', '.join(sorted(by_name))}")

    for expected in ("analyze_pronunciation", "suggest_expression", "generate_phrases"):
        if expected not in by_name:
            failures.append(f"tool {expected!r} is missing")

    analyze = by_name.get("analyze_pronunciation", {})
    bound = (analyze.get("_meta") or {}).get("ui", {}).get("resourceUri")
    if bound == UI_URI:
        print(f"OK  analyze_pronunciation -> _meta.ui.resourceUri = {bound}")
    else:
        failures.append(f"analyze_pronunciation _meta.ui.resourceUri = {bound!r}, expected {UI_URI!r}")

    resources = rpc("resources/list")["result"]["resources"]
    card = next((r for r in resources if r["uri"] == UI_URI), None)
    if not card:
        failures.append(f"resource {UI_URI!r} is not listed")
    else:
        mime = card.get("mimeType")
        expected_mime = "text/html;profile=mcp-app"
        if mime == expected_mime:
            print(f"OK  resource listed with mimeType = {mime}")
        else:
            failures.append(f"resource mimeType = {mime!r}, expected {expected_mime!r}")

        contents = rpc("resources/read", {"uri": UI_URI})["result"]["contents"]
        html = contents[0].get("text", "")
        print(f"OK  resources/read returned {len(html)} bytes of HTML")
        if "ui/notifications/tool-result" not in html:
            failures.append("card HTML does not listen for ui/notifications/tool-result")

    if failures:
        print("\nFAILED:")
        for failure in failures:
            print(f"  - {failure}")
        return 1

    print("\nAll checks passed — the MCP Apps card is live.")
    return 0


if __name__ == "__main__":
    if not SECRET:
        print("MCP_SHARED_SECRET is not set (it's in .env)", file=sys.stderr)
        sys.exit(2)
    sys.exit(main())
