const redis = require("../redisConnection/redisClient");

async function handleSetUsername(req, res) {
  const { username } = req.body;
  await redis.set("username", username);
  return res.status(200).json({ message: "Set username successfully" });
}

async function handleGetUsername(req, res) {
  const username = await redis.get("username", (err, result) => {
    if (err) console.error(err);
    else console.log("Stored username:", result);
  });

  return res.status(200).json({ username: username });
}

module.exports = { handleSetUsername, handleGetUsername };
