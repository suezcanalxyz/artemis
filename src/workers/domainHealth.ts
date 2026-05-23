import { Worker } from "bullmq";
import { bullRedis } from "../lib/redis.js";
import { logger } from "../lib/logger.js";
import { runDomainHealthCheck } from "../services/domainHealthService.js";

export function startDomainHealthWorker() {
  return new Worker(
    "domain-health",
    async (job) => {
      const result = await runDomainHealthCheck(String(job.data.domainId));
      logger.info(
        { domainId: job.data.domainId, health: result?.id ?? null },
        "Domain health checked"
      );
      return result;
    },
    { connection: bullRedis.duplicate() }
  );
}
