# English Coach AI — Frontend

SPA en React + Vite + Tailwind CSS para practicar pronunciación en inglés. Se conecta al WebSocket del pipeline serverless (`../template.yaml`: API Gateway → Lambda → S3 → Transcribe → Bedrock) definido en la raíz del proyecto.

## Identidad de marca

Header, footer y pantalla de login usan el logo y los enlaces de **Byron González (perroBlanco0)**: GitHub, LinkedIn y Devpost en el footer, y un distintivo "Arquitectura 100% serverless en AWS". Los assets están en [`public/brand/`](public/brand/), recortados desde el brand sheet original.

## Correr en local

```bash
npm install
cp .env.example .env      # completa VITE_WEBSOCKET_URL con el output "WebSocketEndpoint" del stack SAM
npm run dev                # http://localhost:5173
```

### Acceso demo (gate para jueces)

- Usuario: `demo`
- Contraseña: `AWSHACKATON2026BYRON`

La sesión se guarda en `localStorage` (no es un sistema de auth real, solo un gate simple para la demo).

## Flujo de voz (push-to-talk)

1. Al conectar el WebSocket, el cliente pide una URL pre-firmada de S3 (`request_upload_url`).
2. El usuario mantiene presionado el botón de grabación (máx. 5s) — captura con `MediaRecorder`.
3. Al soltar, el audio se sube directo a S3 vía `PUT` (evita el límite de 128KB de los frames WebSocket).
4. El cliente envía `analyze` con el `audio_key` y la frase objetivo.
5. El backend responde con `transcript` (Amazon Transcribe) y `feedback` (Amazon Bedrock); el puntaje visual se calcula en el cliente por superposición de palabras (ver [`src/lib/score.js`](src/lib/score.js)) mientras el feedback cualitativo viene del modelo.

## Build y despliegue a AWS

El `template.yaml` de la raíz agrega un bucket S3 privado (Origin Access Control) + distribución CloudFront con redirección de errores 403/404 a `index.html` (routing de SPA).

```bash
npm run build               # genera dist/
./deploy.sh [profile] [stack-name]   # sync a S3 + invalidación de CloudFront
```

`deploy.sh` lee el nombre del bucket y el ID de distribución directamente de los outputs del stack de CloudFormation, así que no hace falta configurarlos a mano.
