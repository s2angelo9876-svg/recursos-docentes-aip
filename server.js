import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { Op } from "sequelize";
import { randomUUID } from "node:crypto";
import { sessionService } from "./server/services/sessions.js";
import { storagePath, visibleStoragePaths } from "./server/services/storage-access.js";
import { createDatabase } from "./server/database.js";
import { checkMigrations, migrate } from "./server/migrations/index.js";
import { csvCell } from "./shared/csv.js";
import { parseBackup, restoreBackup } from "./server/services/backup.js";
import { defineModels } from "./server/models.js";
import { fileTypeFromBuffer } from "file-type";
import { readTeacherRows } from "./server/services/spreadsheet.js";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_FILES, MAX_UPLOAD_MIB } from "./shared/upload-limits.js";
import {
  uploadFile,
  getSignedUrl,
  getBucketName,
  verifyPrivateBucket,
} from "./server/services/storage.js";
import logger from "./server/services/logger.js";
import { validateBody } from "./server/middleware.js";
import {
  recursoSchema,
  tutorialSchema,
  noticiaSchema,
  evidenciaSchema,
  usuarioSchema,
  passwordUpdateSchema,
  heroSlideSchema,
} from "./server/validators.js";
import {
  setAuditoriaModel,
  registrarAuditoria,
  auditoriaFromRequest,
  getClientIp,
  getUserAgent,
} from "./server/services/auditoria.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

const app = express();
const trustedProxies = (process.env.TRUSTED_PROXIES || "").split(",").map((value) => value.trim()).filter(Boolean);
if (trustedProxies.length) app.set("trust proxy", trustedProxies);
const browserOrigins = (process.env.CORS_ORIGIN || "").split(",").map((value) => value.trim()).filter(Boolean);

const supabaseHost = process.env.SUPABASE_URL
  ? new URL(process.env.SUPABASE_URL).origin
  : null;

// Security headers
app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      mediaSrc: ["'self'", "https:", "blob:"],
      frameSrc: ["'self'", "https://www.youtube.com", "https://www.youtube-nocookie.com", "https://youtube.com"],
      connectSrc: supabaseHost ? ["'self'", supabaseHost] : ["'self'"],
      workerSrc: ["'self'", "blob:"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
}));

// CORS & parse JSON
app.use(cors({
  origin: browserOrigins,
  credentials: true,
}));
app.use("/api", (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.get("Origin");
  if (req.get("Sec-Fetch-Site") === "cross-site" ||
      (origin && !browserOrigins.includes(origin) && origin !== `${req.protocol}://${req.get("Host")}` &&
        (isProduction || !/^http:\/\/(localhost|127\.0\.0\.1):5173$/.test(origin))) ||
      (!origin && req.get("Cookie") && req.get("Sec-Fetch-Site") !== "same-origin")) {
    return res.status(403).json({ error: "Origen de la solicitud no autorizado." });
  }
  next();
});
app.use("/api/import", express.json({ limit: "5mb" }));
app.use(express.json({ limit: "100kb" }));

// --- RATE LIMITERS ---
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 600 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas peticiones. Intente más tarde." },
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 30 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas subidas de archivos. Intente más tarde." },
});

const auditoriaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 60 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas consultas de auditoría. Intente más tarde." },
});

// Firmar URLs de Storage: endpoint público (necesario para que los visitantes
// anónimos puedan ver imágenes de la web). Es permisivo porque las URLs
// igual expiran en 10 min y el backend cachea 1 min.
const signedUrlLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 3000 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes de imágenes. Intente más tarde." },
});

app.use("/api/", apiLimiter);
app.use("/api/upload", uploadLimiter);
app.use("/api/uploads", uploadLimiter);
app.use("/api/admin/auditoria", auditoriaLimiter);

const sequelize = createDatabase(process.env.DATABASE_URL, process.env.DATABASE_CA_CERT);

// --- SEQUELIZE SCHEMA DEFINITIONS ---

const { Sesion, Usuario, Recurso, Tutorial, Noticia, Evidencia, AuditoriaSesion, HeroSlide } = defineModels(sequelize);
setAuditoriaModel(AuditoriaSesion);
const sessions = sessionService(Sesion, Usuario, isProduction);

// --- AUDITED AUTHENTICATION MIDDLEWARE ---

async function authenticateSession(req, res, next) {
  res.set("Cache-Control", "private, no-store");
  try {
    req.user = await sessions.read(req);
    if (!req.user) return res.status(401).json({ error: "Inicia sesión para continuar." });
    next();
  } catch (error) {
    next(error);
  }
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.rol)) {
      return res.status(403).json({ error: "No tienes permisos suficientes para esta acción." });
    }
    next();
  };
}

// --- MULTER STORAGE ENGINE ---
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf", "image/png", "image/jpeg", "image/webp", "image/gif", "image/avif",
  "video/mp4", "video/webm",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword", "application/vnd.ms-powerpoint",
]);

async function detectUploadMime(file) {
  const detected = await fileTypeFromBuffer(file.buffer).catch(() => null);
  if (detected && ALLOWED_MIME_TYPES.has(detected.mime)) return detected.mime;
  if (detected?.mime === "application/x-cfb" && /\.(doc|ppt)$/i.test(file.originalname)) {
    return "application/octet-stream";
  }
  const error = new Error("El contenido del archivo no coincide con un formato admitido.");
  error.status = 415;
  throw error;
}

let activeUploads = 0;
function limitConcurrentUploads(_req, res, next) {
  if (activeUploads >= 3) return res.status(429).json({ error: "Hay otras cargas en curso. Inténtalo en unos segundos." });
  activeUploads++;
  const release = () => {
    activeUploads--;
    res.off("finish", release);
    res.off("close", release);
  };
  res.once("finish", release);
  res.once("close", release);
  next();
}

function cleanFileName(originalName) {
  const name = path.basename(originalName || "archivo");
  const ext = path.extname(name).toLowerCase();
  let base = path.basename(name, ext).replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 100);
  if (!base) base = "archivo";
  return `${base}${ext}`;
}

function generateFileName(originalName) {
  return `${Date.now()}-${cleanFileName(originalName)}`;
}

// Mime types que sí convertimos a AVIF (imágenes raster con compresión con pérdida).
// SVG y GIF animados quedan fuera (AVIF no soporta animación y SVG es vectorial).
const AVIF_CONVERTIBLE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

// Convierte un buffer de imagen a AVIF para reducir ~70% del tamaño
// preservando la resolución y calidad visual (quality 80 = imperceptible vs original).
// Si el archivo no es una imagen convertible, devuelve el buffer original intacto.
async function convertToAvifIfImage(buffer, mimetype) {
  if (!AVIF_CONVERTIBLE_MIMES.has(mimetype)) {
    return { buffer, mimetype, converted: false };
  }
  try {
    const avifBuffer = await sharp(buffer, { limitInputPixels: 24000000 })
      .rotate() // respeta orientación EXIF
      .avif({
        quality: 80,        // 80 = punto dulce calidad/tamaño para AVIF
        effort: 4,           // 0 (rápido) → 9 (lento). 4 es balance.
        chromaSubsampling: "4:4:4", // sin pérdida de color
      })
      .toBuffer();
    return { buffer: avifBuffer, mimetype: "image/avif", converted: true };
  } catch (err) {
    logger.warn("No se pudo convertir la imagen", { error: err.message });
    const failure = new Error("La imagen no se pudo leer o supera el máximo de 24 megapíxeles.");
    failure.status = 415;
    throw failure;
  }
}

const WATERMARK_TEXT = "I.E. Bandera del Perú · AIP";
const WATERMARKABLE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

