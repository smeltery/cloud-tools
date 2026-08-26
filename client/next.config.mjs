import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: resolve(__dirname, ".."),
  experimental: {
    externalDir: true,
  },
  turbopack: {
    resolveAlias: {
      "@/root-lib": resolve(__dirname, "..", "lib"),
    },
  },
};

export default nextConfig;
