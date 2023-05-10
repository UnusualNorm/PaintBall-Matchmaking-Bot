import { ApplyOptions } from "@sapphire/decorators";
import { RegisterBehavior } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import type { ChatInputCommandInteraction } from "discord.js";
import env from "../env.js";

@ApplyOptions<Subcommand.Options>({
  name: "coach",
  subcommands: [
    {
      name: "add",
      chatInputRun: "add",
    },
    {
      name: "remove",
      chatInputRun: "remove",
    },
    {
      name: "list",
      chatInputRun: "list",
    },
    {
      name: "ready",
      chatInputRun: "ready",
    },
    {
      name: "unready",
      chatInputRun: "unready",
    },
  ],
})
export class RegisterCommand extends Subcommand {
  override registerApplicationCommands(registry: Subcommand.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName("coach")
          .setDescription("Manage to match coaches")
          .addSubcommand((option) =>
            option
              .setName("add")
              .setDescription("Register a coach")
              .addUserOption((option) =>
                option
                  .setName("user")
                  .setDescription("The user to register as a coach")
                  .setRequired(true)
              )
          )
          .addSubcommand((option) =>
            option
              .setName("remove")
              .setDescription("Remove a coach")
              .addUserOption((option) =>
                option
                  .setName("user")
                  .setDescription("The user to remove as a coach")
                  .setRequired(true)
              )
          )
          .addSubcommand((option) =>
            option.setName("list").setDescription("List all coaches")
          )
          .addSubcommand((option) =>
            option
              .setName("ready")
              .setDescription("Mark yourself as ready to coach")
          )
          .addSubcommand((option) =>
            option
              .setName("unready")
              .setDescription("Mark yourself as not ready to coach")
          ),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      }
    );
  }

  async add(interaction: ChatInputCommandInteraction) {
    const member = await interaction.guild?.members.fetch(interaction.user.id);

    if (!member || !member.roles.cache.has(env.ADMIN_ROLE)) {
      await interaction.reply({
        content: "You are not an admin!",
        ephemeral: true,
      });
      return;
    }

    const user = interaction.options.getUser("user", true);
    await this.container.client.prisma.player.update({
      where: { id: user.id },
      data: {
        coach: true,
      },
    });

    await interaction.reply({
      content: `You have registered ${user.username} as a coach!`,
      ephemeral: true,
    });
  }

  async remove(interaction: ChatInputCommandInteraction) {
    const member = await interaction.guild?.members.fetch(interaction.user.id);

    if (!member || !member.roles.cache.has(env.ADMIN_ROLE)) {
      await interaction.reply({
        content: "You are not an admin!",
        ephemeral: true,
      });
      return;
    }

    const user = interaction.options.getUser("user", true);
    await this.container.client.prisma.player.update({
      where: { id: user.id },
      data: {
        coach: false,
      },
    });

    await interaction.reply({
      content: `You have removed ${user.username} as a coach!`,
      ephemeral: true,
    });
  }

  async list(interaction: ChatInputCommandInteraction) {
    const coaches = await this.container.client.prisma.player.findMany({
      where: { coach: true },
    });

    await interaction.reply({
      content: `Coaches: ${coaches
        .map((coach) => `<@${coach.id}>`)
        .join(", ")}`,
      ephemeral: true,
    });
  }

  async ready(interaction: ChatInputCommandInteraction) {
    const coach = await this.container.client.prisma.player.findFirst({
      where: { id: interaction.user.id },
    });

    if (!coach?.coach) {
      await interaction.reply({
        content: "You are not a coach!",
        ephemeral: true,
      });
      return;
    }

    if (this.container.client.readyCoaches.includes(coach.id)) {
      await interaction.reply({
        content: "You are already ready!",
        ephemeral: true,
      });
      return;
    }

    this.container.client.readyCoaches.push(coach.id);

    await interaction.reply({
      content: "You are now ready!",
      ephemeral: true,
    });
  }

  async unready(interaction: ChatInputCommandInteraction) {
    const coach = await this.container.client.prisma.player.findFirst({
      where: { id: interaction.user.id },
    });

    if (!coach?.coach) {
      await interaction.reply({
        content: "You are not a coach!",
        ephemeral: true,
      });
      return;
    }

    if (!this.container.client.readyCoaches.includes(coach.id)) {
      await interaction.reply({
        content: "You are not ready!",
        ephemeral: true,
      });
      return;
    }

    this.container.client.readyCoaches =
      this.container.client.readyCoaches.filter((id) => id !== coach.id);

    await interaction.reply({
      content: "You are no longer ready!",
      ephemeral: true,
    });
  }
}
