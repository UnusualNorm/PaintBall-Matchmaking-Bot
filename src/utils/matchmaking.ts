import type { Player } from "@prisma/client";

import env from "../env.js";

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

export function updateReadyMessages(matchId: string) {

}