const express = require("express");
const {
  handleGetUsername,
  handleSetUsername,
} = require("../controllers/redis");

const router = express.Router();

router.get("/getusername", handleGetUsername);

router.post("/setusername", handleSetUsername);

module.exports = router;
