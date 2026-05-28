import { spawnSync } from "node:child_process"
import { platform } from "node:process"

const directUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL

if (!directUrl) {
  console.log(
    "[postbuild] DATABASE_URL_UNPOOLED or DATABASE_URL is not set; skipping prisma migrate deploy."
  )
  process.exit(0)
}

const prismaBinary =
  platform === "win32"
    ? "node_modules\\.bin\\prisma.cmd"
    : "node_modules/.bin/prisma"

const result = spawnSync(prismaBinary, ["migrate", "deploy"], {
  env: {
    ...process.env,
    DATABASE_URL: directUrl,
  },
  stdio: "inherit",
  shell: false,
})

if (result.error) {
  throw result.error
}

process.exit(result.status ?? 1)
