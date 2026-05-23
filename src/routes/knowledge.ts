import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { userRateLimit } from "../middleware/rateLimit.js";
import * as knowledgeService from "../services/knowledgeService.js";

const router = Router();

const jsonRecordSchema = z.record(z.unknown());

const createSchema = z.object({
  title: z.string().min(1).max(200),
  kind: z.string().min(1).max(80),
  body: z.string().min(1).max(100_000),
  metadata: jsonRecordSchema.default({}),
  review_status: z.string().min(1).max(40).default("draft")
});

const updateSchema = createSchema.partial();

const searchSchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(50).default(10)
});

const attachChunkSchema = z.object({
  chunk_id: z.string().uuid()
});

router.use(requireAuth);
router.use(userRateLimit);

router.get("/", async (req, res, next) => {
  try {
    const documents = await knowledgeService.listKnowledgeDocuments(
      req.user!.profileId
    );
    res.json({ data: documents, meta: {} });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const created = await knowledgeService.createKnowledgeDocument(
      req.user!.profileId,
      req.user!.userId,
      body
    );
    res.status(201).json({ data: created, meta: {} });
  } catch (error) {
    next(error);
  }
});

router.get("/search", async (req, res, next) => {
  try {
    const query = searchSchema.parse(req.query);
    const results = await knowledgeService.searchKnowledge(
      req.user!.profileId,
      query.q,
      query.limit
    );
    res.json({ data: results, meta: {} });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const document = await knowledgeService.getKnowledgeDocument(
      String(req.params.id),
      req.user!.profileId
    );
    res.json({ data: document, meta: {} });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const body = updateSchema.parse(req.body);
    const updated = await knowledgeService.updateKnowledgeDocument(
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

router.post("/requests/:id/attach-chunk", async (req, res, next) => {
  try {
    const body = attachChunkSchema.parse(req.body);
    await knowledgeService.attachKnowledgeChunkToRequest(
      String(req.params.id),
      req.user!.profileId,
      req.user!.userId,
      body.chunk_id
    );
    res.json({ data: { ok: true }, meta: {} });
  } catch (error) {
    next(error);
  }
});

export default router;
