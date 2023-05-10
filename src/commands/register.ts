import { ApplyOptions } from "@sapphire/decorators";
import { Command, RegisterBehavior } from "@sapphire/framework";
import type { ChatInputCommandInteraction } from "discord.js";

@ApplyOptions<Command.Options>({
  name: "register",
})
export class RegisterCommand extends Command {
  override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName("register")
          .setDescription("Register to play in matches")
          .addStringOption((option) =>
            option
              .setName("username")
              .setDescription("Your username")
              .setRequired(true)
          ),

      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      }
    );
  }

  override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const username = interaction.options.getString("username", true);
    await this.container.client.prisma.player.upsert({
      where: { id: interaction.user.id },
      create: {
        id: interaction.user.id,
        username,
      },
      update: {
        username,
      },
    });

    await interaction.reply({
      content: "Your information has been updated!",
      ephemeral: true,
    });
  }
}
