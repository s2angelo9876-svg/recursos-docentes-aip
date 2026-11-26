import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { parseBackup, restoreBackup } from "../server/services/backup.js";

test("el respaldo histórico completo es válido y los respaldos parciales se rechazan", () => {
  const seed = JSON.parse(readFileSync(new URL("../db.json", import.meta.url), "utf8"));
  assert.ok(parseBackup(seed));
  assert.equal(parseBackup({ ...seed, evidencias: undefined }), null);
  assert.equal(parseBackup({ ...seed, version: 2 }), null);
  assert.equal(parseBackup({ ...seed, noticias: [{}] }), null);
});

test("una escritura fallida rechaza la transacción de restauración completa", async () => {
  const transaction = {};
  const db = {
    transaction: async (run) => run(transaction),
    query: async (_, options) => assert.equal(options.transaction, transaction),
  };
  const failure = new Error("fallo de inserción");
  const sections = {
    recursos: {
      destroy: async (options) => assert.equal(options.transaction, transaction),
      bulkCreate: async (_, options) => {
        assert.equal(options.transaction, transaction);
        assert.equal(options.validate, true);
        throw failure;
      },
    },
    noticias: { destroy: () => assert.fail("No debe continuar tras el fallo") },
  };
  await assert.rejects(restoreBackup(db, sections, { recursos: [], noticias: [] }), failure);
});
