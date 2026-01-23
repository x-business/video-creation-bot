import { defineConfig } from "drizzle-kit";

// Note: DATABASE_URL is only required if you're using PostgreSQL
// Currently, the app uses in-memory storage, so this config is only needed for db:push
if (!process.env.DATABASE_URL) {
  console.warn("Warning: DATABASE_URL not set. Database operations will fail.");
  console.warn("Set DATABASE_URL if you want to use PostgreSQL instead of in-memory storage.");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://localhost:5432/videoflow",
  },
});
