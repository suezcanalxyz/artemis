import { Router } from "express";
import { sql } from "../lib/db.js";
import { config } from "../config.js";

const router = Router();

router.get("/ask", async (req, res, next) => {
  try {
    if (req.query.token !== config.CADDY_ASK_TOKEN) {
      res
        .status(403)
        .json({ error: { code: "FORBIDDEN", message: "Invalid ask token" } });
      return;
    }

    const domain = String(req.query.domain ?? "")
      .trim()
      .toLowerCase();
    const rows = await sql<{ id: string }[]>`
      select id from domains where host = ${domain} and is_verified = true limit 1
    `;
    res.sendStatus(rows.length ? 200 : 403);
  } catch (error) {
    next(error);
  }
});

export default router;
