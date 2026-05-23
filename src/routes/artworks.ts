import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { config } from "../config.js";
import { attachAuth, requireAuth } from "../middleware/auth.js";
import { userRateLimit } from "../middleware/rateLimit.js";
import * as artworkService from "../services/artworkService.js";
import * as mediaService from "../services/mediaService.js";

const router = Router();
const upload = multer({ dest: config.UPLOAD_ROOT });

const visibilityEnum = z.enum([
  "private",
  "shared_with_relationships",
  "project_only",
  "public"
]);

const listSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  visibility: visibilityEnum.optional(),
  medium: z.string().min(1).optional(),
  yearFrom: z.coerce.number().int().min(0).max(9999).optional(),
  yearTo: z.coerce.number().int().min(0).max(9999).optional(),
  search: z.string().min(1).optional()
});

const createSchema = z.object({
  title: z.string().min(1).max(200),
  year: z.coerce.number().int().min(0).max(9999),
  medium: z.string().min(1).max(200),
  description: z.string().max(4000).default(""),
  visibility: visibilityEnum.default("private")
});

const updateSchema = createSchema.partial();

const mediaUpdateSchema = z.object({
  sortOrder: z.coerce.number().int().min(0).optional(),
  isPrimary: z.boolean().optional()
});

router.get("/:id", attachAuth, async (req, res, next) => {
  try {
    const artwork = await artworkService.getArtwork(
      String(req.params.id),
      req.user?.profileId
    );
    res.json({ data: artwork, meta: {} });
  } catch (error) {
    next(error);
  }
});

router.use(requireAuth);
router.use(userRateLimit);

router.get("/", async (req, res, next) => {
  try {
    const query = listSchema.parse(req.query);
    const result = await artworkService.listArtworks({
      ...query,
      profileId: req.user!.profileId
    });
    res.json({ data: result.items, meta: { nextCursor: result.nextCursor } });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const artwork = await artworkService.createArtwork(
      req.user!.profileId,
      req.user!.userId,
      body
    );
    res.status(201).json({ data: artwork, meta: {} });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const body = updateSchema.parse(req.body);
    const artwork = await artworkService.updateArtwork(
      String(req.params.id),
      req.user!.profileId,
      req.user!.userId,
      body
    );
    res.json({ data: artwork, meta: {} });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await artworkService.deleteArtwork(
      String(req.params.id),
      req.user!.profileId,
      req.user!.userId
    );
    res.json({ data: { ok: true }, meta: {} });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/media", upload.single("file"), async (req, res, next) => {
  try {
    const asset = await mediaService.attachArtworkMedia(
      req.user!.profileId,
      String(req.params.id),
      req.user!.userId,
      req.file
    );
    res.status(201).json({ data: asset, meta: {} });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/media/:mediaId", async (req, res, next) => {
  try {
    const body = mediaUpdateSchema.parse(req.body);
    const asset = await mediaService.updateArtworkMedia(
      String(req.params.id),
      String(req.params.mediaId),
      req.user!.profileId,
      req.user!.userId,
      body
    );
    res.json({ data: asset, meta: {} });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id/media/:mediaId", async (req, res, next) => {
  try {
    await mediaService.deleteArtworkMedia(
      String(req.params.id),
      String(req.params.mediaId),
      req.user!.profileId,
      req.user!.userId
    );
    res.json({ data: { ok: true }, meta: {} });
  } catch (error) {
    next(error);
  }
});

export default router;
