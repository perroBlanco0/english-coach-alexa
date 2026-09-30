# Alexa+ Preview: Category SDK vs. MCP y casos de marcas

## Respuesta ejecutiva

**Category SDK conviene cuando el servicio pertenece a una categoría comercial ya modelada por Alexa+ y la empresa quiere heredar una experiencia completa y uniforme. MCP Toolkit conviene cuando el caso no cabe en esas categorías, la empresa ya dispone de un servidor MCP o quiere reutilizar la integración con varios asistentes de IA.** Existe además un punto intermedio: **Category SDK: MCP**, actualmente documentado para reserva de viajes en vehículo, que usa MCP como transporte pero conserva el flujo de experiencia preconstruido por Alexa+.[^1][^2]

Los casos más maduros publicados son **OpenTable**, con reservas de restaurantes que ya pueden completarse mediante Alexa+, y las integraciones iniciales con **Grubhub, Uber Eats, Ticketmaster y Thumbtack**. Las marcas anunciadas para MCP —como Priceline, Canva, Lyft, Headspace y Virgin Atlantic— muestran el potencial de la nueva ruta, pero en su mayoría deben considerarse proyectos en Preview o anunciados para comenzar a construirse, no casos con resultados públicos consolidados.[^3][^4]

## Diferencias principales

| Aspecto | Category SDK: Action | Category SDK: MCP | MCP Toolkit |
|---|---|---|---|
| Mejor encaje | Empresas con API maduras dentro de una categoría admitida | Empresas de una categoría admitida que prefieren MCP | Servicios que no pertenecen a una categoría predefinida o que ya usan MCP con otros agentes.[^1] |
| Categorías documentadas | Restaurantes, pedidos de comida, servicios del hogar, reservas locales y entradas | Reserva de viajes en vehículo | Servicios de cualquier dominio, sujetos al proceso de Preview.[^1][^2] |
| Contrato backend | Service Provider Interfaces (SPI) definidos por Amazon | Herramientas MCP conectadas al flujo de categoría | Herramientas y recursos MCP definidos por el proveedor.[^2] |
| Control de experiencia | Bajo a medio: Alexa controla el flujo de voz y pantalla | Bajo a medio: Alexa mantiene el flujo de categoría | Alto: el proveedor puede definir herramientas, datos y una interfaz mediante MCP Apps.[^1][^5] |
| Experiencia incluida | Diálogo multi-turno, memoria, generación de respuestas y conexiones nativas con pagos o calendario | La misma experiencia preconstruida del Category SDK | Alexa gestiona lenguaje y representación; el proveedor diseña la capacidad y puede aportar UI propia.[^1][^2] |
| Portabilidad | Integración específica de Alexa+ | Protocolo MCP, pero ligado al flujo de categoría de Alexa+ | Mayor reutilización entre asistentes compatibles con MCP.[^1] |
| Esfuerzo | Bajo a moderado: hay que adaptar API a los SPI | Bajo: conecta herramientas MCP al flujo existente | Bajo si ya existe el servidor; mayor si deben diseñarse desde cero las herramientas y la experiencia.[^1] |
| Latencia | Pensado para comunicación estructurada de baja latencia | Baja | El servidor debe mantener menos de 500 ms de ida y vuelta para consultas.[^1] |
| Descubrimiento | Integración nativa en la categoría y descubrimiento conversacional | Igual que Category SDK | Alexa puede invocarlo explícita o implícitamente según la conversación.[^2][^6] |
| Disponibilidad | Solo socios seleccionados; Category SDK está documentado para Estados Unidos | Solo socios seleccionados | Solo socios seleccionados.[^7][^2] |

## Qué hereda Category SDK

Category SDK no es solo un paquete de llamadas API. Amazon entrega una experiencia de cliente preparada para producción: diálogo de varios turnos, seguimiento de memoria, ajuste de respuestas e integración con servicios de Alexa+ como pagos y calendario. El socio se concentra en inventario, disponibilidad, precios y ejecución de la transacción.[^2]

