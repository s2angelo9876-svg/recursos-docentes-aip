import { createHash, randomBytes } from "node:crypto";
import { Op } from "sequelize";

const cookieName = "innova_session";
const lifetime = 60 * 60 * 1000;
const digest = (value) => createHash("sha256").update(value).digest("hex");

export function sessionService(Session, User, secure) {
  const cookie = { httpOnly: true, secure, sameSite: "lax", path: "/api" };

  function identify(req) {
    const token = req.headers.cookie?.split(";").map((part) => part.trim())
      .find((part) => part.startsWith(cookieName + "="))?.slice(cookieName.length + 1);
    return /^[A-Za-z0-9_-]{43}$/.test(token ?? "") ? digest(token) : null;
  }

  async function read(req) {
    const id = identify(req);
    if (!id) return null;
    const session = await Session.findByPk(id);
    if (!session || session.expiresAt <= new Date()) return null;
    const user = await User.findByPk(session.userId);
    if (!user || session.credentialVersion !== digest(user.contrasenia)) return null;
    req.sessionId = id;
    return { id: user.id, usuario: user.usuario, nombre: user.nombre, rol: user.rol };
  }

  return {
    read,
    async open(req, res, user) {
      const now = Date.now();
      const previous = identify(req);
      if (previous) await Session.destroy({ where: { id: previous } });
      await Session.destroy({ where: { expiresAt: { [Op.lte]: new Date(now) } } });
      const token = randomBytes(32).toString("base64url");
      await Session.create({
        id: digest(token), userId: user.id, credentialVersion: digest(user.contrasenia),
        expiresAt: new Date(now + lifetime),
      });
      res.cookie(cookieName, token, { ...cookie, maxAge: lifetime });
    },
    async close(req, res) {
      if (req.sessionId) await Session.destroy({ where: { id: req.sessionId } });
      res.clearCookie(cookieName, cookie);
    },
  };
}