// Aplica una marca de agua diagonal repetida sobre la imagen usando sharp + SVG.
// Devuelve { buffer, applied: true } si pudo, o { buffer, applied: false } si falla.
async function applyWatermarkToBuffer(buffer, mimetype) {
  if (!WATERMARKABLE_MIMES.has(mimetype)) {
    return { buffer, applied: false };
  }
  try {
    const meta = await sharp(buffer, { limitInputPixels: 24000000 }).metadata();
    const w = meta.width || 1200;
    const h = meta.height || 800;
    const fontSize = Math.max(18, Math.round(w / 35));
    const charW = fontSize * 0.55;
    const textWidth = WATERMARK_TEXT.length * charW;
    const stepX = textWidth + 80;
    const stepY = 220;
    const cols = Math.ceil(w / stepX) + 1;
    const rows = Math.ceil(h / stepY) + 1;

    const texts = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * stepX - textWidth / 2;
        const y = r * stepY + fontSize;
        texts.push(
          `<text x="${x}" y="${y}" font-family="Inter, Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="white" fill-opacity="0.30" stroke="black" stroke-opacity="0.18" stroke-width="1" transform="rotate(-28 ${x} ${y})">${WATERMARK_TEXT}</text>`
        );
      }
    }

    const svgOverlay = Buffer.from(
      `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${texts.join("")}</svg>`
    );

    const watermarked = await sharp(buffer, { limitInputPixels: 24000000 })
      .composite([{ input: svgOverlay, top: 0, left: 0 }])
      .toBuffer();

    return { buffer: watermarked, applied: true };
  } catch (err) {
    logger.warn(`[WATERMARK] No se pudo aplicar watermark a ${mimetype}: ${err.message}. Se sube sin marca.`);
    return { buffer, applied: false };
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: MAX_UPLOAD_FILES, fields: 2, parts: MAX_UPLOAD_FILES + 3, fieldSize: 1024 },
});

// --- AUTHENTICATION API ROUTES ---

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 10 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Demasiados intentos. Intente en 15 minutos." },
});

app.post("/api/auth/register", authenticateSession, requireRole(["Administrador"]), validateBody(usuarioSchema), async (req, res) => {
  try {
    const { nombre, usuario, contrasenia, contrasena, password, rol } = req.body;
    const passwordInput = contrasenia || contrasena || password;

    const hash = bcrypt.hashSync(passwordInput, 10);
    const user = await Usuario.create({ nombre, usuario, contrasenia: hash, rol });

    await auditoriaFromRequest(req, {
      usuarioId: req.user.id,
      usuarioNombre: req.user.nombre,
      usuario: req.user.usuario,
      rol: req.user.rol,
      accion: "USUARIO_CREADO",
      entidad: "usuario",
      entidadId: user.id,
      detalle: `Usuario "${usuario}" creado con rol ${rol}`,
      exito: true,
    });

    res.status(201).json({ success: true, user: { id: user.id, usuario: user.usuario, rol: user.rol } });
  } catch (err) {
    await auditoriaFromRequest(req, {
      usuarioId: req.user?.id,
      usuarioNombre: req.user?.nombre,
      usuario: req.user?.usuario,
      rol: req.user?.rol,
      accion: "USUARIO_CREADO",
      entidad: "usuario",
      detalle: `Error al crear usuario: ${err.message}`,
      exito: false,
    });

    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ error: "El nombre de usuario ya está registrado." });
    }
    logger.error("Error al registrar usuario", { error: err.message, stack: err.stack });
    res.status(500).json({ error: "No se pudo completar la operación." });
  }
});

app.get("/api/auth/users", authenticateSession, requireRole(["Administrador"]), async (_req, res, next) => {
  try {
    const list = await Usuario.findAll({
      attributes: ["id", "nombre", "usuario", "rol"],
      order: [["id", "DESC"]]
    });
    res.json(list);
  } catch (err) {
    next(err);
  }
});

app.delete("/api/auth/users/:id", authenticateSession, requireRole(["Administrador"]), async (req, res) => {
  try {
    const { id } = req.params;
    if (String(req.user.id) === String(id)) {
      return res.status(400).json({ error: "No puedes eliminar tu propio usuario administrador." });
    }
    const user = await sequelize.transaction(async (transaction) => {
      await sequelize.query("SELECT pg_advisory_xact_lock(27081643)", { transaction });
      const actor = await Usuario.findByPk(req.user.id, { transaction });
      if (actor?.rol !== "Administrador") return null;
      const target = await Usuario.findByPk(id, { transaction });
      if (target) await target.destroy({ transaction });
      return target;
    });
    if (!user) return res.status(404).json({ error: "Usuario no disponible." });

    await auditoriaFromRequest(req, {
      usuarioId: req.user.id,
      usuarioNombre: req.user.nombre,
      usuario: req.user.usuario,
      rol: req.user.rol,
      accion: "USUARIO_ELIMINADO",
      entidad: "usuario",
      entidadId: Number(id),
      detalle: `Usuario "${user.usuario}" eliminado`,
      exito: true,
    });

    res.json({ success: true });
  } catch (err) {
    logger.error("Error al eliminar usuario", { error: err.message, stack: err.stack });
    res.status(500).json({ error: "No se pudo completar la operación." });
  }
});

app.put("/api/auth/users/:id/password", authenticateSession, requireRole(["Administrador"]), validateBody(passwordUpdateSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { contrasenia, contrasena, password } = req.body;
    const passwordInput = contrasenia || contrasena || password;

    const user = await Usuario.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const hash = bcrypt.hashSync(passwordInput, 10);
    user.contrasenia = hash;
    await user.save();

    await auditoriaFromRequest(req, {
      usuarioId: req.user.id,
      usuarioNombre: req.user.nombre,
      usuario: req.user.usuario,
      rol: req.user.rol,
      accion: "CONTRASENA_ACTUALIZADA",
      entidad: "usuario",
      entidadId: Number(id),
      detalle: `Contraseña actualizada para usuario "${user.usuario}"`,
      exito: true,
    });

    res.json({ success: true });
  } catch (err) {
    logger.error("Error al actualizar contraseña", { error: err.message, stack: err.stack });
    res.status(500).json({ error: "No se pudo completar la operación." });
  }
});

const uploadExcel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0, parts: 2 }
});

