import { createApp } from "./app.js";
import { config } from "./config.js";
import { logger } from "./lib/logger.js";
import { startWorkers } from "./workers/index.js";

const app = createApp();
startWorkers();

app.listen(config.PORT, () => {
  logger.info({ port: config.PORT }, "Artemis server listening");
});
