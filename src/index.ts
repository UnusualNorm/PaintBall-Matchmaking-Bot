import { SapphireClient } from "@sapphire/framework";
import { GatewayIntentBits, Partials } from "discord.js";
import { PrismaClient } from "@prisma/client";

import env from "./env.js";
import {
  getAvailableCoaches,
  partitionMatches,
  partitionTeams,
} from "./utils/matchmaking.js";
import { createMatch } from "./utils/matches.js";

const client = new SapphireClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Reaction],
});

client.prisma = new PrismaClient();
client.queue = [];
client.readyCoaches = [];

setInterval(async () => {
  if (client.queue.length < env.TEAM_SIZE * 2) return;

  const coaches = await getAvailableCoaches();
  if (coaches.length === 0) return;

  const players = await client.prisma.player.findMany({
    where: {
      id: {
        in: client.queue,
      },
    },
  });

  const groups = partitionMatches(players);
  for (const group of groups) {
    const teams = partitionTeams(group);
    createMatch(teams[0], teams[1], coaches[0]!);
  }

  client.queue = client.queue.splice(env.TEAM_SIZE * 2 * groups.length);
}, 10 * 1000);

client.login(env.DISCORD_TOKEN);