En la variante **Action**, las API de la marca se mapean a interfaces SPI predefinidas. Esto favorece respuestas consistentes y resiliencia ante cambios futuros, pero reduce la libertad para inventar un flujo completamente distinto del modelo de la categoría.[^2]

En **Category SDK: MCP**, Alexa+ invoca herramientas del servidor MCP, aunque sigue controlando la conversación y la experiencia. No debe confundirse con MCP Toolkit: el protocolo puede ser el mismo, pero Category SDK mantiene un esquema comercial y una UX ya definidos.[^1][^2]

## Qué aporta MCP Toolkit

MCP Toolkit permite llevar a Alexa+ un servidor MCP existente o crear uno nuevo. Alexa+ funciona como cliente MCP, descubre herramientas y recursos, genera el paquete del add-on y permite probarlo en el simulador; el proveedor puede reutilizar esa capa con otras plataformas compatibles con MCP.[^8][^1]

La flexibilidad añade responsabilidad. El equipo debe diseñar herramientas comprensibles para el modelo, esquemas robustos, errores recuperables, permisos, autenticación y, si usa una interfaz personalizada, componentes que funcionen en las superficies de Alexa+.[^9][^10]

La autenticación distingue operaciones de servicio mediante `client_credentials` y acciones del usuario mediante Authorization Code con PKCE. Así, Alexa puede consultar catálogos o descubrir herramientas sin intervención, pero solicita consentimiento cuando necesita ejecutar acciones personalizadas.[^11]

## Decisión práctica

- **Usar Category SDK: Action** si ya existe una API transaccional estable y el negocio es restaurante, comida, hogar, reserva local o ticketing.
- **Usar Category SDK: MCP** si el caso es ride booking y la empresa quiere conservar una capa MCP.
- **Usar MCP Toolkit** si el caso es productividad, educación, bienestar, viajes complejos u otro dominio no estandarizado.
- **Preferir Category SDK** si la prioridad es lanzar con rapidez y aceptar la UX de Alexa.
- **Preferir MCP Toolkit** si la prioridad es controlar herramientas y datos, reutilizar la integración y diferenciar la experiencia.
- **Para el hackathon**, construir un MCP autoalojado suele ser la alternativa más demostrable: el track acepta MCP 2025-11-25 o posterior con Streamable HTTP, Agent Skill o una simulación web.[^12]

## Casos con uso real

### OpenTable

OpenTable es el ejemplo más claro de integración operativa: un usuario puede pedir una reserva concreta, completar la acción y compartir el plan sin usar el teléfono. Amazon presenta la experiencia como una forma de llegar a nuevos comensales y generar reservas para más de 60.000 restaurantes asociados.[^4][^8]

OpenTable informó que el conjunto de sus integraciones con LLM —que incluye Alexa+, pero también otros asistentes— generó 17 veces más comensales sentados interanualmente y clientes con un gasto medio 20% superior al de otros canales. Estas cifras **no aíslan el aporte de Alexa+**, por lo que sirven como evidencia del valor del canal de IA conversacional, no como medición individual del producto de Amazon.[^13][^14]

**Patrón replicable:** mantener inventario y disponibilidad en tiempo real, presentar pocas opciones relevantes y permitir que la conversación termine en una reserva confirmada.

### Grubhub y Uber Eats

Alexa+ puede interpretar lo que el cliente quiere comer, relacionarlo con menús disponibles y realizar el pedido mediante Grubhub o Uber Eats. El valor no está en abrir una aplicación por voz, sino en traducir una preferencia informal en selección y ejecución.[^15][^4]

**Patrón replicable:** exponer catálogos estructurados, modificadores, disponibilidad y checkout; dejar que Alexa gestione la conversación y reduzca el número de decisiones visibles.

### Ticketmaster

La integración permite buscar entradas y configurar seguimiento de disponibilidad o precio, con notificaciones posteriores en la aplicación de Alexa. Es un ejemplo de experiencia que combina una conversación inicial con una acción proactiva futura.[^16][^4]

