import postgres from "postgres";
import { config } from "../config.js";

export const sql = postgres(config.DATABASE_URL, {
  max: config.NODE_ENV === "development" ? 10 : 20
});