app.post("/api/docentes/bulk-upload", authenticateSession, requireRole(["Administrador"]), limitConcurrentUploads, uploadExcel.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se ha proporcionado ningún archivo." });
    }

    let rawRows;
    try {
      rawRows = await readTeacherRows(req.file.buffer, req.file.originalname);
    } catch {
      return res.status(400).json({ error: "Usa un XLSX o CSV válido, de hasta 1000 filas, con las columnas del formato de docentes." });
    }

    if (rawRows.length === 0) {
      return res.status(400).json({ error: "El archivo Excel está vacío o no contiene filas válidas." });
    }

    const createdUsers = [];
    const duplicateUsers = [];
    const invalidRows = [];

    for (let i = 0; i < rawRows.length; i++) {
      const normalizedRow = rawRows[i];

      const nombre = normalizedRow["NOMBRES Y APELLIDOS"] ? String(normalizedRow["NOMBRES Y APELLIDOS"]).trim() : null;
      const dni = normalizedRow["DNI"] ? String(normalizedRow["DNI"]).trim() : null;
      const password = normalizedRow["PASSWORD"] ? String(normalizedRow["PASSWORD"]).trim() : null;
      const cargo = normalizedRow["CARGO"] ? String(normalizedRow["CARGO"]).trim() : null;
      const condicion = normalizedRow["CONDICION"] ? String(normalizedRow["CONDICION"]).trim() : null;
      const correo = normalizedRow["CORREO ELECTRONICO"] ? String(normalizedRow["CORREO ELECTRONICO"]).trim() : null;
      const celular = (normalizedRow["N° CELULAR"] || normalizedRow["N CELULAR"] || normalizedRow["CELULAR"] || normalizedRow["N°CELULAR"])
        ? String(normalizedRow["N° CELULAR"] || normalizedRow["N CELULAR"] || normalizedRow["CELULAR"] || normalizedRow["N°CELULAR"]).trim()
        : null;
      const area = normalizedRow["AREA"] ? String(normalizedRow["AREA"]).trim() : null;

      if (!nombre || !dni || !password) {
        invalidRows.push({
          rowNumber: i + 2,
          error: "Faltan campos obligatorios (NOMBRES Y APELLIDOS, DNI, o PASSWORD)."
        });
        continue;
      }

      if (dni.length < 3) {
        invalidRows.push({
          rowNumber: i + 2,
          error: "El DNI (usuario) debe tener al menos 3 caracteres."
        });
        continue;
      }

      if (password.length < 12 || Buffer.byteLength(password) > 72) {
        invalidRows.push({
          rowNumber: i + 2,
          error: "La contraseña debe tener al menos 12 caracteres y un máximo de 72 bytes."
        });
        continue;
      }

      const orConditions = [{ usuario: dni }];
      if (correo) {
        orConditions.push({ correo: correo });
      }

      const existingUser = await Usuario.findOne({
        where: {
          [Op.or]: orConditions
        }
      });

      if (existingUser) {
        duplicateUsers.push({
          rowNumber: i + 2,
          dni,
          correo,
          reason: existingUser.usuario === dni ? "El DNI ya está registrado como usuario." : "El correo electrónico ya existe."
        });
        continue;
      }

      const hash = bcrypt.hashSync(password, 10);

      const newUser = await Usuario.create({
        nombre,
        usuario: dni,
        contrasenia: hash,
        rol: "Docente",
        cargo,
        condicion,
        correo,
        celular,
        area
      });

      createdUsers.push(newUser);
    }

    await auditoriaFromRequest(req, {
      usuarioId: req.user.id,
      usuarioNombre: req.user.nombre,
      usuario: req.user.usuario,
      rol: req.user.rol,
      accion: "USUARIOS_CARGA_MASIVA",
      entidad: "usuario",
      detalle: `Carga masiva: creados ${createdUsers.length}, duplicados omitidos ${duplicateUsers.length}, inválidos omitidos ${invalidRows.length}`,
      exito: true,
    });

    res.status(200).json({
      success: true,
      message: `Carga masiva finalizada con éxito. Creados: ${createdUsers.length}, Duplicados: ${duplicateUsers.length}, Erróneos: ${invalidRows.length}.`,
      insertedCount: createdUsers.length,
      duplicateCount: duplicateUsers.length,
      invalidCount: invalidRows.length,
      duplicates: duplicateUsers,
      invalidRows: invalidRows
    });

  } catch (err) {
    logger.error("Error en carga masiva de docentes", { error: err.message, stack: err.stack });
    res.status(500).json({ error: "No se pudo procesar el archivo." });
  }
});

app.post("/api/auth/login", loginLimiter, async (req, res) => {
  const { usuario, contrasenia } = req.body;
  const clientIp = getClientIp(req);
  const userAgent = getUserAgent(req);

  try {
    // 1. Validar campos obligatorios
    if (typeof usuario !== "string" || !usuario.trim() || usuario.length > 50 ||
      typeof contrasenia !== "string" || !contrasenia || Buffer.byteLength(contrasenia) > 72) {
      await registrarAuditoria({
        usuario: usuario || null,
        accion: "LOGIN_FALLIDO",
        detalle: "Campos de usuario o contraseña vacíos",
        ip: clientIp,
        userAgent,
        exito: false,
      });
      return res.status(400).json({ success: false, error: "Usuario y contraseña requeridos." });
    }

    // 2. Buscar en la base de datos
    const user = await Usuario.findOne({ where: { usuario } });

    if (!user) {
      await registrarAuditoria({
        usuario,
        accion: "LOGIN_FALLIDO",
        detalle: "Usuario no registrado",
        ip: clientIp,
        userAgent,
        exito: false,
      });
      return res.status(401).json({ success: false, error: "Usuario o contraseña incorrectos." });
    }

    // 3. Comparar contraseña usando bcrypt de forma síncrona
    const passwordValido = typeof contrasenia === "string" &&
      !(user.rol === "Administrador" && contrasenia.length < 12) &&
      await bcrypt.compare(contrasenia, user.contrasenia);
    if (!passwordValido) {
      await registrarAuditoria({
        usuarioId: user.id,
        usuarioNombre: user.nombre,
        usuario: user.usuario,
        rol: user.rol,
        accion: "LOGIN_FALLIDO",
        detalle: "Contraseña incorrecta",
        ip: clientIp,
        userAgent,
        exito: false,
      });
      return res.status(401).json({ success: false, error: "Usuario o contraseña incorrectos." });
    }

    await sessions.open(req, res, user);
    res.set("Cache-Control", "private, no-store");

    // 5. Registrar auditoría de login exitoso
    await registrarAuditoria({
      usuarioId: user.id,
      usuarioNombre: user.nombre,
      usuario: user.usuario,
      rol: user.rol,
      accion: "LOGIN_EXITOSO",
      detalle: "Inicio de sesión exitoso",
      ip: clientIp,
      userAgent,
      exito: true,
    });

    // 6. Responder estructuradamente al AppContext del frontend
    return res.json({
      success: true,
      user: {
        usuario: user.usuario,
        nombre: user.nombre,
        rol: user.rol
      }
    });

  } catch (error) {
    logger.error("Error crítico en el login", { error: error.message, stack: error.stack, usuario, ip: clientIp });
    return res.status(500).json({ success: false, error: "Error en el servidor de base de datos." });
  }
});

app.get("/api/auth/session", authenticateSession, (req, res) => {
  res.json({ user: req.user });
});

app.post("/api/auth/logout", authenticateSession, async (req, res) => {
  try {
    await sessions.close(req, res);
    await auditoriaFromRequest(req, {
      usuarioId: req.user.id,
      usuarioNombre: req.user.nombre,
      usuario: req.user.usuario,
      rol: req.user.rol,
      accion: "LOGOUT",
      detalle: "Cierre de sesión",
      exito: true,
    });
    res.json({ success: true });
  } catch (err) {
    logger.error("Error al registrar logout", { error: err.message, stack: err.stack });
    res.status(500).json({ error: "No se pudo completar la operación." });
  }
});

// --- RECURSOS ENDPOINTS ---

app.get("/api/recursos", authenticateSession, async (_req, res, next) => {
  try {
    const list = await Recurso.findAll({ order: [["id", "DESC"]] });
    res.json(list);
  } catch (err) {
    next(err);
  }
});

app.post("/api/recursos", authenticateSession, requireRole(["Administrador", "Docente"]), validateBody(recursoSchema), async (req, res) => {
  try {
    const resource = await Recurso.create(req.body);

    await auditoriaFromRequest(req, {
      usuarioId: req.user.id,
      usuarioNombre: req.user.nombre,
      usuario: req.user.usuario,
      rol: req.user.rol,
      accion: "RECURSO_CREADO",
      entidad: "recurso",
      entidadId: resource.id,
      detalle: `Recurso "${resource.titulo}" creado`,
      exito: true,
    });

    res.status(201).json(resource);
  } catch (err) {
    logger.error("Error al crear recurso", { error: err.message, stack: err.stack });
    res.status(500).json({ error: "No se pudo completar la operación." });
  }
});

app.put("/api/recursos/:id", authenticateSession, requireRole(["Administrador", "Docente"]), validateBody(recursoSchema), async (req, res) => {
  try {
    const { id } = req.params;
    await Recurso.update(req.body, { where: { id } });

    await auditoriaFromRequest(req, {
      usuarioId: req.user.id,
      usuarioNombre: req.user.nombre,
      usuario: req.user.usuario,
      rol: req.user.rol,
      accion: "RECURSO_ACTUALIZADO",
      entidad: "recurso",
      entidadId: Number(id),
      detalle: `Recurso "${req.body.titulo}" actualizado`,
      exito: true,
    });

    res.json({ success: true });
  } catch (err) {
    logger.error("Error al actualizar recurso", { error: err.message, stack: err.stack });
    res.status(500).json({ error: "No se pudo completar la operación." });
  }
});