**Patrón replicable:** no limitar el add-on a una consulta puntual; conservar criterios como artista, ubicación y presupuesto para avisar cuando pueda completarse la tarea.

### Thumbtack

Amazon ha demostrado un flujo donde Alexa+ identifica la necesidad de reparar un horno, encuentra un proveedor mediante Thumbtack, autentica al cliente y organiza la visita. La marca obtiene descubrimiento contextual: Alexa puede ofrecer el servicio cuando detecta la necesidad, aunque el usuario no haya pronunciado “Thumbtack”.[^17][^15]

**Patrón replicable:** convertir un problema expresado en lenguaje cotidiano en clasificación del servicio, búsqueda de profesional, disponibilidad, solicitud y confirmación.

## Marcas en Preview

### Priceline

Priceline es el caso MCP anunciado con el recorrido más completo: inventario hotelero, recomendaciones personalizadas, descubrimiento y reserva dentro de una conversación. También figura entre las marcas que planean incorporar Amazon Wallet para finalizar el pago.[^3]

Sin embargo, Amazon lo describe como una de las primeras empresas que comenzaría a construir con MCP durante 2026. Por ello, es un **caso de diseño y adopción temprana**, no todavía un caso público con métricas verificables de conversión o satisfacción.[^3]

### Canva y Headspace

Canva y Headspace muestran por qué existe MCP Toolkit: productividad creativa y bienestar no encajan naturalmente en reservas de restaurante, comida, servicios del hogar o ticketing. MCP permite trasladar herramientas especializadas a Alexa+ sin forzarlas dentro de un contrato de categoría.[^1][^3]

Amazon aún no ha publicado detalles suficientes sobre sus flujos finales ni indicadores de uso. Su valor como referencia consiste en validar que Alexa+ busca expandirse más allá del comercio y el hogar inteligente.[^3]

### Lyft y transporte

Lyft fue anunciado entre las primeras marcas que construirían mediante MCP. La documentación actual ubica ride booking específicamente en **Category SDK: MCP**, señal de que Amazon quiere la interoperabilidad de MCP sin renunciar a una experiencia de categoría homogénea.[^2][^3]

Este caso ilustra que “Category SDK vs. MCP” no siempre es una elección excluyente. Una marca puede usar MCP en el backend y, al mismo tiempo, heredar el diálogo y la interfaz estandarizada de Alexa+.

### Atom Tickets y Fandango

Atom Tickets y Fandango representan la convergencia entre Category SDK y Amazon Wallet: explorar funciones, seleccionar asientos y comprar sin salir de Alexa+. Amazon identifica a Atom como un equipo que está lanzando experiencias y a ambas marcas dentro del grupo que planea completar tareas mediante Wallet.[^8][^3]

No se han publicado métricas de ventas atribuibles a Alexa+, por lo que el éxito verificable por ahora es técnico y estratégico: Amazon muestra el recorrido completo y las marcas participan como socios iniciales.

### Smart home

Bosch, Delta, Ecovacs, Govee, iRobot, Yale, Whirlpool y otras marcas prueban una tercera ruta distinta de Category SDK y MCP Toolkit: Smart Home AI Toolkit. La idea es que el cliente describa un resultado —por ejemplo, una rutina de café— y Alexa mapee la intención a capacidades particulares del dispositivo.[^3]

Estos ejemplos no deben utilizarse como prueba de resultados comerciales todavía. Son evidencia de amplitud del programa Preview y de que Amazon intenta reducir el trabajo necesario para exponer funciones que las interfaces tradicionales no soportaban.[^3]

## Madurez de los casos

