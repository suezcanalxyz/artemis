import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { userRateLimit } from "../middleware/rateLimit.js";
import * as opportunitySourceService from "../services/opportunitySourceService.js";

const router = Router();

const kindSchema = z.enum(["api", "scrape", "manual"]);

const createSchema = z.object({
  name: z.string().min(1).max(200),
  kind: kindSchema,
  base_url: z.string().min(1).max(500),
  reliability: z.string().min(1).max(50).default("unknown"),
  description: z.string().max(4000).optional(),
  is_active: z.boolean().default(true)
});

const updateSchema = createSchema.partial();

router.use(requireAuth);
router.use(userRateLimit);

router.get("/", async (_req, res, next) => {
  try {
    const sources = await opportunitySourceService.listOpportunitySources();
    res.json({ data: sources, meta: {} });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const created = await opportunitySourceService.createOpportunitySource(
      req.user!.userId,
      body
    );
    res.status(201).json({ data: created, meta: {} });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const body = updateSchema.parse(req.body);
    const updated = await opportunitySourceService.updateOpportunitySource(
      String(req.params.id),
      req.user!.userId,
      body
    );
    res.json({ data: updated, meta: {} });
  } catch (error) {
    next(error);
  }
});

export default router;
