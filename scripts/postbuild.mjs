import { spawnSync } from "node:child_process"
import { platform } from "node:process"

if (!process.env.DATABASE_URL_UNPOOLED) {
  console.log(
    "[postbuild] DATABASE_URL_UNPOOLED is not set; skipping prisma migrate deploy."
  )
  process.exit(0)
}

const prismaBinary =
  platform === "win32"
    ? "node_modules\\.bin\\prisma.cmd"
    : "node_modules/.bin/prisma"

const result = spawnSync(prismaBinary, ["migrate", "deploy"], {
  stdio: "inherit",
  shell: false,
})

if (result.error) {
  throw result.error
}

process.exit(result.status ?? 1)
