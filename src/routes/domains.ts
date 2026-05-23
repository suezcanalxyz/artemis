import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { userRateLimit } from "../middleware/rateLimit.js";
import * as domainService from "../services/domainService.js";

const router = Router();

const createSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("subdomain"),
    subdomainLabel: z.string().min(3).max(63)
  }),
  z.object({
    kind: z.literal("custom"),
    host: z.string().min(3),
    verificationMethod: z.enum(["txt", "cname"]).default("txt")
  })
]);

router.use(requireAuth);
router.use(userRateLimit);

router.get("/", async (req, res, next) => {
  try {
    const domains = await domainService.listDomains(req.user!.profileId);
    res.json({ data: domains, meta: {} });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const domain = await domainService.createDomain(
      req.user!.profileId,
      req.user!.userId,
      req.user!.email,
      body
    );
    res.status(201).json({ data: domain, meta: {} });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/verify", async (req, res, next) => {
  try {
    const result = await domainService.verifyDomain(
      String(req.params.id),
      req.user!.userId,
      req.user!.profileId
    );
    res.json({ data: result, meta: {} });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/health", async (req, res, next) => {
  try {
    const checks = await domainService.getHealthChecks(
      String(req.params.id),
      req.user!.profileId
    );
    res.json({ data: checks, meta: {} });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/health", async (req, res, next) => {
  try {
    const check = await domainService.triggerHealthCheck(
      String(req.params.id),
      req.user!.profileId,
      req.user!.userId
    );
    res.json({ data: check, meta: {} });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await domainService.deleteDomain(
      String(req.params.id),
      req.user!.profileId,
      req.user!.userId
    );
    res.json({ data: { ok: true }, meta: {} });
  } catch (error) {
    next(error);
  }
});

export default router;
