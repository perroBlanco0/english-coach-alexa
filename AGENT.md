# Contexto del Proyecto — Amazon Developer Hackathon 2026

## Hackathon
- **Nombre**: Build, Ship, Shape: Amazon Developer Hackathon
- **Plataforma**: https://amazonappdev2026.devpost.com/
- **Deadline**: 23 de octubre de 2026, 12:00pm PDT
- **Premio total**: $138,000 USD

## Track elegido: Alexa+
Construir un **Agent Skill / MCP server** para Alexa+ (o una experiencia simulada en web app usando herramientas agénticas). No requiere hardware físico — el track es simulable vía web.

## Idea del proyecto
**Coach de inglés conversacional por voz**, integrado como Agent Skill de Alexa+:
- El usuario practica pronunciación en voz alta y recibe retroalimentación en tiempo real sobre acento, ritmo y claridad.
- Enseña expresiones coloquiales y "slang" según contexto (viajes, trabajo, redes sociales).
- Ejercicios de repetición y corrección adaptados al nivel del usuario.
- Usa herramientas agénticas (MCP) para analizar el habla y generar feedback personalizado en cada sesión.

## Requisitos de entrega (obligatorios para cualquier track)
- Demo funcional
- Repositorio público en GitHub con el código fuente
- Feedback sobre las herramientas usadas
- Video demo de menos de 3 minutos

## Criterios de evaluación
Implementación técnica, calidad de diseño, impacto potencial, creatividad de la idea — con énfasis en el uso efectivo de las tecnologías requeridas del track.

## Recursos clave
- **Build with Agent Skills** (guía de integración MCP): https://apps.extensions.modelcontextprotocol.io/api/#build-with-agent-skills
- **Streamable HTTP Transport**: especificación de Model Context Protocol para transporte HTTP
- **Amazon Devices Builder Tools**: MCP server + Agent Skills para asistentes de codificación IA (análisis de crashes, perfilado, búsqueda en docs)
- **Sample code**: https://github.com/amazonappdev
- **AWS Builder Center**: tutoriales de Bedrock, AgentCore, Strands SDK, Kiro, SageMaker
- **Créditos AWS**: $150 disponibles vía formulario durante el hackathon

## Mini-challenges disponibles (apilables sobre el track principal)
- AWS Builder integration — $5,000
- Open Source contribution — $5,000

## Estado actual
- Formulario de inscripción respondido con la idea del coach de inglés.
- Aún no se ha iniciado el desarrollo (repo vacío al momento de crear este archivo).
- Créditos AWS ($150) solicitados vía formulario — a la fecha (17 sep 2026) sin respuesta.

## Próximos pasos sugeridos
1. Revisar sample code en github.com/amazonappdev para entender la estructura esperada de un MCP server / Agent Skill.
2. Definir arquitectura: MCP server (transporte HTTP) + lógica de análisis de habla (posible uso de Bedrock/Strands SDK para el modelo de feedback de pronunciación).
3. Solicitar los $150 de créditos AWS.
4. Prototipar el flujo conversacional básico antes de integrar análisis de audio real.
5. Preparar demo video (<3 min) y documentación del repo antes del deadline.

## Reglas oficiales (resumen) — https://amazonappdev2026.devpost.com/rules

### Elegibilidad
- Edad mínima: mayoría de edad en el país de residencia; países no sancionados.
- Excluidos: empleados/familiares de organizadores, jueces, y entidades con conflicto de interés.
- Equipos requieren un representante autorizado.

### Cronograma
- **Inscripciones/submissions**: 31 ago 2026 (10:15 AM PT) – 23 oct 2026 (12:00 PM PT)
- **Judging**: 9–20 nov 2026
- **Anuncio de ganadores**: 3 dic 2026

### Requisitos de entrega
- App funcional (nueva o "significativamente actualizada") dentro de uno de los 4 tracks (Fire TV, Alexa+, Bee, Ring), usando las herramientas requeridas del track.
- Repositorio público en GitHub con **licencia open-source**.
- Descripción en texto + video demo (<3 min).
- Feedback sobre las herramientas usadas.
- El código debe demostrar uso en **runtime** de la tecnología del track (no basta con mencionarla).
- Opcional: mini-challenges (AWS Builder u Open Source) para premios extra.

### Propiedad intelectual / trabajo original
- El proyecto debe ser de propiedad exclusiva del participante, sin derechos de terceros.
- Se permite software open-source si se cumplen sus licencias.
- El proyecto NO puede haber recibido apoyo financiero del sponsor antes de la entrega.

### Herramientas de terceros / IA
- Cualquier SDK/API/dato de terceros debe usarse con autorización según sus términos.
- Componentes open-source permitidos con atribución y cumplimiento de licencia.

### Proceso de judging
- **Etapa 1**: pass/fail de viabilidad básica.
- **Etapa 2**: 4 criterios con igual peso — Implementación técnica, Diseño, Impacto potencial, Calidad de la idea. Bono de hasta 10% por enviar un "friction log".
- Desempates: comparación secuencial de criterios; empate final decidido por voto de jueces.

### Premios
- Premios de track: $4,000–$25,000 en efectivo + créditos AWS.
- Mini-challenges: $5,000 efectivo + $5,000 créditos c/u.
- **Un proyecto solo puede ganar 1 premio de track y 1 de mini-challenge.**
- Pago a individuo, representante de equipo, u organización, tras verificación y formularios fiscales.

### Descalificación
- Falla en Etapa 1, violación de IP, contenido de terceros sin permiso, malware, apoyo financiero no divulgado del sponsor, manipulación o conducta antideportiva.

### ⚠️ Puntos críticos para nuestro proyecto (coach de inglés en Alexa+)
- Necesitamos **licencia open-source** en el repo de GitHub desde el inicio.
- ~~El código debe usar la tecnología del track **en runtime**, no solo mencionarla~~ —
  **resuelto** (2026-09-23): el MCP server (`english-coach-alexa/src/english_coach_mcp/server.py`)
  se despliega como Lambda propia con Function URL (Streamable HTTP), y el orchestrator
  (`orchestrator/app.py`) es un cliente MCP real que lo invoca en cada `analyze` /
  `suggest_expression`. Verificable en los logs de CloudWatch del orchestrator (llamada
  saliente al `McpServerUrl`) o probando ese endpoint directo con un cliente MCP.
- Considerar enviar un **friction log** para el bono de hasta 10% — la migración de MCP
  server "mencionado" a "invocado en runtime" es justamente el tipo de fricción a documentar.
- Confirmar que ninguna librería de análisis de voz/pronunciación tenga licencia incompatible con distribución open-source.
- Diferenciación frente a otros proyectos del track (pendiente de decidir si se aborda):
  la mayoría de los proyectos serán bots de texto de un turno; nosotros ya tenemos pipeline
  de voz real + feedback en español para hispanohablantes. Para reforzar el criterio de
  "creatividad" (flujos agénticos multi-servicio, tarjetas/MCP Apps) se evaluó agregar una
  tercera tool con memoria de progreso entre sesiones y/o una tarjeta `ui://` en vez de JSON
  plano — no implementado aún.