app.delete("/api/recursos/:id", authenticateSession, requireRole(["Administrador", "Docente"]), async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await Recurso.findByPk(id);
    if (!resource) return res.status(404).json({ error: "Recurso no encontrado" });

    await resource.destroy();

    await auditoriaFromRequest(req, {
      usuarioId: req.user.id,
      usuarioNombre: req.user.nombre,
      usuario: req.user.usuario,
      rol: req.user.rol,
      accion: "RECURSO_ELIMINADO",
      entidad: "recurso",
      entidadId: Number(id),
      detalle: `Recurso "${resource.titulo}" eliminado`,
      exito: true,
    });

    res.json({ success: true });
  } catch (err) {
    logger.error("Error al eliminar recurso", { error: err.message, stack: err.stack });
    res.status(500).json({ error: "No se pudo completar la operación." });
  }
});

// --- PROYECTOS / TUTORIALES ENDPOINTS ---

app.get("/api/tutoriales", async (req, res) => {
  try {
    const list = await Tutorial.findAll({ order: [["id", "DESC"]] });
    res.json(list);
  } catch (err) {
    logger.error("Error al listar tutoriales", { error: err.message, stack: err.stack });
    res.status(500).json({ error: "No se pudo completar la operación." });
  }
});

app.post("/api/tutoriales", authenticateSession, requireRole(["Administrador", "Docente"]), validateBody(tutorialSchema), async (req, res) => {
  try {
    const tutorial = await Tutorial.create({
      titulo: req.body.titulo,
      area: req.body.area,
      desc: req.body.desc,
      url: req.body.url,
      audiencia: req.body.audiencia || "ambos",
    });

    await auditoriaFromRequest(req, {
      usuarioId: req.user.id,
      usuarioNombre: req.user.nombre,
      usuario: req.user.usuario,
      rol: req.user.rol,
      accion: "TUTORIAL_CREADO",
      entidad: "tutorial",
      entidadId: tutorial.id,
      detalle: `Tutorial "${tutorial.titulo}" creado`,
      exito: true,
    });

    res.status(201).json(tutorial);
  } catch (err) {
    logger.error("Error al crear tutorial", { error: err.message, stack: err.stack });
    res.status(500).json({ error: "No se pudo completar la operación." });
  }
});

app.put("/api/tutoriales/:id", authenticateSession, requireRole(["Administrador", "Docente"]), validateBody(tutorialSchema), async (req, res) => {
  try {
    const { id } = req.params;
    await Tutorial.update({
      titulo: req.body.titulo,
      area: req.body.area,
      desc: req.body.desc,
      url: req.body.url,
      audiencia: req.body.audiencia || "ambos",
    }, { where: { id } });

    await auditoriaFromRequest(req, {
      usuarioId: req.user.id,
      usuarioNombre: req.user.nombre,
      usuario: req.user.usuario,
      rol: req.user.rol,
      accion: "TUTORIAL_ACTUALIZADO",
      entidad: "tutorial",
      entidadId: Number(id),
      detalle: `Tutorial "${req.body.titulo}" actualizado`,
      exito: true,
    });

    res.json({ success: true });
  } catch (err) {
    logger.error("Error al actualizar tutorial", { error: err.message, stack: err.stack });
    res.status(500).json({ error: "No se pudo completar la operación." });
  }
});

app.delete("/api/tutoriales/:id", authenticateSession, requireRole(["Administrador", "Docente"]), async (req, res) => {
  try {
    const { id } = req.params;
    const tutorial = await Tutorial.findByPk(id);
    if (!tutorial) return res.status(404).json({ error: "Tutorial no encontrado" });

    await Tutorial.destroy({ where: { id } });

    await auditoriaFromRequest(req, {
      usuarioId: req.user.id,
      usuarioNombre: req.user.nombre,
      usuario: req.user.usuario,
      rol: req.user.rol,
      accion: "TUTORIAL_ELIMINADO",
      entidad: "tutorial",
      entidadId: Number(id),
      detalle: `Tutorial "${tutorial.titulo}" eliminado`,
      exito: true,
    });

    res.json({ success: true });
  } catch (err) {
    logger.error("Error al eliminar tutorial", { error: err.message, stack: err.stack });
    res.status(500).json({ error: "No se pudo completar la operación." });
  }
});

// --- NOTICIAS ENDPOINTS ---

app.get("/api/noticias", async (req, res) => {
  try {
    const list = await Noticia.findAll({ order: [["id", "DESC"]] });
    res.json(list);
  } catch (err) {
    logger.error("Error al listar noticias", { error: err.message, stack: err.stack });
    res.status(500).json({ error: "No se pudo completar la operación." });
  }
});

app.post("/api/noticias", authenticateSession, requireRole(["Administrador"]), validateBody(noticiaSchema), async (req, res) => {
  try {
    const news = await Noticia.create({
      ...req.body,
      fecha: new Date().toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })
    });

    await auditoriaFromRequest(req, {
      usuarioId: req.user.id,
      usuarioNombre: req.user.nombre,
      usuario: req.user.usuario,
      rol: req.user.rol,
      accion: "NOTICIA_CREADA",
      entidad: "noticia",
      entidadId: news.id,
      detalle: `Noticia "${news.titulo}" creada`,
      exito: true,
    });

    res.status(201).json(news);
  } catch (err) {
    logger.error("Error al crear noticia", { error: err.message, stack: err.stack });
    res.status(500).json({ error: "No se pudo completar la operación." });
  }
});

app.put("/api/noticias/:id", authenticateSession, requireRole(["Administrador"]), validateBody(noticiaSchema), async (req, res) => {
  try {
    const { id } = req.params;
    await Noticia.update(req.body, { where: { id } });

    await auditoriaFromRequest(req, {
      usuarioId: req.user.id,
      usuarioNombre: req.user.nombre,
      usuario: req.user.usuario,
      rol: req.user.rol,
      accion: "NOTICIA_ACTUALIZADA",
      entidad: "noticia",
      entidadId: Number(id),
      detalle: `Noticia "${req.body.titulo}" actualizada`,
      exito: true,
    });

    res.json({ success: true });
  } catch (err) {
    logger.error("Error al actualizar noticia", { error: err.message, stack: err.stack });
    res.status(500).json({ error: "No se pudo completar la operación." });
  }
});

app.delete("/api/noticias/:id", authenticateSession, requireRole(["Administrador"]), async (req, res) => {
  try {
    const { id } = req.params;
    const news = await Noticia.findByPk(id);
    if (!news) return res.status(404).json({ error: "Noticia no encontrada" });

    await Noticia.destroy({ where: { id } });

    await auditoriaFromRequest(req, {
      usuarioId: req.user.id,
      usuarioNombre: req.user.nombre,
      usuario: req.user.usuario,
      rol: req.user.rol,
      accion: "NOTICIA_ELIMINADA",
      entidad: "noticia",
      entidadId: Number(id),
      detalle: `Noticia "${news.titulo}" eliminada`,
      exito: true,
    });

    res.json({ success: true });
  } catch (err) {
    logger.error("Error al eliminar noticia", { error: err.message, stack: err.stack });
    res.status(500).json({ error: "No se pudo completar la operación." });
  }
});

// --- EVIDENCIAS ENDPOINTS ---

function normalizeEvidencia(raw) {
  const e = raw.toJSON ? raw.toJSON() : raw;
  let imagenes = Array.isArray(e.imagenes) ? e.imagenes : [];
  if (imagenes.length === 0 && e.url) {
    imagenes = [{ url: e.url, name: "imagen", mimetype: null, size: null }];
  }
  return { ...e, imagenes };
}

app.get("/api/evidencias", async (req, res) => {
  try {
    const list = await Evidencia.findAll({ order: [["id", "DESC"]] });
    res.json(list.map(normalizeEvidencia));
  } catch (err) {
    logger.error("Error al listar evidencias", { error: err.message, stack: err.stack });
    res.status(500).json({ error: "No se pudo completar la operación." });
  }
});

