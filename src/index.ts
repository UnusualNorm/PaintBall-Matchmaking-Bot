import { SapphireClient } from "@sapphire/framework";
import { GatewayIntentBits, Partials } from "discord.js";
import { PrismaClient } from "@prisma/client";

import env from "./env.js";

const client = new SapphireClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Reaction],
});

client.prisma = new PrismaClient();

client.login(env.DISCORD_TOKEN);
