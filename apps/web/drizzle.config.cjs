const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL ?? "postgresql://localhost:5432/sideform";
  const parsed = new URL(url.replace(/^postgresql:\/\//, "https://"));
  parsed.searchParams.set("sslmode", "disable");
  parsed.searchParams.set("connect_timeout", "10");
  return parsed.toString().replace(/^https:\/\//, "postgresql://");
}

module.exports = {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: getDatabaseUrl(),
  },
};
