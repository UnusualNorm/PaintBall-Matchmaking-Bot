import {
  ChannelType,
  type CategoryChannel,
  PermissionFlagsBits,
  OverwriteType,
} from "discord.js";

import { container } from "@sapphire/framework";

import env from "../env.js";

export async function startMatch(matchId: number) {
  const match = await container.client.prisma.match.update({
    where: { id: matchId },
    data: {
      started: true,
    },
    include: {
      players: true,
      coach: true,
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
        permissionOverwrites: match.players.map((player) => ({
          id: player.discordId,
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

      const messageContent = `Welcome red team, game on! <@${match.coach.discordId}> will be with you shortly to sort out the details. In the meantime, grab a snack and strategize with your team!`;
      const message = await channel.send(messageContent + "\n<@everyone>");
      await message.edit(messageContent);
    },
    async () => {
      const channel = await category.guild.channels.create({
        name: `Match #${match.id} - Blue Team`,
        type: ChannelType.GuildVoice,
        parent: category,
        // TODO: Replace with correct team
        permissionOverwrites: match.players.map((player) => ({
          id: player.discordId,
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

      const messageContent = `Welcome blue team, game on! <@${match.coach.discordId}> will be with you shortly to sort out the details. In the meantime, grab a snack and strategize with your team!`;
      const message = await channel.send(messageContent + "\n<@everyone>");
      await message.edit(messageContent);
    },
  ]);
}
