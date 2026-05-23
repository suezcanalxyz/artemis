import { config } from "../config.js";
import { logger } from "../lib/logger.js";
import { startDomainHealthWorker } from "./domainHealth.js";
import { startDomainPollingWorker } from "./domainPolling.js";

export function startWorkers() {
  if (config.START_WORKERS !== "true") return [];
  const workers = [startDomainPollingWorker(), startDomainHealthWorker()];
  logger.info("Artemis workers started");
  return workers;
}
