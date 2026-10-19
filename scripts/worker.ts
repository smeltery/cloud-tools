#!/usr/bin/env tsx

// Simple worker script to process SQS queue for file conversions
// This is a development solution - in production you'd use AWS Lambda or ECS/Fargate

// Load environment variables from .env.local (development) or .env (production)
import dotenv from "dotenv";
import { existsSync } from "fs";
import path from "path";

// Load environment variables in order of preference
const envFiles = [
  ".env.local",
  ".env.development.local",
  ".env.development",
  ".env",
];
for (const envFile of envFiles) {
  const envPath = path.resolve(process.cwd(), envFile);
  if (existsSync(envPath)) {
    console.log(`📋 Loading environment variables from: ${envFile}`);
    dotenv.config({ path: envPath });
    break;
  }
}

import { createFileProcessingWorker, QueueWorker } from "../lib/worker";

console.log("🚀 Starting Cloud Tools File Processing Worker...");
console.log("📋 This worker will poll the SQS queue for file conversion jobs");
console.log(
  "⚠️  This is a development worker - in production, use AWS Lambda or containers",
);
console.log("");

// Debug: Show loaded environment variables (without exposing secrets)
console.log("🔧 Environment Configuration:");
console.log(`   NODE_ENV: ${process.env.NODE_ENV || "undefined"}`);
console.log(`   AWS_REGION: ${process.env.AWS_REGION || "undefined"}`);
console.log(
  `   AWS_ENDPOINT_URL: ${process.env.AWS_ENDPOINT_URL || "undefined"}`,
);
console.log(`   S3_BUCKET_NAME: ${process.env.S3_BUCKET_NAME || "undefined"}`);
console.log(`   DDB_TABLE_NAME: ${process.env.DDB_TABLE_NAME || "undefined"}`);
console.log(`   SQS_QUEUE_NAME: ${process.env.SQS_QUEUE_NAME || "undefined"}`);
console.log(
  `   AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? "***" + process.env.AWS_ACCESS_KEY_ID.slice(-4) : "undefined"}`,
);
console.log(
  `   AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? "***" + process.env.AWS_SECRET_ACCESS_KEY.slice(-4) : "undefined"}`,
);
console.log("");

let worker: QueueWorker | null = null;

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Received SIGINT, shutting down worker gracefully...");
  if (worker) {
    worker.stop();
  }
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Received SIGTERM, shutting down worker gracefully...");
  if (worker) {
    worker.stop();
  }
  process.exit(0);
});

// Start the worker
(async () => {
  try {
    worker = await createFileProcessingWorker();
    console.log("✅ Worker created successfully!");
    console.log("💡 Press Ctrl+C to stop the worker");
    console.log("📊 Check the console for job processing logs");
    console.log("");

    await worker.start();
  } catch (error) {
    console.error("❌ Failed to start worker:", error);
    process.exit(1);
  }
})();
