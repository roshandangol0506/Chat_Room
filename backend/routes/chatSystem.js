const express = require("express");
const {
  handleGetRoom,
  handleDeleteRoom,
} = require("../controllers/chatSystem");

const router = express.Router();

router.get("/getroom", handleGetRoom);
router.delete("/deleteroom/:room_id", handleDeleteRoom);

module.exports = router;
