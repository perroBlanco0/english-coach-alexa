# English Coach — Agent Skill for Alexa+

Coach de inglés conversacional por voz, construido como Agent Skill / MCP server para el track **Alexa+** del [Build, Ship, Shape: Amazon Developer Hackathon](https://amazonappdev2026.devpost.com/).

## Qué hace

- Analiza pronunciación, acento y ritmo del habla del usuario en tiempo real.
- Da feedback correctivo y sugiere expresiones coloquiales según contexto (viajes, trabajo, redes sociales).
- Adapta ejercicios de repetición al nivel del usuario.

## Arquitectura

- **MCP server** (transporte HTTP streamable) expone las tools de análisis de habla y generación de feedback como Agent Skill de Alexa+.
- Modelo de feedback vía Amazon Bedrock / Strands SDK.

## Desarrollo

```bash
pip install -e .
python -m english_coach_mcp.server
```

## Requisitos del hackathon

- Repo público, licencia open-source (MIT, ver [LICENSE](LICENSE)).
- Video demo (<3 min).
- Uso en runtime de la tecnología del track (MCP server real, no solo mencionado).

## Estado

En desarrollo activo. Ver [AGENT.md](../AGENT.md) para contexto completo del hackathon.
