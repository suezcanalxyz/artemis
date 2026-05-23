import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import * as onboardingService from "../services/onboardingService.js";

const router = Router();

const completeSchema = z.object({
  role: z.enum(["artist", "gallery", "collector", "institution"]),
  plan: z.string().min(1),
  displayName: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().optional().or(z.literal("")),
  professionalFocus: z.string().max(240).optional(),
  practiceAreas: z.array(z.string().min(1).max(80)).max(12).optional(),
  workingLanguages: z.array(z.string().min(1).max(40)).max(12).optional(),
  strategicGoals: z.array(z.string().min(1).max(120)).max(12).optional(),
  collaborationInterests: z
    .array(z.string().min(1).max(120))
    .max(12)
    .optional(),
  privacyMode: z.enum(["private", "contacts", "public"]).optional()
});

const questionnaireSchema = completeSchema.omit({ role: true, plan: true });

router.get("/status", requireAuth, async (req, res, next) => {
  try {
    const status = await onboardingService.getOnboardingStatus(
      req.user!.profileId
    );
    res.json({ data: status, meta: {} });
  } catch (error) {
    next(error);
  }
});

router.post("/complete", requireAuth, async (req, res, next) => {
  try {
    const body = completeSchema.parse(req.body);
    const result = await onboardingService.completeOnboarding(
      req.user!.profileId,
      req.user!.userId,
      body as Parameters<typeof onboardingService.completeOnboarding>[2]
    );
    res.json({ data: result, meta: {} });
  } catch (error) {
    next(error);
  }
});

router.patch("/profile", requireAuth, async (req, res, next) => {
  try {
    const body = questionnaireSchema.parse(req.body);
    const result = await onboardingService.updateProfileQuestionnaire(
      req.user!.profileId,
      req.user!.userId,
      body
    );
    res.json({ data: result, meta: {} });
  } catch (error) {
    next(error);
  }
});

router.get("/plans", async (_req, res, next) => {
  try {
    res.json({
      data: onboardingService.ROLE_PLANS,
      meta: {}
    });
  } catch (error) {
    next(error);
  }
});

export default router;
