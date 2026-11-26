import assert from "node:assert/strict";
import { test } from "node:test";
import { sessionService } from "../server/services/sessions.js";
import { csvCell } from "../shared/csv.js";
import { storagePath, visibleStoragePaths } from "../server/services/storage-access.js";

test("las sesiones tienen cookie HttpOnly y dejan de ser válidas tras salir o cambiar contraseña", async () => {
  let current;
  const user = { id: 8, nombre: "Docente", usuario: "docente", rol: "Docente", contrasenia: "hash" };
  const service = sessionService({
    findByPk: async (id) => current?.id === id ? current : null,
    create: async (record) => { current = record; },
    destroy: async ({ where }) => { if (where.id === current?.id) current = null; },
  }, { findByPk: async () => user }, true);
  const req = { headers: {} };
  const res = {
    cookie(name, value, options) {
      assert.equal(options.secure, true);
      assert.equal(options.httpOnly, true);
      req.headers.cookie = name + "=" + value;
    },
    clearCookie() {},
  };
  await service.open(req, res, user);
  assert.equal((await service.read(req)).rol, "Docente");
  user.contrasenia = "nuevo hash";
  assert.equal(await service.read(req), null);
  await service.open(req, res, user);
  await service.read(req);
  await service.close(req, res);
  assert.equal(await service.read(req), null);
});

test("las referencias de Storage se limitan al origen y bucket configurados", () => {
  const origin = "https://storage.example.com";
  const valid = origin + "/storage/v1/object/public/fotos/a.webp";
  const outside = "https://other.example.com/storage/v1/object/public/fotos/b.webp";
  const paths = visibleStoragePaths({
    hero: [{ imagenUrl: valid }],
    evidence: [{ imagenes: [{ url: outside }] }],
    resources: [],
  }, origin, "fotos");
  assert.deepEqual([...paths], ["a.webp"]);
  assert.equal(storagePath(outside, origin, "fotos"), null);
  assert.equal(storagePath("fotos/carpeta/../a.webp", origin, "fotos"), null);
});

test("al exportar auditoría, la planilla recibe textos con inicio de fórmula como literales", () => {
  assert.equal(csvCell(" =dato"), "\"' =dato\"");
  assert.equal(csvCell('Dato "normal"'), '"Dato ""normal"""');
});
