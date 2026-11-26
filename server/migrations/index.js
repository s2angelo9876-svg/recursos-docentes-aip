import { DataTypes } from "sequelize";

const migrations = [
  ["001-initial", async (db, transaction) => {
    for (const model of Object.values(db.models)) {
      if (model.name !== "Sesion") await model.sync({ transaction });
    }
    const query = db.getQueryInterface();
    const table = db.models.Evidencia.getTableName();
    const columns = await query.describeTable(table, { transaction });
    for (const [name, type] of Object.entries({
      imagenes: DataTypes.JSON,
      driveFolderUrl: DataTypes.STRING,
      fecha: DataTypes.DATEONLY,
    })) {
      if (!columns[name]) await query.addColumn(table, name, { type, allowNull: true }, { transaction });
    }
  }],
  ["002-sessions", (db, transaction) => db.models.Sesion.sync({ transaction })],
];

export async function migrate(db) {
  await db.transaction(async (transaction) => {
    await db.query("SELECT pg_advisory_xact_lock(27081642)", { transaction });
    await db.query('CREATE TABLE IF NOT EXISTS "SchemaMigrations" (version text PRIMARY KEY)', { transaction });
    const [applied] = await db.query('SELECT version FROM "SchemaMigrations"', { transaction });
    const versions = new Set(applied.map(({ version }) => version));
    for (const [version, run] of migrations) {
      if (versions.has(version)) continue;
      await run(db, transaction);
      await db.query('INSERT INTO "SchemaMigrations" (version) VALUES ($version)', { bind: { version }, transaction });
    }
  });
}

export async function checkMigrations(db) {
  const [rows] = await db.query('SELECT version FROM "SchemaMigrations"');
  const applied = new Set(rows.map(({ version }) => version));
  if (migrations.some(([version]) => !applied.has(version))) {
    throw new Error("Ejecuta npm run migrate antes de iniciar producción.");
  }
}
