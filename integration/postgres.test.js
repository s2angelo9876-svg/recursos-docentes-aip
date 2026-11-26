import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createDatabase } from "../server/database.js";
import { defineModels } from "../server/models.js";
import { checkMigrations, migrate } from "../server/migrations/index.js";
import { parseBackup, restoreBackup } from "../server/services/backup.js";

test("PostgreSQL aplica migraciones y revierte una restauración fallida", async () => {
  const url = new URL(process.env.TEST_DATABASE_URL);
  assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(url.hostname));
  assert.equal(url.pathname, "/aip_integration");

  const db = createDatabase(url.href);
  try {
    const { Recurso, Tutorial, Noticia, Evidencia } = defineModels(db);
    await migrate(db);
    await migrate(db);
    await checkMigrations(db);

    const data = parseBackup(JSON.parse(readFileSync(new URL("../db.json", import.meta.url), "utf8")));
    const sections = { recursos: Recurso, tutoriales: Tutorial, noticias: Noticia, evidencias: Evidencia };
    const table = db.getQueryInterface().queryGenerator.quoteTable(Noticia.getTableName());
    await db.query(`ALTER TABLE ${table} ADD CONSTRAINT "integration_title" CHECK (length(titulo) > 1)`);
    try {
      await restoreBackup(db, sections, data);
      const before = await Recurso.findAll({ order: ["id"], raw: true });
      const broken = structuredClone(data);
      broken.recursos[0].titulo = "Cambio de prueba";
      broken.noticias[0].titulo = "x";
      await assert.rejects(restoreBackup(db, sections, broken));
      assert.deepEqual(await Recurso.findAll({ order: ["id"], raw: true }), before);
    } finally {
      await db.query(`ALTER TABLE ${table} DROP CONSTRAINT "integration_title"`);
    }
  } finally {
    await db.close();
  }
});
