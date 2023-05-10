import { ApplyOptions } from "@sapphire/decorators";
import { Command, RegisterBehavior } from "@sapphire/framework";
import type { ChatInputCommandInteraction } from "discord.js";

@ApplyOptions<Command.Options>({
  name: "queue",
})
export class QueueCommand extends Command {
  override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName("queue")
          .setDescription("Queue for a match")
          .addBooleanOption((option) =>
            option
              .setName("queued")
              .setDescription("Whether you want to queue or not")
          ),

      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      }
    );
  }

  override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const queued =
      interaction.options.getBoolean("queued") ??
      !this.container.client.queue.includes(interaction.user.id);

    const player = await this.container.client.prisma.player.findFirst({
      where: { id: interaction.user.id },
      include: {
        matches: {
          where: { finished: false, cancelled: false },
        },
      },
    });

    if (!player) {
      await interaction.reply({
        content: "You are not registered! Use `/register` to register.",
        ephemeral: true,
      });
      return;
    }

    if (player.matches.length > 0) {
      await interaction.reply({
        content:
          "You are currently in a match! Please contact an admin if this is a mistake.",
        ephemeral: true,
      });
      return;
    }

    if (queued) {
      if (this.container.client.queue.includes(player.id)) {
        await interaction.reply({
          content: "You are already queued!",
          ephemeral: true,
        });
        return;
      }

      this.container.client.queue.push(player.id);

      await interaction.reply({
        content: "You have been queued!",
        ephemeral: true,
      });

      this.container.logger.info(
        `Player ${player.id} (${player.username}) queued`
      );
    } else {
      if (!this.container.client.queue.includes(player.id)) {
        await interaction.reply({
          content: "You are not queued!",
          ephemeral: true,
        });
        return;
      }

      this.container.client.queue = this.container.client.queue.filter(
        (id) => id !== player.id
      );

      await interaction.reply({
        content: "You have been unqueued!",
        ephemeral: true,
      });

      this.container.logger.info(
        `Player ${player.id} (${player.username}) unqueued`
      );
    }
  }
}
