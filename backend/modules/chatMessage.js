const mongoose = require("mongoose");

const newMessage = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  roomName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "chatRoom",
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
});

const Message = mongoose.model("message", newMessage);

module.exports = Message;
