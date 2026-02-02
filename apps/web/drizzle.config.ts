import "dotenv/config";
import { defineConfig } from "drizzle-kit";

function dbCredentials() {
  const url = process.env.DATABASE_URL ?? "postgresql://localhost:5432/sideform";
  const parsed = new URL(url.replace(/^postgresql:\/\//, "https://"));
  const host = parsed.hostname || "localhost";
  return {
    host: host === "localhost" ? "127.0.0.1" : host,
    port: parsed.port ? Number(parsed.port) : 5432,
    user: parsed.username || undefined,
    password: parsed.password || undefined,
    database: parsed.pathname?.slice(1) || "sideform",
    ssl: false,
  };
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: dbCredentials(),
});
