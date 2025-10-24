import jwt from "jsonwebtoken";

export const attachUserFromToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Usuario no autenticado" });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token no proporcionado" });

    // Decodificar JWT (usar la misma secret que Auth Service)
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    console.log("DIAGNOSTIC SERVICE -> req.user reconstruido:", req.user);

    next();
  } catch (err) {
    console.error("DIAGNOSTIC SERVICE -> Error verificando token:", err.message);
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
};
