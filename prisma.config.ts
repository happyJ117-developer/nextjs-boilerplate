import "dotenv/config"
import { defineConfig } from "prisma/config"

const directUrl = process.env.DATABASE_URL_UNPOOLED
if (!directUrl) throw new Error("DATABASE_URL_UNPOOLED environment variable is not set")

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // DATABASE_URL_UNPOOLED is the direct (non-pooled) Neon connection used by Prisma CLI
    // DATABASE_URL is the pooled connection used at runtime via @prisma/adapter-neon
    url: directUrl,
  },
})
