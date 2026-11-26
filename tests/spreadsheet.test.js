import assert from "node:assert/strict";
import { test } from "node:test";
import { readTeacherRows } from "../server/services/spreadsheet.js";

test("lee CSV con DNI de texto y normaliza los encabezados", async () => {
  const file = Buffer.from('Nombres y apellidos,DNI,Password,Condición\n"Docente, Prueba",000123,clave-de-prueba,Docente');
  const [row] = await readTeacherRows(file, "docentes.csv");
  assert.equal(row.DNI, "000123");
  assert.equal(row["NOMBRES Y APELLIDOS"], "Docente, Prueba");
  assert.equal(row.CONDICION, "Docente");
});

test("rechaza hojas incompletas y archivos con extensión XLSX sin libro", async () => {
  await assert.rejects(readTeacherRows(Buffer.from("DNI\n123"), "docentes.csv"));
  await assert.rejects(readTeacherRows(Buffer.from("sin libro"), "docentes.xlsx"));
});
