import { Worker } from "bullmq";
import { bullRedis } from "../lib/redis.js";
import { logger } from "../lib/logger.js";
import { verifyDomain } from "../services/domainService.js";

export function startDomainPollingWorker() {
  return new Worker(
    "domain-verification",
    async (job) => {
      const result = await verifyDomain(String(job.data.domainId));
      logger.info(
        {
          domainId: job.data.domainId,
          verificationOk:
            "verification_ok" in result
              ? result.verification_ok
              : result.is_verified
        },
        "Domain polled"
      );
      return result;
    },
    { connection: bullRedis.duplicate() }
  );
}
