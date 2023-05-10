import {
  ChannelType,
  type CategoryChannel,
  PermissionFlagsBits,
  OverwriteType,
} from "discord.js";

import { container } from "@sapphire/framework";

import env from "../env.js";
import type { Player } from "@prisma/client";
import { generateReadyMessage } from "./matchmaking.js";

export async function cancelMatch(matchId: number) {
  await container.client.prisma.match.update({
    where: { id: matchId },
    data: {
      cancelled: true,
    },
  });
}

export async function createMatch(
  red: Player[],
  blue: Player[],
  coach: Player
) {
  const match = await container.client.prisma.match.create({
    data: {
      coachId: coach.id,
      players: {
        connect: [
          ...red.map((player) => ({
            id: player.id,
          })),
          ...blue.map((player) => ({
            id: player.id,
          })),
        ],
      },
      playerStats: {
        create: [
          ...red.map((player) => ({
            playerId: player.id,
            team: "red",
          })),
          ...blue.map((player) => ({
            playerId: player.id,
            team: "blue",
          })),
        ],
      },
    },
    include: {
      players: true,
      playerStats: true,
    },
  });

  for (const player of match.players) {
    const user = await container.client.users.fetch(player.id);
    const channel = await user.createDM();
    const message = await channel.send(
      await generateReadyMessage(match, player.id)
    );

    await container.client.prisma.readyMessage.create({
      data: {
        id: message.id,
        playerId: player.id,
        matchId: match.id,
      },
    });

    await message.react("👍");
    await message.react("👎");
  }
}

export async function startMatch(matchId: number) {
  const match = await container.client.prisma.match.update({
    where: { id: matchId },
    data: {
      started: true,
    },
    include: {
      playerStats: true,
    },
  });

  const category = (await container.client.channels.fetch(
    env.MATCH_CATEGORY
  )) as CategoryChannel;

  Promise.all([
    async () => {
      const channel = await category.guild.channels.create({
        name: `Match #${match.id} - Red Team`,
        type: ChannelType.GuildVoice,
        parent: category,
        // TODO: Replace with correct team
        permissionOverwrites: match.playerStats
          .filter((player) => player.team === "red")
          .map((player) => ({
            id: player.playerId,
            type: OverwriteType.Member,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.Speak,
              PermissionFlagsBits.Stream,
            ],
          })),
      });

      const messageContent = `Welcome red team, game on! <@${match.coachId}> will be with you shortly to sort out the details. In the meantime, grab a snack and strategize with your team!`;
      const message = await channel.send(messageContent + "\n<@everyone>");
      await message.edit(messageContent);
    },
    async () => {
      const channel = await category.guild.channels.create({
        name: `Match #${match.id} - Blue Team`,
        type: ChannelType.GuildVoice,
        parent: category,
        // TODO: Replace with correct team
        permissionOverwrites: match.playerStats
          .filter((player) => player.team === "blue")
          .map((player) => ({
            id: player.playerId,
            type: OverwriteType.Member,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.Speak,
              PermissionFlagsBits.Stream,
            ],
          })),
      });

      const messageContent = `Welcome blue team, game on! <@${match.coachId}> will be with you shortly to sort out the details. In the meantime, grab a snack and strategize with your team!`;
      const message = await channel.send(messageContent + "\n<@everyone>");
      await message.edit(messageContent);
    },
  ]);
}
