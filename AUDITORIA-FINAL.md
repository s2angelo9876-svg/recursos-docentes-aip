# Auditoría final de Innova Bandera

Validación realizada en Codex Cloud con PostgreSQL 17 y Supabase Storage local. Las restauraciones y los cambios de datos de integración se ejecutaron en bases temporales.

| Sprint | Resultado |
| --- | --- |
| 1 · Datos y arranque | Alta y rotación explícitas del administrador. Migraciones registradas, PostgreSQL con verificación TLS para producción, respaldo validado y restauración transaccional. |
| 2 · Sesión y permisos | Sesión revocable en PostgreSQL con cookie HttpOnly. Catálogo protegido, firma de Storage según publicación o acceso, CSV seguro e IP resuelta por Express. El panel descarga un respaldo coherente del catálogo. |
| 3 · Dependencias y operación | Reemplazo de SheetJS, lectura XLSX/CSV con límites, Multer actualizado, cargas acotadas y validación por contenido. Retiro de respaldos históricos del árbol de trabajo. |
| 4 · Experiencia | Diálogos con foco, controles etiquetados, confirmaciones para acciones destructivas, portada adaptable y diccionario visual coherente. Auditoría se carga al abrir su pestaña. |
| 5 · Auditoría | Instalación limpia, auditorías de dependencias, pruebas unitarias y de PostgreSQL, recorridos de navegador y compilación Docker con una CA de proxy montada durante la instalación. |

## Evidencia

- `npm ci`, `npm run lint`, `npm test` y `npm run build` terminaron correctamente. `npm audit` y `npm audit --omit=dev` informaron 0 avisos conocidos en el árbol consultado.
- `npm run test:integration` verificó que aplicar la migración dos veces conserva el esquema y que PostgreSQL revierte por completo una restauración ante un error de inserción. Agregué la prueba al flujo de CI.
- Los recorridos locales comprobaron inicio y cierre de sesión, acceso a Recursos, respaldo autenticado, importación de docentes por CSV, lectura XLSX, separación de permisos de Docente y Administrador, carga de una imagen, aislamiento del borrador y acceso tras publicar.
- Chromium comprobó las seis rutas públicas en temas claro y oscuro, la persistencia de sesión al recargar, búsqueda móvil, navegación de galería con teclado, retorno del foco y recuperación cuando Noticias fallaba. La última pasada de axe no marcó infracciones en las seis rutas públicas, la biblioteca autenticada, el editor, Administración, Usuarios, Portada, Auditoría y la galería con datos de prueba. La revisión cubre los estados y las reglas ejecutadas.
- El bloque inicial de Administración quedó en unos 40 kB sin comprimir, frente a unos 437 kB. Los gráficos se descargan al abrir Auditoría. Las variantes de la foto de portada pesan aproximadamente 56 y 143 KiB. El escudo web pesa unos 6 KiB.
- La imagen de Docker compiló al proporcionar la CA de Codex Cloud a BuildKit. El contenedor de comprobación leyó el servidor y el build como usuario sin privilegios y cargó Sharp.

## Antes de publicar

Ejecuta las migraciones, provisiona o rota la cuenta administradora y aplica las comprobaciones de staging descritas en la guía. La verificación incluye la cadena TLS del PostgreSQL real, las políticas de Storage, el proxy Vercel/Render y las integraciones de producción con Google Drive. El respaldo descargable contiene el catálogo y referencias de adjuntos. Conserva una copia de los objetos y de la base mediante las herramientas del proveedor. [Guía de despliegue](DESPLIEGUE.md)

La ruta recomendada de diseño es Biblioteca pedagógica, con la vitrina de evidencias como complemento. [Comparativa de propuestas](PROPUESTAS-DISENO.md)
