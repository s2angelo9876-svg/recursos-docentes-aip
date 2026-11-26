import { z } from "zod";
import { recursoSchema, tutorialSchema, noticiaSchema, evidenciaSchema } from "../validators.js";

const backup = z.object({
  version: z.literal(1).optional(),
  recursos: z.array(recursoSchema).max(10000),
  tutoriales: z.array(tutorialSchema).max(10000).optional(),
  proyectos: z.array(tutorialSchema).max(10000).optional(),
  noticias: z.array(noticiaSchema.extend({ fecha: z.string().trim().min(1).max(255) })).max(10000),
  evidencias: z.array(evidenciaSchema).max(10000),
}).refine(({ tutoriales, proyectos }) => tutoriales !== undefined || proyectos !== undefined);

export function parseBackup(data) {
  const result = backup.safeParse(data);
  if (!result.success) return null;
  const { recursos, tutoriales, proyectos, noticias, evidencias } = result.data;
  return { recursos, tutoriales: tutoriales ?? proyectos, noticias, evidencias };
}

export async function restoreBackup(db, sections, data) {
  await db.transaction(async (transaction) => {
    await db.query("SELECT pg_advisory_xact_lock(27081644)", { transaction });
    for (const [key, model] of Object.entries(sections)) {
      await model.destroy({ where: {}, transaction });
      await model.bulkCreate(data[key], { validate: true, transaction });
    }
  });
}