app.post("/api/evidencias", authenticateSession, requireRole(["Administrador", "Docente"]), validateBody(evidenciaSchema), async (req, res) => {
  try {
    const body = { ...req.body };
    if (Array.isArray(body.imagenes) && body.imagenes.length > 0 && !body.url) {
      body.url = body.imagenes[0].url;
    }
    if (!body.driveFolderUrl) body.driveFolderUrl = null;
    if (!body.fecha) body.fecha = new Date().toISOString().slice(0, 10);
    if (!body.url) body.url = null;
    if (!body.imagenes || (Array.isArray(body.imagenes) && body.imagenes.length === 0)) {
      body.imagenes = null;
    }

    const evidencia = await Evidencia.create(body);

    await auditoriaFromRequest(req, {
      usuarioId: req.user.id,
      usuarioNombre: req.user.nombre,
      usuario: req.user.usuario,
      rol: req.user.rol,
      accion: "EVIDENCIA_CREADA",
      entidad: "evidencia",
      entidadId: evidencia.id,
      detalle: `Evidencia "${evidencia.titulo}" creada (${Array.isArray(evidencia.imagenes) ? evidencia.imagenes.length : 1} imagen(es))`,
      exito: true,
    });

    res.status(201).json(normalizeEvidencia(evidencia));
  } catch (err) {
    logger.error("Error al crear evidencia", {
      error: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code,
      sql: err.sql,
      sqlMessage: err.parent?.message,
      body: { titulo: req.body?.titulo, hasImagenes: Array.isArray(req.body?.imagenes), hasDrive: !!req.body?.driveFolderUrl },
    });
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ error: "Ya existe una evidencia con esos datos." });
    }
    if (err.name === "SequelizeValidationError") {
      return res.status(400).json({ error: "Revisa los datos de la evidencia." });
    }
    res.status(500).json({ error: "No se pudo guardar la evidencia." });
  }
});

app.put("/api/evidencias/:id", authenticateSession, requireRole(["Administrador", "Docente"]), validateBody(evidenciaSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const body = { ...req.body };
    if (Array.isArray(body.imagenes) && body.imagenes.length > 0 && !body.url) {
      body.url = body.imagenes[0].url;
    }
    if (!body.driveFolderUrl) body.driveFolderUrl = null;
    await Evidencia.update(body, { where: { id } });

    await auditoriaFromRequest(req, {
      usuarioId: req.user.id,
      usuarioNombre: req.user.nombre,
      usuario: req.user.usuario,
      rol: req.user.rol,
      accion: "EVIDENCIA_ACTUALIZADA",
      entidad: "evidencia",
      entidadId: Number(id),
      detalle: `Evidencia "${req.body.titulo}" actualizada`,
      exito: true,
    });

    res.json({ success: true });
  } catch (err) {
    logger.error("Error al actualizar evidencia", { error: err.message, stack: err.stack });
    res.status(500).json({ error: "No se pudo completar la operación." });
  }
});

app.delete("/api/evidencias/:id", authenticateSession, requireRole(["Administrador", "Docente"]), async (req, res) => {
  try {
    const { id } = req.params;
    const evidencia = await Evidencia.findByPk(id);
    if (!evidencia) return res.status(404).json({ error: "Evidencia no encontrada" });

    await evidencia.destroy();

    await auditoriaFromRequest(req, {
      usuarioId: req.user.id,
      usuarioNombre: req.user.nombre,
      usuario: req.user.usuario,
      rol: req.user.rol,
      accion: "EVIDENCIA_ELIMINADA",
      entidad: "evidencia",
      entidadId: Number(id),
      detalle: `Evidencia "${evidencia.titulo}" eliminada`,
      exito: true,
    });

    res.json({ success: true });
  } catch (err) {
    logger.error("Error al eliminar evidencia", { error: err.message, stack: err.stack });
    res.status(500).json({ error: "No se pudo completar la operación." });
  }
});

// --- FILE UPLOAD ENDPOINT ---
app.post("/api/upload", authenticateSession, requireRole(["Administrador", "Docente"]), limitConcurrentUploads, upload.single("file"), async (req, res) => {
  if (!req.file) {
    logger.info("[AUDIT] Subida fallida: Multer no capturó ningún archivo.");
    return res.status(400).json({ error: "No se envió ningún archivo" });
  }

  try {
    // Convertir imagen a AVIF (reduce ~70% del tamaño preservando resolución)
    const { buffer: fileBuffer, mimetype: fileMime, converted } = await convertToAvifIfImage(
      req.file.buffer,
      await detectUploadMime(req.file)
    );

    // Si fue convertido, renombrar la extensión a .avif para consistencia
    const baseName = converted
      ? req.file.originalname.replace(/\.[^.]+$/, "") + ".avif"
      : req.file.originalname;

    const filename = `uploads/${req.user.id}/${randomUUID()}-${generateFileName(baseName)}`;
    const result = await uploadFile(fileBuffer, filename, fileMime);

    const originalSize = req.file.size;
    const newSize = fileBuffer.length;
    const compressionPct = converted && originalSize > 0
      ? Math.max(0, Math.round((1 - newSize / originalSize) * 100))
      : 0;

    logger.info(
      `[AUDIT] Subida exitosa: Archivo=${result.filename} ` +
      `(${newSize} bytes${converted ? `, original=${originalSize}, -${compressionPct}%` : ""}) ` +
      `| Storage=${result.storage} | mime=${fileMime}`
    );

    res.json({
      success: true,
      url: result.url,
      filename: result.filename,
      mimetype: fileMime,
      size: newSize,
      originalSize: converted ? originalSize : undefined,
      compressionPct: converted ? compressionPct : undefined,
      converted,
    });
  } catch (uploadErr) {
    logger.error("[AUDIT] Error al guardar archivo:", { error: uploadErr.message });
    res.status(uploadErr.status === 415 ? 415 : 500).json({
      error: uploadErr.status === 415 ? uploadErr.message : "No se pudo guardar el archivo.",
    });
  }
});

