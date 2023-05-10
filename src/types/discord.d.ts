import type { PrismaClient } from "@prisma/client";

declare module "discord.js" {
  interface Client {
    prisma: PrismaClient;
    queue: string[];
    readyCoaches: string[];
  }
}