| Nivel de evidencia | Marcas | Lectura correcta |
|---|---|---|
| Uso disponible y descrito para clientes | OpenTable, Grubhub, Uber Eats y Ticketmaster | Amazon documenta tareas concretas que los clientes pueden realizar.[^4] |
| Demostración o integración destacada | Thumbtack, Atom Tickets | Existen recorridos y testimonios oficiales, pero no resultados públicos detallados.[^8][^17] |
| Construcción anunciada con MCP | Priceline, Canva, Cengage, Headspace, Lyft, Viator, Virgin Atlantic y otras | Validan la dirección del ecosistema; no equivalen a disponibilidad general ni a éxito medido.[^3] |
| Preview de dispositivos | Bosch, iRobot, Yale, Whirlpool y otras | Prueban capacidades y automatización de smart home; faltan métricas públicas por marca.[^3] |

## Métricas recomendadas

Amazon ofrece métricas de engagement y embudos de finalización por categoría. Para reservas de restaurantes, por ejemplo, se pueden medir búsqueda, disponibilidad consultada, reserva confirmada, modificación y cancelación; en servicios del hogar se incluyen solicitud iniciada, completada, reprogramada y engagement con notificaciones.[^18]

Una marca debería evaluar:

- Tasa de descubrimiento a inicio de tarea.
- Tasa de disponibilidad encontrada.
- Tasa de confirmación o compra.
- Tiempo medio hasta completar la tarea.
- Abandono por paso y por dispositivo.
- Errores de herramienta y reintentos.
- Cancelaciones y reprogramaciones.
- Usuarios nuevos y repetición.
- Valor de transacción, cuando aplique.
- Porcentaje de operaciones que necesitaron soporte humano.

Sin estos indicadores, “caso de éxito” solo significa participación temprana o una demostración convincente. OpenTable aporta una señal comercial agregada sobre canales LLM, pero aún faltan cifras públicas que atribuyan reservas, ingresos o satisfacción exclusivamente a Alexa+.[^14][^13]

## Recomendación técnica

Para un desarrollador con experiencia en PHP, API, MySQL y AWS, la opción más conveniente para un prototipo es **MCP Toolkit**: permite construir un servicio propio sin depender de que el proyecto pertenezca a una categoría soportada y demuestra habilidades reutilizables en otros ecosistemas de agentes. Un servidor en Laravel o Slim puede exponer herramientas pequeñas, desplegarse con HTTPS en AWS y probarse mediante MCP Inspector antes de conectarse al simulador de Alexa+.[^10][^1]

Si el objetivo cambia de hackathon a una integración comercial de reservas, pedidos o entradas, Category SDK sería preferible porque ofrece el flujo conversacional, la experiencia visual y las conexiones de plataforma ya resueltas. En ambos casos, el acceso de producción sigue limitado a socios seleccionados durante Preview.[^7][^2]

## Conclusión

Category SDK optimiza **velocidad, consistencia y finalización transaccional** dentro de categorías maduras; MCP Toolkit optimiza **flexibilidad, portabilidad y control** fuera de ellas. Category SDK: MCP combina ambas ideas para categorías donde Amazon decide estandarizar la experiencia usando MCP como conexión.[^1][^2]

Los casos más útiles para aprender son OpenTable para reservas completas, Ticketmaster para seguimiento proactivo, Thumbtack para traducir problemas ambiguos en servicios y Priceline para visualizar el futuro de MCP más Wallet. La cautela clave es distinguir entre experiencias disponibles, demostraciones, socios construyendo en Preview y anuncios futuros; Amazon todavía no publica métricas específicas de Alexa+ para la mayoría de las marcas.[^4][^3]

---

## References

