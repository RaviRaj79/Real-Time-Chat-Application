const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 3001,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/rt-chat",
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "dev_access_secret_change_me",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "dev_refresh_secret_change_me",
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || "15m",
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || "7d",
  aesSecret: process.env.AES_SECRET || "dev_aes_secret_change_me",
  redisUrl: process.env.REDIS_URL || "",
};

module.exports = config;