// --- MULTIPLE FILE UPLOAD ENDPOINT (para colecciones de evidencias) ---
app.post("/api/uploads", authenticateSession, requireRole(["Administrador", "Docente"]), limitConcurrentUploads, upload.array("files", MAX_UPLOAD_FILES), async (req, res) => {
  const files = req.files || [];
  if (files.length === 0) {
    return res.status(400).json({ error: "No se enviaron archivos" });
  }

  try {
    const uploaded = [];
    const failed = [];
    let totalOriginalBytes = 0;
    let totalCompressedBytes = 0;
    let totalConverted = 0;
    let totalWatermarked = 0;

    // El cliente puede omitir el watermark pasando `applyWatermark: "false"`
    // en el body multipart. Por defecto, se aplica a todas las imágenes (fotos).
    const applyWatermark = req.body?.applyWatermark !== "false";

    for (const f of files) {
      try {
        // 1) Convertir imagen a AVIF si aplica (reduce ~70% del tamaño)
        let { buffer: fileBuffer, mimetype: fileMime, converted } = await convertToAvifIfImage(
          f.buffer,
          await detectUploadMime(f)
        );

        // 2) Aplicar watermark a fotos (no a videos ni PDFs).
        //    Se aplica DESPUÉS de la conversión AVIF para que el texto
        //    quede incrustado en la imagen final que se servirá.
        let watermarked = false;
        if (applyWatermark && (fileMime || "").startsWith("image/")) {
          const wm = await applyWatermarkToBuffer(fileBuffer, fileMime);
          if (wm.applied) {
            fileBuffer = wm.buffer;
            watermarked = true;
            totalWatermarked += 1;
          }
        }

        const baseName = converted
          ? f.originalname.replace(/\.[^.]+$/, "") + ".avif"
          : f.originalname;

        const filename = `uploads/${req.user.id}/${randomUUID()}-${generateFileName(baseName)}`;
        const result = await uploadFile(fileBuffer, filename, fileMime);

        const originalSize = f.size;
        const newSize = fileBuffer.length;
        const compressionPct = converted && originalSize > 0
          ? Math.max(0, Math.round((1 - newSize / originalSize) * 100))
          : 0;

        totalOriginalBytes += originalSize;
        totalCompressedBytes += newSize;
        if (converted) totalConverted += 1;

        uploaded.push({
          url: result.url,
          name: f.originalname,
          filename,
          size: newSize,
          originalSize: converted ? originalSize : undefined,
          compressionPct: converted ? compressionPct : undefined,
          mimetype: fileMime,
          watermarked,
        });
      } catch (fileErr) {
        logger.error(`[AUDIT] Fallo al subir ${f.originalname}:`, { error: fileErr.message });
        failed.push({ name: f.originalname, error: fileErr.status === 415 ? fileErr.message : "No se pudo guardar el archivo." });
      }
    }

    const totalSaved = totalOriginalBytes - totalCompressedBytes;
    const overallPct = totalOriginalBytes > 0
      ? Math.round((totalSaved / totalOriginalBytes) * 100)
      : 0;

    logger.info(
      `[AUDIT] Subida múltiple: ${uploaded.length} OK, ${failed.length} fallidos de ${files.length} ` +
      `| ${totalConverted} convertidas a AVIF ` +
      `| ${totalWatermarked} con watermark ` +
      `| ${(totalOriginalBytes / 1024 / 1024).toFixed(2)} MB → ${(totalCompressedBytes / 1024 / 1024).toFixed(2)} MB (-${overallPct}%)`
    );

    // 207 Multi-Status si hubo fallos parciales; 200 si todo OK
    const status = failed.length > 0 ? (uploaded.length > 0 ? 207 : 400) : 200;
    res.status(status).json({
      success: uploaded.length === files.length,
      uploaded,
      failed,
      stats: {
        totalFiles: files.length,
        convertedToAvif: totalConverted,
        watermarked: totalWatermarked,
        originalSizeMB: +(totalOriginalBytes / 1024 / 1024).toFixed(2),
        compressedSizeMB: +(totalCompressedBytes / 1024 / 1024).toFixed(2),
        savedMB: +(totalSaved / 1024 / 1024).toFixed(2),
        compressionPct: overallPct,
      },
    });
  } catch (uploadErr) {
    logger.error("[AUDIT] Error al guardar archivos:", { error: uploadErr.message });
    res.status(uploadErr.status === 415 ? 415 : 500).json({
      error: uploadErr.status === 415 ? uploadErr.message : "No se pudo guardar el archivo.",
    });
  }
});

// --- HERO SLIDES ENDPOINTS ---

const MAX_HERO_SLIDES = 3;

function sanitizeHeroSlidePublic(row) {
  const json = row.toJSON ? row.toJSON() : row;
  return {
    id: json.id,
    orden: json.orden,
    imagenUrl: json.imagenUrl,
    activo: json.activo,
  };
}

app.get("/api/hero-slides", async (req, res) => {
  try {
    const list = await HeroSlide.findAll({
      where: { activo: true },
      order: [["orden", "ASC"], ["id", "ASC"]],
    });
    res.json(list.map(sanitizeHeroSlidePublic));
  } catch (err) {
    logger.error("Error al listar hero slides", { error: err.message, stack: err.stack });
    res.status(500).json({ error: "No se pudo completar la operación." });
  }
});

app.get("/api/admin/hero-slides", authenticateSession, requireRole(["Administrador"]), async (req, res) => {
  try {
    const list = await HeroSlide.findAll({
      order: [["orden", "ASC"], ["id", "ASC"]],
    });
    res.json(list.map((row) => {
      const json = row.toJSON ? row.toJSON() : row;
      return {
        id: json.id,
        orden: json.orden,
        imagenUrl: json.imagenUrl,
        imagenPath: json.imagenPath,
        activo: json.activo,
        createdAt: json.createdAt,
        updatedAt: json.updatedAt,
      };
    }));
  } catch (err) {
    logger.error("Error al listar hero slides (admin)", { error: err.message, stack: err.stack });
    res.status(500).json({ error: "No se pudo completar la operación." });
  }
});

app.post("/api/admin/hero-slides", authenticateSession, requireRole(["Administrador"]), validateBody(heroSlideSchema), async (req, res) => {
  try {
    const { imagenUrl, imagenPath, activo } = req.body;

    const count = await HeroSlide.count();
    if (count >= MAX_HERO_SLIDES) {
      return res.status(400).json({ error: `Máximo ${MAX_HERO_SLIDES} slides permitidos. Elimina uno antes de crear otro.` });
    }

    const maxOrdenRow = await HeroSlide.findOne({ order: [["orden", "DESC"]] });
    const nextOrden = maxOrdenRow ? maxOrdenRow.orden + 1 : 1;

    const slide = await HeroSlide.create({
      imagenUrl,
      imagenPath: imagenPath || null,
      activo: activo !== false,
      orden: nextOrden,
    });

    await auditoriaFromRequest(req, {
      usuarioId: req.user.id,
      usuarioNombre: req.user.nombre,
      usuario: req.user.usuario,
      rol: req.user.rol,
      accion: "HERO_SLIDE_CREADO",
      entidad: "hero_slide",
      entidadId: slide.id,
      detalle: `Hero slide #${slide.id} creado (orden ${slide.orden})`,
      exito: true,
    });

    res.status(201).json(slide);
  } catch (err) {
    logger.error("Error al crear hero slide", { error: err.message, stack: err.stack });
    res.status(500).json({ error: "No se pudo completar la operación." });
  }
});

app.put("/api/admin/hero-slides/:id", authenticateSession, requireRole(["Administrador"]), validateBody(heroSlideSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const slide = await HeroSlide.findByPk(id);
    if (!slide) return res.status(404).json({ error: "Slide no encontrado" });

    const { imagenUrl, imagenPath, activo } = req.body;

    slide.imagenUrl = imagenUrl;
    if (typeof imagenPath === "string") slide.imagenPath = imagenPath || null;
    if (typeof activo === "boolean") slide.activo = activo;
    await slide.save();

    await auditoriaFromRequest(req, {
      usuarioId: req.user.id,
      usuarioNombre: req.user.nombre,
      usuario: req.user.usuario,
      rol: req.user.rol,
      accion: "HERO_SLIDE_ACTUALIZADO",
      entidad: "hero_slide",
      entidadId: slide.id,
      detalle: `Hero slide #${slide.id} actualizado (activo=${slide.activo})`,
      exito: true,
    });

    res.json({ success: true, slide });
  } catch (err) {
    logger.error("Error al actualizar hero slide", { error: err.message, stack: err.stack });
    res.status(500).json({ error: "No se pudo completar la operación." });
  }
});

app.put("/api/admin/hero-slides-reorder", authenticateSession, requireRole(["Administrador"]), async (req, res) => {
  try {
    const { orden } = req.body;
    if (!Array.isArray(orden)) {
      return res.status(400).json({ error: "El campo 'orden' debe ser un array de IDs." });
    }

    await Promise.all(
      orden.map((id, index) =>
        HeroSlide.update({ orden: index + 1 }, { where: { id } })
      )
    );

    await auditoriaFromRequest(req, {
      usuarioId: req.user.id,
      usuarioNombre: req.user.nombre,
      usuario: req.user.usuario,
      rol: req.user.rol,
      accion: "HERO_SLIDE_REORDENADO",
      entidad: "hero_slide",
      detalle: `Reordenados ${orden.length} hero slides`,
      exito: true,
    });

    res.json({ success: true });
  } catch (err) {
    logger.error("Error al reordenar hero slides", { error: err.message, stack: err.stack });
    res.status(500).json({ error: "No se pudo completar la operación." });
  }
});

