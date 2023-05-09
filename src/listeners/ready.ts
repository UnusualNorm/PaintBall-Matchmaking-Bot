import type { MessageReaction, User } from "discord.js";
import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "@sapphire/framework";

import { startMatch } from "../utils/matches.js";

@ApplyOptions<Listener.Options>({
  name: "ready",
  event: "messageReactionAdd",
})
export class ReadyListener extends Listener {
  public async run(reaction: MessageReaction, user: User) {
    if (reaction.partial) await reaction.fetch();
    if (reaction.emoji.name !== "👍" && reaction.emoji.name !== "👎") return;
    const readied = reaction.emoji.name === "👍";

    const readyMessage =
      await this.container.client.prisma.readyMessage.findFirst({
        where: { messageId: reaction.message.id },
        include: {
          match: {
            include: {
              readyPlayers: true,
              players: true,
            },
          },
        },
      });

    if (!readyMessage) return;
    if (readyMessage.match.cancelled || readyMessage.match.started) return;

    const currentlyReady = !!readyMessage.match.readyPlayers.find(
      (player) => player.discordId === user.id
    );

    if (readied && currentlyReady) return;

    if (readied) {
      await this.container.client.prisma.match.update({
        where: { id: readyMessage.matchId },
        data: {
          readyPlayers: {
            connect: {
              discordId: user.id,
            },
          },
        },
      });

      if (
        readyMessage.match.readyPlayers.length + 1 ===
        readyMessage.match.players.length
      )
        startMatch(readyMessage.matchId);
    } else {
      const matchUpdate = {
        where: { id: readyMessage.matchId },
        data: {
          cancelled: true,
        },
      };

      if (currentlyReady)
        (matchUpdate.data as any).readyPlayers = {
          disconnect: {
            discordId: user.id,
          },
        };

      await this.container.client.prisma.match.update(matchUpdate);
    }
  }
}
