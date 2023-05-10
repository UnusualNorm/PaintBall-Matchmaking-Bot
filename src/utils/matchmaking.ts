import type {
  Match,
  Player,
  PlayerMatchStat,
  ReadyMessage,
} from "@prisma/client";

import { container } from "@sapphire/framework";

import env from "../env.js";
import { cancelMatch } from "./matches.js";
import type { Message } from "discord.js";

export function partitionMatches(players: Player[]): Player[][] {
  // TODO: Implement actual rank-based matchmaking
  const matchCount = Math.floor(players.length / (env.TEAM_SIZE * 2));

  const groups = [];
  for (let i = 0; i < matchCount; i++)
    groups.push(players.splice(0, env.TEAM_SIZE * 2));

  return groups;
}

export function partitionTeams(players: Player[]): [Player[], Player[]] {
  // TODO: Implement actual rank-based team balancing
  const teams = [
    players.splice(0, env.TEAM_SIZE),
    players.splice(0, env.TEAM_SIZE),
  ] as [Player[], Player[]];

  return teams;
}

export async function getAvailableCoaches(): Promise<Player[]> {
  const coaches = await container.client.prisma.player.findMany({
    where: {
      coach: true,
      id: {
        in: container.client.readyCoaches,
      },
    },
  });

  const availableCoaches: Player[] = [];
  for (const coach of coaches) {
    const matches = await container.client.prisma.match.findMany({
      where: { coachId: coach.id, finished: false, cancelled: false },
    });

    if (matches.length === 0) availableCoaches.push(coach);
  }

  return coaches;
}

export async function fetchReadyMessage(
  readyMessage: ReadyMessage
): Promise<Message | undefined> {
  const channel = await container.client.users
    .createDM(readyMessage.playerId)
    .catch(() => null);
  if (!channel) return undefined;

  const message = await channel.messages
    .fetch(readyMessage.id)
    .catch(() => undefined);

  return message;
}

export async function generateReadyMessage(
  match: Match & { players: Player[]; playerStats: PlayerMatchStat[] },
  playerId: string
): Promise<string> {
  if (match.cancelled)
    return "The match has been cancelled... Better luck next time!";

  if (match.started)
    return "The match has been started, check the server for more information!";

  const team = match.playerStats.find(
    (stat) => stat.playerId === playerId
  )?.team;

  return `Match found! You are on ${team} team, along with ${(() => {
    const allies = match.playerStats.filter(
      (stat) => stat.playerId !== playerId && stat.team === team
    );
    return allies
      .map(
        (ally, i) =>
          `${i == allies.length - 1 ? "and " : ""}<@${ally.playerId}>`
      )
      .join(", ");
  })()}!
You will be playing against ${(() => {
    const enemies = match.playerStats.filter(
      (stat) => stat.playerId !== playerId && stat.team !== team
    );
    return enemies
      .map(
        (enemy, i) =>
          `${i == enemies.length - 1 ? "and " : ""}<@${enemy.playerId}>`
      )
      .join(", ");
  })()} on ${team === "blue" ? "red" : "blue"} t eam!
React with 👍 to ready up for the match! React with 👎 to cancel the match. (${
    match.readyPlayers.length
  }/${match.players.length})`;
}

export async function updateReadyMessages(
  match: Match & { players: Player[]; playerStats: PlayerMatchStat[] }
): Promise<boolean> {
  const readyMessages = await container.client.prisma.readyMessage.findMany({
    where: { matchId: match.id },
  });

  for (const readyMessage of readyMessages) {
    const message = await fetchReadyMessage(readyMessage);
    if (!message) {
      await container.client.prisma.readyMessage.delete({
        where: { id: readyMessage.id },
      });
      await cancelMatch(match.id);
      return false;
    }

    await message.edit(
      await generateReadyMessage(match, readyMessage.playerId)
    );
  }

  return true;
}

/**
 * @Ghost           1480 - 1551   W = +20    L = -6
 * @Copper          1552 - 1630   W = +18    L = -8
 * @Iron            1631 - 1710   W = +16    L = -10
 * @Bronze          1711 - 1790   W = +14    L = -12
 * @Silver          1791 - 1870   W = +12    L = -14
 * @Gold            1871 - 1950   W = +10    L = -15
 * @Platinum        1951 - 2030   W = +8     L = -15
 * @Diamond         2031 - 2110   W = +6     L = -15
 * @Master          2111 - N/A    W = +4     L = -16
 */

export enum Rank {
  Ghost,
  Copper,
  Iron,
  Bronze,
  Silver,
  Gold,
  Platinum,
  Diamond,
  Master,
}

export function getRank(points: number): Rank {
  if (points >= 2111) return Rank.Master;
  if (points >= 2031) return Rank.Diamond;
  if (points >= 1951) return Rank.Platinum;
  if (points >= 1871) return Rank.Gold;
  if (points >= 1791) return Rank.Silver;
  if (points >= 1711) return Rank.Bronze;
  if (points >= 1631) return Rank.Iron;
  if (points >= 1552) return Rank.Copper;
  return Rank.Ghost;
}

export function getIncrease(rank: Rank): number {
  switch (rank) {
    case Rank.Ghost:
      return 20;
    case Rank.Copper:
      return 18;
    case Rank.Iron:
      return 16;
    case Rank.Bronze:
      return 14;
    case Rank.Silver:
      return 12;
    case Rank.Gold:
      return 10;
    case Rank.Platinum:
      return 8;
    case Rank.Diamond:
      return 6;
    case Rank.Master:
      return 4;
  }
}

export function getDecrease(rank: Rank): number {
  switch (rank) {
    case Rank.Ghost:
      return 6;
    case Rank.Copper:
      return 8;
    case Rank.Iron:
      return 10;
    case Rank.Bronze:
      return 12;
    case Rank.Silver:
      return 14;
    case Rank.Gold:
      return 15;
    case Rank.Platinum:
      return 15;
    case Rank.Diamond:
      return 15;
    case Rank.Master:
      return 16;
  }
}