1. [Choose the Proper Alexa+ Integration Approach](https://developer.amazon.com/docs/alexaplus/add-ons/choose-the-proper-alexaplus-integration-approach.html) - Category SDK: MCP add-on. A category MCP add-on is for partners who prefer the MCP approach for a su...

2. [Overview of the Category SDK | Alexa+](https://developer.amazon.com/docs/alexaplus/add-ons/overview-category-sdk.html) - With a Category MCP Add-on, you connect your MCP server to the same pre-built Alexa+ customer experi...

3. [Alexa+ launches new ways to build experiences](https://developer.amazon.com/alexaplus/blogs/2026/07/alexa-plus-new-ways-to-build-experiences) - Discover new Alexa+ developer tools for smart home devices, voice experiences, and seamless service ...

4. [Top features you can try on Alexa+ - Amazon News](https://www.aboutamazon.com/news/devices/new-alexa-top-features) - Alexa+ is our next-generation AI assistant that gets things done—it solves daily problems, keeps you...

5. [Design Guide: Glossary | Alexa+](https://developer.amazon.com/docs/alexaplus/add-ons/mcp-addon-glossary.html) - An MCP tool response that contains data but no UI payload. Alexa renders data-only responses through...

6. [Alexa+ MCP Client and App Lifecycle (Category MCP Add- ...](https://developer.amazon.com/docs/alexaplus/add-ons/category-sdk-mcp-client-lifecycle.html) - When you deploy your MCP add-on, Alexa+ registers your add-on, connects to your MCP server, and regi...

7. [Alexa+ Developer Docs Home](https://developer.amazon.com/docs/alexaplus/add-ons/home.html) - Important: At this time, Category SDK and MCP Toolkit are available to select partners only. Alexa+ ...

8. [Alexa+ for Builders](https://developer.amazon.com/alexaplus/) - Build for Alexa+ and shape how customers interact with AI. Integrate with Category SDK, MCP Toolkit,...

9. [Design Guide: Introduction | Alexa+](https://developer.amazon.com/docs/alexaplus/add-ons/mcp-addon-design-guide-overview.html) - Introduction to Alexa+ add-on design, including integration paths, how customers reach your add-on, ...

10. [Test Your MCP Add-ons | Alexa+](https://developer.amazon.com/docs/alexaplus/add-ons/mcp-toolkit-test-add-ons.html) - Testing your Alexa+ MCP add-ons with the web simulator and physical devices

11. [Authentication for Category MCP Add-ons | Alexa+](https://developer.amazon.com/docs/alexaplus/add-ons/category-sdk-mcp-authentication.html) - Service-to-service API calls — Where no user context is needed. Tool discovery and capability negoti...

12. [Build across Amazon Devices and shape what's next. - Devpost](https://amazonappdev2026.devpost.com/?ref_feature=challenge&ref_medium=discover) - Build across Amazon Devices and shape what's next.

13. [AI-Powered Tools for Restaurants: OpenTable Innovations](https://www.opentable.com/restaurant-solutions/product-innovation/) - Discover OpenTable’s latest AI-powered tools built to help restaurants attract more diners, automate...

14. [OpenTable Launches Its Largest Suite of New and ...](https://www.prnewswire.com/news-releases/opentable-launches-its-largest-suite-of-new-and-updated-product-features-for-restaurants-302860569.html) - /PRNewswire/ -- OpenTable, a global leader in restaurant tech, today announced its largest suite of ...

15. [Introducing Alexa+, the next generation of Alexa - About Amazon](https://www.aboutamazon.com/news/devices/new-alexa-generative-artificial-intelligence?_bhlid=963b231941cd9cc8f53108b2bc957028402f4cea) - Powered by generative AI, Alexa+ is your personal AI assistant that gets things done—she’s smarter, ...

16. [Building Alexa+ Experiences...](https://developer.amazon.com/en-US/blogs/alexa/alexa-skills-kit/2025/02/new-alexa-announce-blog) - Experience our next-gen AI Assistant, Alexa + | More conversational, smarter, and personalized to he...

17. [The all-new Alexa+ and more: All the news from Amazon’s 2025 devices event](https://www.aboutamazon.com/news/devices/amazon-2025-devices-alexa-event-live-updates?p=alexa-connects-to-thousands-of-services-and-devices-to-take-action-for-customers) - Catch up on everything we announced at our Devices & Services event, including the new Alexa+.

18. [Add-on Metrics Catalog](https://www.developer.amazon.com/ja/docs/alexaplus/add-ons/addon-metrics-catalog.html) - Complete catalog of available metrics for Alexa+ add-ons, organized by family and category.

