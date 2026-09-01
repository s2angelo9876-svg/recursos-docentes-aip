export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues || result.error.errors || [];
      const messages = issues
        .map((e) => {
          const path = Array.isArray(e.path) ? e.path.join(".") : String(e.path || "");
          return `${path}: ${e.message}`;
        })
        .join("; ");
      return res.status(400).json({ error: `Datos inválidos: ${messages}` });
    }
    req.body = result.data;
    next();
  };
}
