import { Queue } from "bullmq";
import { bullRedis } from "./redis.js";

const connection = bullRedis.duplicate();

export const domainVerificationQueue = new Queue("domain-verification", {
  connection
});

export const domainHealthQueue = new Queue("domain-health", {
  connection
});
