import "dotenv/config.js";
import { get } from "env-var";

export default {
  DISCORD_TOKEN: get("DISCORD_TOKEN").required(true).asString(),
  DATABASE_URL: get("DATABASE_URL").required(true).asUrlString(),

  TEAM_SIZE: get("TEAM_SIZE").default(4).asIntPositive(),

  WELCOME_CHANNEL: get("WELCOME_CHANNEL").required(true).asString(),
  MATCH_CATEGORY: get("MATCH_CATEGORY").required(true).asString(),

  // Seconds
  MATCHMAKING_READY_TIMEOUT: get("MATCHMAKING_READY_TIMEOUT")
    .default(10)
    .asIntPositive(),

  // Hours
  MATCHMAKING_MATCH_TIMEOUT: get("MATCHMAKING_MATCH_TIMEOUT")
    .default(1)
    .asFloatPositive(),
};
