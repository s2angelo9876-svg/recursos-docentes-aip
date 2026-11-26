export function fechaComunicado(item) {
  return Date.parse(item.fecha) || Date.parse(item.createdAt) || 0;
}

export function formatFechaComunicado(fecha, mes = "long") {
  if (!fecha) return "Sin fecha";
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return fecha;
  return date.toLocaleDateString("es-PE", {
    day: "numeric",
    month: mes,
    year: "numeric",
    timeZone: "UTC",
  });
}
