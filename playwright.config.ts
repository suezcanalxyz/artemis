import { config as loadEnv } from "dotenv";
import { defineConfig } from "@playwright/test";

loadEnv();

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://localhost:5173"
  },
  webServer: [
    {
      command:
        'cmd /c "set PLAYWRIGHT=true&& set PORT=3300&& set APP_URL=http://localhost:3300&& set WEB_URL=http://localhost:5173&& tsx src/server.ts"',
      port: 3300,
      reuseExistingServer: true,
      timeout: 120000
    },
    {
      command:
        'cmd /c "set APP_URL=http://localhost:3300&& npm.cmd run dev:web"',
      port: 5173,
      reuseExistingServer: true,
      timeout: 120000
    }
  ]
});
