# Product Feedback — Tools, APIs & SDKs used

## Which developer tools/APIs/SDKs did you use, and why

- **Amazon Bedrock (Nova Micro)** — generates the Spanish-language pronunciation
  feedback, batches of practice phrases, and context-aware colloquial expression
  suggestions. Chosen for its very low per-request cost, which matters for a
  student-facing app that needs to stay cheap at scale.
- **Amazon Transcribe** — converts the learner's recorded clip to text, and its
  per-word confidence scores are what let us flag exactly which words were
  mispronounced (not just "the sentence was wrong").
- **Amazon Polly (neural, es-US)** — turns the written feedback into spoken
  Spanish audio, so a low-literacy or younger learner still gets full value.
- **Amazon S3** — temporary storage for uploaded audio clips and generated
  feedback audio, with a 1-day lifecycle rule and presigned URLs so the browser
  never needs AWS credentials.
- **AWS Lambda + API Gateway (WebSocket API)** — the orchestrator: a thin
  WebSocket/S3 layer that also acts as a real **MCP client**.
- **A self-hosted MCP server on its own Lambda Function URL** (Streamable HTTP,
  spec 2025-11-25+) — this is the Alexa+ Agent Skill surface. It exposes
  `analyze_pronunciation`, `suggest_expression`, and `generate_phrases` as MCP
  tools, and is callable independently of our own frontend (verified directly
  with an MCP client, not just invoked by our own app).
- **Amazon DynamoDB (on-demand)** — stores per-user pronunciation progress
  (recurring troubled words) across sessions, so feedback improves over time
  instead of resetting every attempt.
- **Amazon Cognito** — real user accounts (sign-up/sign-in), replacing an
  earlier hardcoded demo login.
- **Amazon CloudFront + S3 (OAC)** — hosts the React frontend as a private,
  CDN-backed static site.
- **AWS SAM / CloudFormation** — single template.yaml provisions the entire
  stack (WebSocket API, both Lambdas, DynamoDB, Cognito, S3, CloudFront).

## What worked well

- Bedrock Nova Micro's cost is genuinely negligible at this scale — a full
  practice session (Transcribe + Bedrock + Polly) costs a fraction of a cent,
  which made the "cheap enough to actually give away" business idea viable.
- Transcribe's per-word confidence scores were an unexpectedly clean way to
  build word-level feedback — no extra model or service needed, it was already
  in the response we were discarding.
- SAM's single-template model made it easy to add new AWS resources (DynamoDB
  table, Cognito User Pool) as the product grew mid-hackathon without touching
  unrelated infrastructure.
- The MCP Python SDK's Streamable HTTP transport worked cleanly behind a
  Lambda Function URL once configured for stateless mode — no persistent
  session/container assumptions to fight.

## What needs improvement

- See the friction log for specifics, but the two biggest: (1) `sam build`
  without a container on Windows can silently bundle a Windows-only
  dependency (`pywin32`) that breaks the Lambda at runtime with no build-time
  warning; (2) `sam deploy` will happily deploy a CloudFormation change
  successfully even when it re-packaged Lambda code without its Python
  dependencies — the failure only shows up in the invocation logs afterward,
  not at deploy time.
- Cognito User Pool `UsernameAttributes` cannot be changed in place — it's a
  silent "replacement required" that CloudFormation reports as a hard update
  failure with no guidance to rename the logical resource.
- Bedrock output occasionally uses typographic ("smart") quotes inside
  JSON-formatted responses despite an explicit "reply with ONLY JSON"
  instruction, which breaks strict `json.loads` intermittently — this needed
  defensive normalization on our side.

## Onboarding experience

Getting a Streamable HTTP MCP server running behind a Lambda Function URL had
very little first-party documentation to follow — most MCP examples assume a
long-running local process, not a stateless serverless deployment. We had to
piece together `stateless_http=True` and disabling DNS-rebinding protection
from source/issues rather than a guide. Everything else (Bedrock, Transcribe,
Polly, Cognito, SAM) had solid, easy-to-follow docs.

## Would you build with these again?

Yes. For an MVP that needs to stay near-free per user, this combination
(Lambda + Bedrock Nova Micro + Transcribe + Polly + DynamoDB on-demand) is
hard to beat on cost, and SAM kept the whole stack in one reviewable file.
