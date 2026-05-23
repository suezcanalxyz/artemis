import IORedis from "ioredis";
import { config } from "../config.js";

export const redis = new IORedis(config.REDIS_URL, {
  keyPrefix: config.REDIS_KEY_PREFIX,
  maxRetriesPerRequest: null
});

export const redisPubSub = new IORedis(config.REDIS_URL, {
  keyPrefix: config.REDIS_KEY_PREFIX,
  maxRetriesPerRequest: null
});

export const bullRedis = new IORedis(config.REDIS_URL, {
  maxRetriesPerRequest: null
});
