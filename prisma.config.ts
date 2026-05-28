import "dotenv/config"
import { defineConfig } from "prisma/config"

const directUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL

export default defineConfig({
  schema: "prisma/schema.prisma",
  ...(directUrl
    ? {
        datasource: {
          // Prefer the direct (non-pooled) Neon connection for Prisma CLI, but
          // allow DATABASE_URL as a fallback when only the pooled URL exists.
          url: directUrl,
        },
      }
    : {}),
})
