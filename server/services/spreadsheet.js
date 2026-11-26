import { parse } from "csv-parse/sync";
import { readSheet } from "read-excel-file/node";
import { fromBufferPromise } from "yauzl";

const MAX_ROWS = 1000;
const MAX_COLUMNS = 32;
const MAX_EXPANDED_SIZE = 20 * 1024 * 1024;

async function validateWorkbookArchive(buffer) {
  const archive = await fromBufferPromise(buffer, { lazyEntries: true, validateEntrySizes: true });
  try {
    let files = 0;
    let bytes = 0;
    let expanded = 0;
    for await (const entry of archive.eachEntry()) {
      files++;
      bytes += entry.uncompressedSize;
      if (files > 128 || bytes > MAX_EXPANDED_SIZE || entry.isEncrypted()) {
        throw new Error("El libro supera los límites de importación.");
      }
      const stream = await archive.openReadStreamPromise(entry);
      for await (const chunk of stream) {
        expanded += chunk.length;
        if (expanded > MAX_EXPANDED_SIZE) throw new Error("El libro supera el tamaño permitido.");
      }
    }
  } finally {
    archive.close();
  }
}

export async function readTeacherRows(buffer, filename) {
  const extension = filename.toLowerCase().split(".").pop();
  let rows;
  if (extension === "xlsx") {
    await validateWorkbookArchive(buffer);
    rows = await readSheet(buffer, 1);
  } else if (extension === "csv") {
    rows = parse(new TextDecoder("utf-8", { fatal: true }).decode(buffer), {
      bom: true, relax_column_count: true, skip_empty_lines: true,
      max_record_size: 8192, to: MAX_ROWS + 2,
    });
  } else {
    throw new Error("Usa una hoja XLSX o CSV.");
  }

  if (rows.length > MAX_ROWS + 1 || rows.some((row) => row.length > MAX_COLUMNS)) {
    throw new Error("La hoja admite hasta 1000 filas y 32 columnas.");
  }
  const [header = [], ...records] = rows;
  const columns = header.map((cell) => String(cell ?? "").trim().toUpperCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
  const filled = columns.filter(Boolean);
  if (new Set(filled).size !== filled.length ||
      ["NOMBRES Y APELLIDOS", "DNI", "PASSWORD"].some((key) => !filled.includes(key))) {
    throw new Error("Verifica las columnas obligatorias NOMBRES Y APELLIDOS, DNI y PASSWORD.");
  }
  return records.map((row) => Object.fromEntries(columns.map((key, index) => [key, row[index]])));
}