app.delete("/api/admin/hero-slides/:id", authenticateSession, requireRole(["Administrador"]), async (req, res) => {
  try {
    const { id } = req.params;
    const slide = await HeroSlide.findByPk(id);
    if (!slide) return res.status(404).json({ error: "Slide no encontrado" });

    await slide.destroy();

    const remaining = await HeroSlide.findAll({ order: [["orden", "ASC"]] });
    await Promise.all(
      remaining.map((row, index) =>
        row.update({ orden: index + 1 })
      )
    );

    await auditoriaFromRequest(req, {
      usuarioId: req.user.id,
      usuarioNombre: req.user.nombre,
      usuario: req.user.usuario,
      rol: req.user.rol,
      accion: "HERO_SLIDE_ELIMINADO",
      entidad: "hero_slide",
      entidadId: Number(id),
      detalle: `Hero slide #${id} eliminado`,
      exito: true,
    });

    res.json({ success: true });
  } catch (err) {
    logger.error("Error al eliminar hero slide", { error: err.message, stack: err.stack });
    res.status(500).json({ error: "No se pudo completar la operación." });
  }
});

// --- SIGNED URL ENDPOINTS (imágenes con acceso protegido) ---

async function signVisibleFiles(req, res, input, single, redirect = false) {
  res.set("Cache-Control", "private, no-store");
  const bucket = getBucketName();
  const paths = input.map((value) => storagePath(value, supabaseHost, bucket));
  if (paths.some((value) => !value)) return res.status(400).json({ error: "Ruta de archivo inválida." });

  const user = await sessions.read(req);
  const [hero, evidence, resources] = await Promise.all([
    HeroSlide.findAll({ attributes: ["imagenUrl"], where: user?.rol === "Administrador" ? {} : { activo: true } }),
    Evidencia.findAll({ attributes: ["url", "imagenes"] }),
    user ? Recurso.findAll({ attributes: ["url", "contenidos"] }) : [],
  ]);
  const visible = visibleStoragePaths({ hero, evidence, resources }, supabaseHost, bucket);
  const ownFolder = user && ["Administrador", "Docente"].includes(user.rol) ? `uploads/${user.id}/` : null;
  const authorized = [...new Set(paths)].filter((file) => visible.has(file) || (ownFolder && file.startsWith(ownFolder)));
  if (single && !authorized.length) return res.status(404).json({ error: "Archivo no disponible." });

  const urls = Object.create(null);
  for (let i = 0; i < authorized.length; i += 8) {
    await Promise.all(authorized.slice(i, i + 8).map(async (file) => {
      try {
        urls[file] = await getSignedUrl(file);
      } catch {
        // El objeto puede haber caducado o haber sido retirado del almacenamiento.
      }
    }));
  }

  if (single && !urls[paths[0]]) return res.status(404).json({ error: "Archivo no disponible." });
  if (redirect) return res.redirect(302, urls[paths[0]]);
  res.json(single ? { url: urls[paths[0]], expiresIn: 60 } : { urls, expiresIn: 60 });
}

app.get("/api/storage/sign", signedUrlLimiter, (req, res) => signVisibleFiles(req, res, [req.query.path], true));
app.get("/api/storage/open", signedUrlLimiter, (req, res) => signVisibleFiles(req, res, [req.query.path], true, true));
app.post("/api/storage/sign-batch", signedUrlLimiter, (req, res) => {
  const { paths } = req.body || {};
  if (!Array.isArray(paths) || !paths.length || paths.length > 50) {
    return res.status(400).json({ error: "Envía entre 1 y 50 rutas." });
  }
  return signVisibleFiles(req, res, paths, false);
});

// --- API BACKUP EXPORT ENDPOINT (Fase 5) ---
app.post("/api/admin/backup", authenticateSession, requireRole(["Administrador"]), async (req, res) => {
  try {
    const [recursos, tutoriales, noticias, evidencias] = await sequelize.transaction(
      { isolationLevel: "REPEATABLE READ" },
      (transaction) => Promise.all(
        [Recurso, Tutorial, Noticia, Evidencia].map((model) => model.findAll({ transaction, raw: true })),
      ),
    );
    res.attachment(`innova-bandera-${new Date().toISOString().slice(0, 10)}.json`);
    res.json({ version: 1, recursos, tutoriales, noticias, evidencias });
  } catch (err) {
    logger.error("Error al exportar respaldo", { error: err.message });
    res.status(500).json({ error: "No se pudo generar el respaldo." });
  }
});

// --- API BACKUP IMPORT ---
app.post("/api/import", authenticateSession, requireRole(["Administrador"]), async (req, res) => {
  const data = parseBackup(req.body);
  if (!data) return res.status(400).json({ error: "El respaldo debe contener las cuatro secciones válidas." });
  try {
    await restoreBackup(sequelize, {
      recursos: Recurso, tutoriales: Tutorial, noticias: Noticia, evidencias: Evidencia,
    }, data);
    res.json({ success: true });
  } catch (err) {
    logger.error("No se pudo restaurar el respaldo", { error: err.message });
    res.status(500).json({ error: "No se restauró ningún cambio." });
  }
});

// --- AUDITORÍA ENDPOINTS (Paso 8 + 10) ---

app.get("/api/admin/auditoria", authenticateSession, requireRole(["Administrador"]), auditoriaLimiter, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      accion,
      usuario,
      exito,
      desde,
      hasta,
    } = req.query;

    const where = {};
    if (accion) where.accion = accion;
    if (usuario) where.usuario = { [Op.like]: `%${usuario}%` };
    if (exito !== undefined && exito !== "") where.exito = exito === "true";
    if (desde || hasta) {
      where.createdAt = {};
      if (desde) where.createdAt[Op.gte] = new Date(desde);
      if (hasta) {
        const hastaDate = new Date(hasta);
        hastaDate.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = hastaDate;
      }
    }

    const offset = (Number(page) - 1) * Number(limit);
    const { count, rows } = await AuditoriaSesion.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: Number(limit),
      offset,
    });

    res.json({
      total: count,
      page: Number(page),
      pages: Math.ceil(count / Number(limit)),
      data: rows,
    });
  } catch (err) {
    logger.error("Error al listar auditoría", { error: err.message });
    res.status(500).json({ error: "No se pudo completar la operación." });
  }
});

app.get("/api/admin/auditoria/stats", authenticateSession, requireRole(["Administrador"]), auditoriaLimiter, async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const where = {};
    if (desde || hasta) {
      where.createdAt = {};
      if (desde) where.createdAt[Op.gte] = new Date(desde);
      if (hasta) {
        const hastaDate = new Date(hasta);
        hastaDate.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = hastaDate;
      }
    }

    const [total, exitosos, fallidos, porAccion] = await Promise.all([
      AuditoriaSesion.count({ where }),
      AuditoriaSesion.count({ where: { ...where, exito: true } }),
      AuditoriaSesion.count({ where: { ...where, exito: false } }),
      AuditoriaSesion.findAll({
        where,
        attributes: [
          "accion",
          [sequelize.fn("COUNT", sequelize.col("accion")), "total"],
        ],
        group: ["accion"],
        order: [[sequelize.literal("total"), "DESC"]],
        raw: true,
      }),
    ]);

    res.json({ total, exitosos, fallidos, porAccion });
  } catch (err) {
    logger.error("Error al obtener estadísticas de auditoría", { error: err.message });
    res.status(500).json({ error: "No se pudo completar la operación." });
  }
});

