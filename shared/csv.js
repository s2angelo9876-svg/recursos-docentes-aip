export function csvCell(value) {
  if (value == null) return "";
  const text = String(value);
  const safe = /^[\s\u200b\ufeff]*[=+@-]|^[\t\r\n]/u.test(text) ? "'" + text : text;
  return '"' + safe.replaceAll('"', '""') + '"';
}
