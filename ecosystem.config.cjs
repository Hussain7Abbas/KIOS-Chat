/**
 * PM2 process file for production.
 * Prerequisite: `bun run build`
 *
 * Usage:
 *   pm2 start ecosystem.config.cjs
 *   pm2 save && pm2 startup
 */

const cwd = __dirname;

module.exports = {
  apps: [
    {
      name: "kios-chat",
      script: "bun",
      args: "run start",
      cwd,
      interpreter: "none",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      max_memory_restart: "4G",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "kios-chat-worker",
      script: "bun",
      args: "run src/workers/subagent-worker.ts",
      cwd,
      interpreter: "none",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
