# Despliegue y recuperación de Innova Bandera

## Preparar una instalación

1. Configura `DATABASE_URL`, `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en el gestor de secretos del servidor. PostgreSQL verifica el certificado por defecto. Para una CA privada, instala la cadena PEM mediante `DATABASE_CA_CERT`. Solo el entorno de desarrollo admite `sslmode=disable` con PostgreSQL en loopback.
2. Configura un bucket privado. `node scripts/create-bucket.js` crea el bucket o cambia su visibilidad a privada. Limita las políticas de lectura directa en Supabase y comprueba que una cuenta anónima no puede descargar archivos privados.
3. Toma una copia del contenido de producción y ejecuta `npm run migrate` como paso de release. Las migraciones registran la versión instalada y se serializan en PostgreSQL. El servidor de producción comprueba esa versión al arrancar.
4. Provisiona o rota la primera cuenta con `npm run admin:provision` y las variables temporales `ADMIN_USERNAME` y `ADMIN_PASSWORD`. El comando puede rotar una cuenta de administrador con ese nombre. Retira dichas variables del entorno después de ejecutar la operación. Las cuentas de administración heredadas con contraseñas de menos de 12 caracteres requieren rotación.
5. Inicia con `npm run start` después de generar `dist` con `npm run build` si Express sirve el frontend. Si usas Vercel y Render, Vercel debe reenviar `/api/*` al backend y la URL pública HTTPS debe figurar en `CORS_ORIGIN`. Verifica en staging que el proxy conserva `Set-Cookie` y evita cachear respuestas de sesión. Define `TRUSTED_PROXIES` solo con las redes que controlan la cabecera de IP reenviada.

En Docker, aplica `docker compose run --rm app npm run migrate` antes de arrancar el servicio. En Codex Cloud, si el proxy de compilación requiere una CA, usa `docker build --secret id=proxy_ca,src="$CODEX_PROXY_CERT" -t innova-bandera .`. BuildKit monta la CA solo durante la instalación y conserva la verificación TLS. Para desarrollo, `npm run dev` aplica migraciones automáticamente. `SEED_DEMO_CONTENT=1` habilita el catálogo de ejemplo en desarrollo.

## Respaldo y restauración

La acción «Descargar respaldo» del panel guarda una instantánea JSON del catálogo en el dispositivo administrador. Conserva también copias de PostgreSQL y de Supabase Storage con las herramientas del proveedor. El archivo de catálogo contiene referencias a los adjuntos, por lo que cada restauración de archivos se comprueba junto con el bucket correspondiente.

Prueba los respaldos en una base aislada. El importador exige las cuatro secciones y admite JSON vigente y el formato sin versión. La restauración valida el archivo antes del reemplazo y revierte la transacción completa ante un error.

Al eliminar una publicación, sus objetos se mantienen en el bucket para preservar objetos compartidos y respaldos. Aplica tu política de retención a objetos sin referencias después de revisar publicaciones, borradores y respaldos. Las copias históricas retiradas del árbol siguen presentes en el historial de Git.

## Verificación de release

- Ejecuta `npm ci`, `npm run lint`, `npm test`, `npm run build` y `npm audit`.
- En staging, prueba sesión persistente, cierre de sesión, permisos Docente e Invitado, imágenes públicas y archivos privados. Valida los encabezados TLS y la IP registrada detrás del proxy real.
- Comprueba Google Drive y YouTube con las credenciales y restricciones de referente del despliegue. Revisa la autorización institucional de las fotografías antes de publicar.
