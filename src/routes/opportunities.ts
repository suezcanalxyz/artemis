import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { userRateLimit } from "../middleware/rateLimit.js";
import * as opportunityService from "../services/opportunityService.js";

const router = Router();

const listSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  geography: z.string().min(1).optional(),
  discipline: z.string().min(1).optional(),
  search: z.string().min(1).optional(),
  reviewStatus: z
    .enum(["pending_review", "verified", "rejected", "archived"])
    .optional()
});

const reviewSchema = z.object({
  reviewNotes: z.string().max(5000).optional()
});

router.use(requireAuth);
router.use(userRateLimit);

router.get("/", async (req, res, next) => {
  try {
    const query = listSchema.parse(req.query);
    const opportunities = await opportunityService.listOpportunities(query);
    res.json({ data: opportunities, meta: {} });
  } catch (error) {
    next(error);
  }
});

router.post("/refresh", async (_req, res, next) => {
  try {
    const refreshed = await opportunityService.refreshOpportunities(
      _req.user!.userId
    );
    res.json({ data: refreshed, meta: {} });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/verify", async (req, res, next) => {
  try {
    const body = reviewSchema.parse(req.body);
    const verified = await opportunityService.verifyOpportunity(
      String(req.params.id),
      req.user!.userId,
      body.reviewNotes
    );
    res.json({ data: verified, meta: {} });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/reject", async (req, res, next) => {
  try {
    const body = reviewSchema.parse(req.body);
    const rejected = await opportunityService.rejectOpportunity(
      String(req.params.id),
      req.user!.userId,
      body.reviewNotes
    );
    res.json({ data: rejected, meta: {} });
  } catch (error) {
    next(error);
  }
});

export default router;
