const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const config = require("./config/env");
const { apiLimiter } = require("./middleware/rateLimiters");
const { notFound, errorHandler } = require("./middleware/error");

const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.clientOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));
app.use(apiLimiter);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/users", userRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;