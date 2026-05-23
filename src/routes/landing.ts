import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { sql } from "../lib/db.js";
import { redis } from "../lib/redis.js";
import { sendLandingEmail } from "../services/emailService.js";

const router = Router();

const waitlistSchema = z.object({
  email: z.string().email()
});

const codeSchema = z.object({
  code: z.string().min(1).max(50)
});

const collaborateSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  background: z.string().max(1000).default(""),
  message: z.string().max(2000).default("")
});

router.post("/waitlist", async (req, res, next) => {
  try {
    const { email } = waitlistSchema.parse(req.body);
    await sql`
      insert into waitlist (email) values (${email})
      on conflict (email) do nothing
    `;
    try {
      await sendLandingEmail(email, "waitlist-joined");
    } catch (error) {
      req.log.warn({ err: error, email }, "Waitlist confirmation email failed");
    }
    res.json({ data: { ok: true }, meta: {} });
  } catch (error) {
    next(error);
  }
});

router.post("/whitelist/use", async (req, res, next) => {
  try {
    const { code } = codeSchema.parse(req.body);
    const [row] = await sql<{ id: string }[]>`
      select id from whitelist_codes
      where code = ${code.trim().toUpperCase()} and used_at is null
    `;
    if (!row) {
      res.status(400).json({
        error: {
          code: "INVALID_CODE",
          message: "Invalid or already used invite code"
        },
        data: null,
        meta: {}
      });
      return;
    }
    const inviteToken = randomUUID();
    await redis.set(`invite:${inviteToken}`, row.id, "EX", 3600);
    res.json({ data: { inviteToken }, meta: {} });
  } catch (error) {
    next(error);
  }
});

router.post("/collaborate", async (req, res, next) => {
  try {
    const body = collaborateSchema.parse(req.body);
    await sql`
      insert into collaborator_requests (name, email, background, message)
      values (${body.name}, ${body.email}, ${body.background}, ${body.message})
    `;
    try {
      await sendLandingEmail(body.email, "collaborator-received");
    } catch (error) {
      req.log.warn(
        { err: error, email: body.email },
        "Collaborator confirmation email failed"
      );
    }
    res.json({ data: { ok: true }, meta: {} });
  } catch (error) {
    next(error);
  }
});

export default router;
