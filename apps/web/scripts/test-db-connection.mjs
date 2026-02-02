/**
 * Quick test: does Node + pg connect to the DB?
 * Run from apps/web: node scripts/test-db-connection.mjs
 * If this hangs, the issue is pg/connection. If it returns quickly, the issue is drizzle-kit introspect.
 */
import "dotenv/config";
import pg from "pg";

const url = process.env.DATABASE_URL ?? "postgresql://localhost:5432/sideform";
const parsed = new URL(url.replace(/^postgresql:\/\//, "https://"));
const host = parsed.hostname || "localhost";
const config = {
  host: host === "localhost" ? "127.0.0.1" : host,
  port: parsed.port ? Number(parsed.port) : 5432,
  user: parsed.username || undefined,
  password: parsed.password || undefined,
  database: parsed.pathname?.slice(1) || "sideform",
  ssl: false,
  connectionTimeoutMillis: 5000,
};

const pool = new pg.Pool(config);

(async () => {
  try {
    const start = Date.now();
    await pool.query("SELECT 1");
    console.log(`OK (${Date.now() - start}ms)`);
  } catch (e) {
    console.error("Connection failed:", e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
