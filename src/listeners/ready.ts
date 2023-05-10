import type { MessageReaction, User } from "discord.js";
import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "@sapphire/framework";

import { startMatch } from "../utils/matches.js";
import { updateReadyMessages } from "../utils/matchmaking.js";

@ApplyOptions<Listener.Options>({
  name: "ready",
  event: "messageReactionAdd",
})
export class ReadyListener extends Listener {
  public async run(reaction: MessageReaction, user: User) {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch();
    if (reaction.emoji.name !== "👍" && reaction.emoji.name !== "👎") return;
    const readied = reaction.emoji.name === "👍";

    const readyMessage =
      await this.container.client.prisma.readyMessage.findFirst({
        where: { id: reaction.message.id },
      });

    if (!readyMessage) return;
    const match = await this.container.client.prisma.match.findFirst({
      where: { id: readyMessage.matchId },
      include: { players: true, playerStats: true },
    });

    if (!match) {
      await this.container.client.prisma.readyMessage.delete({
        where: { id: readyMessage.id },
      });
      return;
    }

    if (match.cancelled || match.started) return;

    const currentlyReady = !!match.readyPlayers.includes(user.id);
    if (readied && currentlyReady) return;

    if (readied) {
      await this.container.client.prisma.match.update({
        where: { id: readyMessage.matchId },
        data: {
          readyPlayers: {
            push: user.id,
          },
        },
      });

      if (match.readyPlayers.length + 1 === match.players.length)
        await startMatch(readyMessage.matchId);
    } else {
      const matchUpdate = {
        where: { id: readyMessage.matchId },
        data: {
          cancelled: true,
        },
      };

      if (currentlyReady)
        (matchUpdate.data as any).readyPlayers = {
          set: match.readyPlayers.filter((id) => id !== user.id),
        };

      await this.container.client.prisma.match.update(matchUpdate);
      match.cancelled = true;
    }

    await updateReadyMessages(match);
  }
}
