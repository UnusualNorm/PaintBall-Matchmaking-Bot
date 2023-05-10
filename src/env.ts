import "dotenv/config.js";
import env from "env-var";

export default {
  DISCORD_TOKEN: env.get("DISCORD_TOKEN").required(true).asString(),
  DATABASE_URL: env.get("DATABASE_URL").required(true).asUrlString(),

  TEAM_SIZE: env.get("TEAM_SIZE").default(4).asIntPositive(),

  ADMIN_ROLE: env.get("ADMIN_ROLE").required(true).asString(),
  WELCOME_CHANNEL: env.get("WELCOME_CHANNEL").required(true).asString(),
  MATCH_CATEGORY: env.get("MATCH_CATEGORY").required(true).asString(),

  // Seconds
  MATCHMAKING_READY_TIMEOUT: env
    .get("MATCHMAKING_READY_TIMEOUT")
    .default(10)
    .asIntPositive(),

  // Hours
  MATCHMAKING_MATCH_TIMEOUT: env
    .get("MATCHMAKING_MATCH_TIMEOUT")
    .default(1)
    .asFloatPositive(),
};
