# English Coach — Agent Skill for Alexa+

Coach de inglés conversacional por voz, construido como Agent Skill / MCP server para el track **Alexa+** del [Build, Ship, Shape: Amazon Developer Hackathon](https://amazonappdev2026.devpost.com/).

## Qué hace

- Analiza pronunciación, acento y ritmo del habla del usuario en tiempo real.
- Da feedback correctivo y sugiere expresiones coloquiales según contexto (viajes, trabajo, redes sociales).
- Adapta ejercicios de repetición al nivel del usuario.

## Arquitectura

```
Frontend (React) --WebSocket--> Orchestrator Lambda (cliente MCP)
                                        |
                                        | Streamable HTTP (MCP, spec 2025-11-25+)
                                        v
                                 MCP server Lambda (Function URL)
                                        |
                                        v
                        Amazon Transcribe / Bedrock / Polly / S3
```

- El **MCP server** (`src/english_coach_mcp/server.py`) corre desplegado como su propia
  Lambda con URL pública, expuesto por transporte HTTP Streamable, y expone las tools
  `analyze_pronunciation` y `suggest_expression` como Agent Skill de Alexa+.
- El **orchestrator** (`orchestrator/app.py`) es la capa WebSocket/S3 que el frontend usa, y
  actúa como **cliente MCP real**: en cada análisis de pronunciación o sugerencia de
  expresión, abre una sesión MCP contra el servidor y llama sus tools por protocolo — no
  reimplementa la lógica.
- Modelo de feedback vía Amazon Bedrock.

## Desarrollo

```bash
pip install -e .
python -m english_coach_mcp.server        # servidor MCP local (stdio de desarrollo)
sam build && sam deploy --guided           # despliega ambas Lambdas + Function URL del MCP server
```

## Requisitos del hackathon

- Repo público, licencia open-source (MIT, ver [LICENSE](LICENSE)).
- Video demo (<3 min).
- Uso en runtime de la tecnología del track: el MCP server se despliega como Lambda con
  Function URL propia y el orchestrator lo invoca por protocolo MCP en cada request real
  (ver `McpServerUrl` en los outputs de `template.yaml` para probarlo de forma independiente).

## Estado

MCP server desplegado y verificado en runtime (invocado por el orchestrator vía Streamable
HTTP en cada análisis). Ver [AGENT.md](../AGENT.md) para contexto completo del hackathon.