app.get("/api/admin/auditoria/export-csv", authenticateSession, requireRole(["Administrador"]), auditoriaLimiter, async (req, res) => {
  try {
    const { desde, hasta, accion, usuario } = req.query;
    const where = {};
    if (accion) where.accion = accion;
    if (usuario) where.usuario = { [Op.like]: `%${usuario}%` };
    if (desde || hasta) {
      where.createdAt = {};
      if (desde) where.createdAt[Op.gte] = new Date(desde);
      if (hasta) {
        const hastaDate = new Date(hasta);
        hastaDate.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = hastaDate;
      }
    }

    const rows = await AuditoriaSesion.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: 10000,
      raw: true,
    });

    const headers = ["ID", "Fecha", "Accion", "Usuario", "Rol", "Entidad", "EntidadID", "Detalle", "IP", "Exito"];
    const csvRows = rows.map((r) => [
      r.id,
      csvCell(new Date(r.createdAt).toISOString()),
      csvCell(r.accion),
      csvCell(r.usuario),
      csvCell(r.rol),
      csvCell(r.entidad),
      r.entidadId ?? "",
      csvCell(r.detalle),
      csvCell(r.ip),
      r.exito ? "SI" : "NO",
    ].join(","));

    const csv = "\uFEFF" + [headers.join(","), ...csvRows].join("\n");
    const filename = `auditoria_${new Date().toISOString().split("T")[0]}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);

    await auditoriaFromRequest(req, {
      usuarioId: req.user.id,
      usuarioNombre: req.user.nombre,
      usuario: req.user.usuario,
      rol: req.user.rol,
      accion: "AUDITORIA_EXPORTADA",
      detalle: `Exportación CSV de auditoría: ${rows.length} registros`,
      exito: true,
    });
  } catch (err) {
    logger.error("Error al exportar auditoría", { error: err.message });
    res.status(500).json({ error: "No se pudo completar la operación." });
  }
});

app.use("/api", (_req, res) => res.status(404).json({ error: "Ruta no disponible." }));

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err.type === "entity.too.large" || err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: req.path === "/api/upload" || req.path === "/api/uploads"
      ? `Cada archivo admite hasta ${MAX_UPLOAD_MIB} MiB.` : "La solicitud supera el tamaño permitido." });
  }
  if (err.status === 400 || err instanceof multer.MulterError) {
    return res.status(400).json({ error: "La solicitud no tiene un formato válido." });
  }
  logger.error("Error interno de API", { path: req.path, error: err.message });
  res.status(500).json({ error: "No se pudo completar la operación." });
});

// --- PRODUCTION: serve Vite build ---
if (isProduction) {
  const distPath = path.join(__dirname, "dist");
  app.use(express.static(distPath));
  app.use((req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// --- DATA SEED AND LAUNCH ---

function omitId(obj) {
  const { id: _id, ...rest } = obj;
  return rest;
}

function loadSeedData() {
  const dbPath = path.join(__dirname, "db.json");
  if (fs.existsSync(dbPath)) {
    const raw = fs.readFileSync(dbPath, "utf-8");
    const data = JSON.parse(raw);
    return {
      recursos: (data.recursos || []).map(omitId),
      tutoriales: (data.tutoriales || data.proyectos || []).map(omitId),
      noticias: (data.noticias || []).map(omitId),
      evidencias: (data.evidencias || []).map(omitId),
    };
  }
  return {
    recursos: SEED_RECURSOS,
    tutoriales: SEED_TUTORIALES,
    noticias: SEED_NOTICIAS,
    evidencias: [],
  };
}

const SEED_RECURSOS = [
  {
    titulo: "Khan Academy - Matemáticas",
    area: "Matemática",
    grados: ["1.° Sec", "2.° Sec"],
    tipo: "Web / App",
    desc: "Plataforma interactiva para práctica de aritmética, álgebra y geometría con retroalimentación inmediata.",
    url: "https://es.khanacademy.org",
    contenidos: [
      { id: 101, titulo: "Página Principal Khan Academy", tipo: "url", url: "https://es.khanacademy.org" },
      { id: 102, titulo: "Práctica de Álgebra I", tipo: "url", url: "https://es.khanacademy.org/math/algebra" }
    ]
  },
  {
    titulo: "PhET Simulations - Física y Química",
    area: "Ciencia y Tecnología",
    grados: ["2.° Sec", "3.° Sec", "4.° Sec"],
    tipo: "Simulación",
    desc: "Simulaciones interactivas de física, química, biología y ciencias de la tierra desarrolladas por la Universidad de Colorado.",
    url: "https://phet.colorado.edu/es/",
    contenidos: [
      { id: 201, titulo: "Simulador: Estados de la Materia", tipo: "url", url: "https://phet.colorado.edu/sims/html/states-of-matter/latest/states-of-matter_es.html" },
      { id: 202, titulo: "Simulador: Ley de Ohm", tipo: "url", url: "https://phet.colorado.edu/sims/html/ohms-law/latest/ohms-law_es.html" }
    ]
  },
  {
    titulo: "Diccionario y Gramática - RAE",
    area: "Comunicación",
    grados: ["1.° Sec", "2.° Sec", "3.° Sec", "4.° Sec", "5.° Sec"],
    tipo: "Web / App",
    desc: "Recurso oficial de consulta gramatical, ortográfica y semántica de la Real Academia Española.",
    url: "https://www.rae.es",
    contenidos: [
      { id: 301, titulo: "Diccionario de la Lengua Española (DLE)", tipo: "url", url: "https://dle.rae.es" },
      { id: 302, titulo: "Consultas de Dudas Rápidas - RAE", tipo: "url", url: "https://www.rae.es/consultas-comunes" }
    ]
  }
];

const SEED_TUTORIALES = [
  {
    titulo: "Uso de Canva en el Aula",
    area: "Comunicación",
    desc: "Tutorial para docentes sobre diseño de materiales visuales con Canva Educación.",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    audiencia: "docente",
  },
  {
    titulo: "Introducción a la Programación con Scratch",
    area: "Ciencia y Tecnología",
    desc: "Video introductorio para estudiantes sobre bloques de programación en Scratch.",
    url: "https://www.youtube.com/watch?v=VzPDL0L7sus",
    audiencia: "estudiante",
  },
  {
    titulo: "Herramientas TIC para la Evaluación Formativa",
    area: "Educación para el Trabajo",
    desc: "Recorrido por plataformas digitales útiles para evaluar el aprendizaje en el aula.",
    url: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
    audiencia: "ambos",
  },
];

const SEED_NOTICIAS = [
  { fecha: "10 Jun 2026", titulo: "Inauguración del Repositorio Digital Innova Bandera", desc: "Lanzamos de manera oficial el nuevo centro de recursos digitales para la innovación pedagógica en el aula.", autor: "Dirección Académica" }
];

async function start() {
  await verifyPrivateBucket();
  if (isProduction) await checkMigrations(sequelize);
  else await migrate(sequelize);

  if (!isProduction && process.env.SEED_DEMO_CONTENT === "1") {
    const seedData = loadSeedData();

    if (await Recurso.count() === 0 && seedData.recursos.length > 0) {
      await Recurso.bulkCreate(seedData.recursos);
      logger.info(`📚 ${seedData.recursos.length} recursos de ejemplo cargados.`);
    }

    if (await Tutorial.count() === 0 && seedData.tutoriales.length > 0) {
      await Tutorial.bulkCreate(seedData.tutoriales);
      logger.info(`🎓 ${seedData.tutoriales.length} tutoriales de ejemplo cargados.`);
    }

    if (await Noticia.count() === 0 && seedData.noticias.length > 0) {
      await Noticia.bulkCreate(seedData.noticias);
      logger.info(`📰 ${seedData.noticias.length} noticias de ejemplo cargadas.`);
    }

    if (await Evidencia.count() === 0 && seedData.evidencias.length > 0) {
      await Evidencia.bulkCreate(seedData.evidencias);
      logger.info(`🖼️ ${seedData.evidencias.length} evidencias de ejemplo cargadas.`);
    }

  }

  const server = app.listen(PORT, "0.0.0.0", () => logger.info(`Servidor activo en puerto ${PORT}`));
  server.headersTimeout = 15_000;
  server.requestTimeout = 120_000;
}

start().catch(async (err) => {
  logger.error("Error al iniciar el servidor", { error: err.message });
  await sequelize.close();
  process.exitCode = 1;
});
