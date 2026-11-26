import { Sequelize } from "sequelize";

export function createDatabase(connection, ca) {
  if (!connection) throw new Error("DATABASE_URL es obligatoria.");
  const url = new URL(connection);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  const plain = local && url.searchParams.get("sslmode") === "disable" && process.env.NODE_ENV !== "production";
  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith("ssl") || key === "uselibpqcompat") url.searchParams.delete(key);
  }
  return new Sequelize(url.href, {
    dialect: "postgres",
    dialectOptions: { ssl: plain ? false : { rejectUnauthorized: true, ...(ca ? { ca } : {}) } },
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
    logging: false,
  });
}
