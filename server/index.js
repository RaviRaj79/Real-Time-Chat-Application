const http = require("http");
const { Server } = require("socket.io");

const config = require("./src/config/env");
const connectDB = require("./src/config/db");
const app = require("./src/app");
const setupSocket = require("./src/socket");

async function enableRedisAdapter(io) {
  if (!config.redisUrl) {
    return;
  }

  try {
    const { createAdapter } = require("@socket.io/redis-adapter");
    const { createClient } = require("redis");

    const pubClient = createClient({ url: config.redisUrl });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    console.log("Redis adapter enabled for Socket.IO");
  } catch (error) {
    console.error("Redis adapter setup failed:", error.message);
  }
}

async function bootstrap() {
  await connectDB();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: config.clientOrigin,
      methods: ["GET", "POST", "PATCH", "DELETE"],
      credentials: true,
    },
  });

  await enableRedisAdapter(io);
  setupSocket(io);

  server.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Bootstrap failed:", error);
  process.exit(1);
});