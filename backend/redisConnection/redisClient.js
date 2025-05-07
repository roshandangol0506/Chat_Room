const Redis = require("ioredis");

const dotenv = require("dotenv");

dotenv.config();

const redis = new Redis({
  host: process.env.Redis_host,
  port: process.env.Redis_PORT,
});

redis.on("connect", () => console.log("Connected to Redis"));
redis.on("error", (err) => console.error("Redis Error:", err));

module.exports = redis;
