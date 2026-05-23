import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { userRateLimit } from "../middleware/rateLimit.js";
import * as artistRequestService from "../services/artistRequestService.js";

const router = Router();

const requestTypeSchema = z.enum([
  "opportunity_research",
  "funding_research",
  "tech_rider",
  "procedure",
  "presentation",
  "website_update"
]);

const requestStatusSchema = z.enum([
  "draft",
  "ready_for_processing",
  "processing",
  "needs_review",
  "completed",
  "archived"
]);

const confidenceSchema = z.enum([
  "unverified",
  "partially_verified",
  "verified"
]);
const jsonRecordSchema = z.record(z.unknown());

const createSchema = z.object({
  title: z.string().min(1).max(200),
  type: requestTypeSchema,
  status: requestStatusSchema.optional(),
  priority: z.string().min(1).max(50).default("normal"),
  structured_input: jsonRecordSchema.default({}),
  human_notes: z.string().max(5000).optional()
});

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  type: requestTypeSchema.optional(),
  status: requestStatusSchema.optional(),
  priority: z.string().min(1).max(50).optional(),
  structured_input: jsonRecordSchema.optional(),
  human_notes: z.string().max(5000).nullable().optional(),
  confidence_level: confidenceSchema.optional()
});

const attachOpportunitySchema = z.object({
  opportunity_id: z.string().uuid()
});

router.use(requireAuth);
router.use(userRateLimit);

router.get("/", async (req, res, next) => {
  try {
    const requests = await artistRequestService.listRequests(
      req.user!.profileId
    );
    res.json({ data: requests, meta: {} });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const created = await artistRequestService.createRequest(
      req.user!.profileId,
      req.user!.userId,
      body
    );
    res.status(201).json({ data: created, meta: {} });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const artistRequest = await artistRequestService.getRequest(
      String(req.params.id),
      req.user!.profileId
    );
    res.json({ data: artistRequest, meta: {} });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const body = updateSchema.parse(req.body);
    const updated = await artistRequestService.updateRequest(
      String(req.params.id),
      req.user!.profileId,
      req.user!.userId,
      body
    );
    res.json({ data: updated, meta: {} });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/mark-ready", async (req, res, next) => {
  try {
    const updated = await artistRequestService.markReady(
      String(req.params.id),
      req.user!.profileId,
      req.user!.userId
    );
    res.json({ data: updated, meta: {} });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/generate-draft", async (req, res, next) => {
  try {
    const updated = await artistRequestService.generateDraft(
      String(req.params.id),
      req.user!.profileId,
      req.user!.userId
    );
    res.json({ data: updated, meta: {} });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/sources/opportunities", async (req, res, next) => {
  try {
    const body = attachOpportunitySchema.parse(req.body);
    const updated = await artistRequestService.attachOpportunitySource(
      String(req.params.id),
      req.user!.profileId,
      req.user!.userId,
      body.opportunity_id
    );
    res.json({ data: updated, meta: {} });
  } catch (error) {
    next(error);
  }
});

export default router;
