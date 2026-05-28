import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

let prismaClient: PrismaClient | undefined = globalForPrisma.prisma

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set")
  }
  const adapter = new PrismaNeon({ connectionString })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  })
}

function getPrismaClient() {
  if (!prismaClient) {
    prismaClient = createPrismaClient()
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = prismaClient
    }
  }

  return prismaClient
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient()
    const value = Reflect.get(client, prop)

    return typeof value === "function" ? value.bind(client) : value
  },
}) as PrismaClient
