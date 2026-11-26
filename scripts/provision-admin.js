import "dotenv/config";
import bcrypt from "bcryptjs";
import { createDatabase } from "../server/database.js";
import { defineModels } from "../server/models.js";
import { checkMigrations } from "../server/migrations/index.js";

const { ADMIN_USERNAME: usuario, ADMIN_PASSWORD: password, ADMIN_DISPLAY_NAME = "Administrador" } = process.env;
if (!usuario || !/^[\w.-]{3,50}$/.test(usuario) || !password ||
    password.length < 16 || Buffer.byteLength(password) > 72 || password.toLowerCase().includes(usuario.toLowerCase())) {
  throw new Error("Configura ADMIN_USERNAME y una contraseña única de 16 caracteres como mínimo y 72 bytes como máximo.");
}
const db = createDatabase(process.env.DATABASE_URL, process.env.DATABASE_CA_CERT);
try {
  const { Usuario } = defineModels(db);
  await checkMigrations(db);
  const contrasenia = await bcrypt.hash(password, 12);
  await db.transaction(async (transaction) => {
    await db.query("SELECT pg_advisory_xact_lock(27081643)", { transaction });
    const existing = await Usuario.findOne({ where: { usuario }, transaction, lock: true });
    if (existing && existing.rol !== "Administrador") throw new Error("El usuario pertenece a otro rol.");
    if (existing) await existing.update({ contrasenia }, { transaction });
    else await Usuario.create({ usuario, nombre: ADMIN_DISPLAY_NAME, contrasenia, rol: "Administrador" }, { transaction });
  });
  console.log("Cuenta de administración provisionada.");
} finally {
  await db.close();
}
