import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { ipRateLimit } from "../middleware/rateLimit.js";
import * as authService from "../services/authService.js";

const router = Router();

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1)
});

router.use(ipRateLimit);

router.post("/register", async (req, res, next) => {
  try {
    const body = credentialsSchema.parse(req.body);
    const result = await authService.register(body.email, body.password);
    res.status(201).json({ data: result, meta: {} });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const body = credentialsSchema.parse(req.body);
    const result = await authService.login(body.email, body.password);
    res.json({ data: result, meta: {} });
  } catch (error) {
    next(error);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const body = refreshSchema.parse(req.body);
    const result = await authService.refresh(body.refreshToken);
    res.json({ data: result, meta: {} });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    const body = refreshSchema.parse(req.body);
    await authService.logout(body.refreshToken);
    res.json({ data: { ok: true }, meta: {} });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await authService.me(req.user!.userId);
    res.json({ data: user, meta: {} });
  } catch (error) {
    next(error);
  }
});

export default router;
